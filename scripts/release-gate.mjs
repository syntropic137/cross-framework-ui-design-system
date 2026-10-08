#!/usr/bin/env node
// Release gate for `main` -> `release` PRs (see docs/distribution.md, ADR-0009).
//
// Fails, with one line per problem, when the release this PR would cut is not
// cleanly publishable:
//   1. the publishable packages are not on one lockstep version
//   2. the version is not valid semver
//   3. a git tag v<version> already exists, locally or on origin
//   4. any publishable package already has <version> on the npm registry
//   5. CHANGELOG.md has no `## <version>` / `## [<version>]` heading
// A registry or git-remote error fails the gate; nothing is ever skipped.
//
// The checks are pure functions (exported, unit-tested in release-gate.test.mjs);
// `main` wires them to real git, npm and the filesystem.
//
// Zero dependencies (Node built-ins only).
//   pnpm release:gate

import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { findPublishable, checkLockstep, checkPackageSet } from "./lib/publishable-packages.mjs";

// Semver 2.0.0 (https://semver.org), the official regex.
const SEMVER =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

export function checkSemver(version) {
  return SEMVER.test(version) ? [] : [`version "${version}" is not valid semver`];
}

/** `localTags` / `remoteTags`: tag names (e.g. "v0.1.0") present locally / on origin. */
export function checkTag(version, localTags, remoteTags) {
  const tag = `v${version}`;
  const where = [
    localTags.includes(tag) ? "locally" : null,
    remoteTags.includes(tag) ? "on origin" : null,
  ].filter(Boolean);
  if (where.length === 0) return [];
  return [
    `tag ${tag} already exists (${where.join(" and ")}); delete it or bump the version ` +
      `(git push origin :refs/tags/${tag})`,
  ];
}

/** The only registry the release publishes to; every query names it explicitly. */
export const NPM_REGISTRY = "https://registry.npmjs.org/";
const SCOPE = "@syntropic137";

// npm's validate-npm-package-name rules for a scoped name (lowercase, url-safe).
const SCOPED_NAME = /^@[a-z0-9-~][a-z0-9-._~]*\/[a-z0-9-~][a-z0-9-._~]*$/;

export function checkPackageName(name) {
  return typeof name === "string" && SCOPED_NAME.test(name)
    ? []
    : [`package name ${JSON.stringify(name)} is not a valid scoped npm package name`];
}

/**
 * argv for `npm view`. Pins the registry (global and the @syntropic137 scope, so
 * user/project .npmrc overrides cannot redirect the query) and ends options with
 * `--` so a name can never be read as a flag.
 */
export function npmViewArgs(name, version) {
  return [
    "view",
    "--json",
    `--registry=${NPM_REGISTRY}`,
    `--${SCOPE}:registry=${NPM_REGISTRY}`,
    "--",
    `${name}@${version}`,
    "version",
  ];
}

/** The spawn env with every npm_config_*registry override removed (npm reads env case-insensitively). */
export function npmViewEnv(env) {
  return Object.fromEntries(
    Object.entries(env).filter(([k]) => !/^npm_config_.*registry$/i.test(k)),
  );
}

/**
 * Classify one `npm view --json <name>@<version> version` result.
 * Returns "published" | "absent" | { error: string }.
 * Only a structured `{ "error": { "code": "E404" } }` means "absent"; anything
 * else that is not the exact version (empty output, other codes, junk) is an error.
 */
export function classifyNpmView(version, { status, stdout = "", stderr = "", error }) {
  if (error) return { error: String(error.message ?? error) };
  const out = stdout.trim();
  let parsed;
  try {
    parsed = JSON.parse(out);
  } catch {
    const hint = out || stderr.trim().split("\n")[0] || `exit ${status}`;
    return { error: `unparseable npm view output (exit ${status}): ${JSON.stringify(hint.slice(0, 200))}` };
  }
  const code = parsed && typeof parsed === "object" && parsed.error ? parsed.error.code : undefined;
  if (status === 0 && code === undefined) {
    if (parsed === version) return "published";
    return { error: `unexpected npm view output: ${JSON.stringify(out.slice(0, 200))}` };
  }
  if (status !== 0 && code === "E404") return "absent";
  const summary = parsed?.error?.summary ? `: ${String(parsed.error.summary).split("\n")[0]}` : "";
  return { error: `${code ?? `exit ${status}`}${summary}` };
}

/** `results`: [{ name, result }] where result comes from classifyNpmView. */
export function checkRegistry(version, results) {
  const problems = [];
  for (const { name, result } of results) {
    if (result === "published") problems.push(`${name}@${version} is already on npm`);
    else if (result !== "absent")
      problems.push(`npm registry check for ${name}@${version} failed: ${result.error}`);
  }
  return problems;
}

/** Escape a string for literal use inside a RegExp. */
const reEscape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * CHANGELOG lines that are prose: outside fenced code blocks and HTML comments.
 * CommonMark rules: a fence opens with >= 3 backticks or tildes (up to 3 spaces
 * indent) and closes only on a line of the same character, at least as long,
 * followed by nothing but spaces/tabs. An HTML comment block opens on a line
 * starting with `<!--` and runs to the line containing `-->` (or end of file).
 */
function proseLines(markdown) {
  const out = [];
  let fence = null; // the opening marker, e.g. "~~~~"
  let inComment = false;
  for (const line of markdown.split(/\r?\n/)) {
    if (fence !== null) {
      const close = /^ {0,3}(`{3,}|~{3,})[ \t]*$/.exec(line);
      if (close && close[1][0] === fence[0] && close[1].length >= fence.length) fence = null;
      continue;
    }
    if (inComment) {
      if (line.includes("-->")) inComment = false;
      continue;
    }
    const open = /^ {0,3}(`{3,}|~{3,})/.exec(line);
    if (open) {
      fence = open[1];
      continue;
    }
    const comment = /^ {0,3}<!--/.exec(line);
    if (comment) {
      inComment = !line.slice(comment[0].length).includes("-->");
      continue;
    }
    out.push(line);
  }
  return out;
}

export function checkChangelog(version, changelog) {
  if (changelog === null) return ["CHANGELOG.md is missing"];
  const v = reEscape(version);
  // Heading marker and version on the same line; `[ \t]` (not `\s`) so a
  // newline cannot bridge "##" to a version on the next line.
  const heading = new RegExp(`^##[ \t]+(?:${v}|\\[${v}\\])(?=[ \t]|$)`);
  const lines = proseLines(changelog);
  if (lines.some((l) => heading.test(l))) return [];
  const unreleased = lines.some((l) => /^##[ \t]+\[?unreleased\]?[ \t]*$/i.test(l));
  return [
    `CHANGELOG.md has no "## ${version}" heading` +
      (unreleased ? ' (found "## Unreleased"; rename it to the release version)' : ""),
  ];
}

/**
 * Run every check. `io` supplies the side effects so tests can fake them:
 *   packages: [{ name, version }]
 *   localTags(): string[]
 *   remoteTags(tag): string[]   (throws on network failure)
 *   npmView(name, version): { status, stdout, stderr, error? }
 *   changelog(): string | null
 */
export function runGate(io) {
  const problems = [...checkPackageSet(io.packages)];
  const lock = checkLockstep(io.packages);
  problems.push(...lock.problems);
  if (lock.version === null) return { version: null, problems, rows: [] };

  const version = lock.version;
  const semverProblems = checkSemver(version);
  problems.push(...semverProblems);

  let remote = [];
  try {
    remote = io.remoteTags(`v${version}`);
  } catch (err) {
    problems.push(`could not list tags on origin: ${err.message ?? err}`);
  }
  problems.push(...checkTag(version, io.localTags(), remote));

  // Only well-formed names and a valid version ever reach the npm argv; anything
  // else is already a failing problem, so it is reported, not queried.
  const results = [];
  for (const p of io.packages) {
    const nameProblems = checkPackageName(p.name);
    problems.push(...nameProblems);
    if (nameProblems.length > 0 || semverProblems.length > 0) {
      results.push({ name: p.name, result: "not checked" });
      continue;
    }
    results.push({ name: p.name, result: classifyNpmView(version, io.npmView(p.name, version)) });
  }
  problems.push(...checkRegistry(version, results.filter((r) => r.result !== "not checked")));
  problems.push(...checkChangelog(version, io.changelog()));

  const rows = results.map(({ name, result }) => ({
    package: name,
    version,
    npm: typeof result === "string" ? result : "error",
  }));
  return { version, problems, rows };
}

// ---------------------------------------------------------------------------
// Real IO
// ---------------------------------------------------------------------------

function run(cmd, args, cwd, env = process.env) {
  return spawnSync(cmd, args, { cwd, env, encoding: "utf8" });
}

export function realIo(root) {
  return {
    packages: findPublishable(root),
    localTags() {
      const r = run("git", ["tag", "--list"], root);
      if (r.status !== 0) throw new Error(`git tag --list failed: ${r.stderr.trim()}`);
      return r.stdout.split("\n").map((s) => s.trim()).filter(Boolean);
    },
    remoteTags(tag) {
      const r = run("git", ["ls-remote", "--tags", "origin", `refs/tags/${tag}`], root);
      if (r.error) throw r.error;
      if (r.status !== 0) throw new Error(r.stderr.trim() || `git ls-remote exit ${r.status}`);
      return r.stdout
        .split("\n")
        .map((l) => l.split("\t")[1])
        .filter(Boolean)
        .map((ref) => ref.replace(/^refs\/tags\//, "").replace(/\^\{\}$/, ""));
    },
    npmView(name, version) {
      return run("npm", npmViewArgs(name, version), root, npmViewEnv(process.env));
    },
    changelog() {
      const f = join(root, "CHANGELOG.md");
      return existsSync(f) ? readFileSync(f, "utf8") : null;
    },
  };
}

function printTable(rows) {
  const headers = ["package", "version", "npm"];
  const widths = headers.map((h) => Math.max(h.length, ...rows.map((r) => String(r[h]).length)));
  const line = (cells) => cells.map((c, i) => String(c).padEnd(widths[i])).join("  ").trimEnd();
  console.log(line(headers));
  console.log(line(widths.map((w) => "-".repeat(w))));
  for (const r of rows) console.log(line(headers.map((h) => r[h])));
}

function main() {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const { version, problems, rows } = runGate(realIo(root));
  if (problems.length > 0) {
    for (const p of problems) console.error(`release-gate: FAIL ${p}`);
    if (process.env.GITHUB_ACTIONS === "true") {
      for (const p of problems) console.log(`::error title=release gate::${p}`);
    }
    process.exit(1);
  }
  printTable(rows);
  console.log(`\nrelease-gate: PASS v${version} (tag free locally and on origin, not on npm, CHANGELOG entry present)`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
