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
import { findPublishable, checkLockstep } from "./lib/publishable-packages.mjs";

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

/**
 * Classify one `npm view <name>@<version> version` result.
 * Returns "published" | "absent" | { error: string }.
 * E404 (package or version missing) is the only non-zero exit that means "absent".
 */
export function classifyNpmView(version, { status, stdout = "", stderr = "", error }) {
  if (error) return { error: String(error.message ?? error) };
  if (status === 0) {
    const out = stdout.trim();
    if (out === version) return "published";
    if (out === "") return "absent";
    return { error: `unexpected npm view output: ${JSON.stringify(out.slice(0, 200))}` };
  }
  if (/\bE404\b/.test(stderr)) return "absent";
  const firstLine =
    stderr
      .split("\n")
      .map((l) => l.replace(/^npm (error|ERR!)\s*/, "").trim())
      .find(Boolean) ?? `exit ${status}`;
  return { error: firstLine };
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

export function checkChangelog(version, changelog) {
  if (changelog === null) return ["CHANGELOG.md is missing"];
  const v = reEscape(version);
  const heading = new RegExp(`^##\\s+(?:${v}|\\[${v}\\])(?=\\s|$)`, "m");
  if (heading.test(changelog)) return [];
  const unreleased = /^##\s+\[?unreleased\]?\s*$/im.test(changelog);
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
  const problems = [];
  const lock = checkLockstep(io.packages);
  problems.push(...lock.problems);
  if (lock.version === null) return { version: null, problems, rows: [] };

  const version = lock.version;
  problems.push(...checkSemver(version));

  let remote = [];
  try {
    remote = io.remoteTags(`v${version}`);
  } catch (err) {
    problems.push(`could not list tags on origin: ${err.message ?? err}`);
  }
  problems.push(...checkTag(version, io.localTags(), remote));

  const results = io.packages.map((p) => ({
    name: p.name,
    result: classifyNpmView(version, io.npmView(p.name, version)),
  }));
  problems.push(...checkRegistry(version, results));
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

function run(cmd, args, cwd) {
  return spawnSync(cmd, args, { cwd, encoding: "utf8" });
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
      return run("npm", ["view", `${name}@${version}`, "version"], root);
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
  const line = (cells) => cells.map((c, i) => String(c).padEnd(widths[i])).join("  ");
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
