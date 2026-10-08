// Shared discovery of the publishable design-system packages and the lockstep
// version check. Used by publish-packages.mjs and release-gate.mjs so both agree
// on what "the release" is. Zero dependencies (Node built-ins only).

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * The `packages:` globs from pnpm-workspace.yaml. A minimal reader for the flat
 * list form this repo uses; anything it cannot read is an error, not an empty set.
 */
export function workspaceGlobs(yamlText) {
  const globs = [];
  let inPackages = false;
  for (const raw of yamlText.split(/\r?\n/)) {
    const line = raw.replace(/\s+#.*$/, "");
    if (/^\S/.test(line)) {
      inPackages = /^packages:\s*$/.test(line);
      continue;
    }
    if (!inPackages || line.trim() === "") continue;
    const m = /^\s+-\s+(["']?)(!?[A-Za-z0-9_.@*\/-]+)\1\s*$/.exec(line);
    if (!m) throw new Error(`pnpm-workspace.yaml: cannot parse packages entry ${JSON.stringify(raw)}`);
    globs.push(m[2]);
  }
  if (globs.length === 0) throw new Error("pnpm-workspace.yaml: no packages globs found");
  return globs;
}

const SKIP_DIRS = new Set(["node_modules", ".git"]);

/** Dirs (relative to root) matching one glob: literal segments, `*` and `**`. */
function expandGlob(root, glob) {
  const segs = glob.replace(/\/+$/, "").split("/").filter(Boolean);
  const out = [];
  const subdirs = (rel) => {
    const abs = join(root, rel);
    if (!existsSync(abs)) return [];
    return readdirSync(abs, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !SKIP_DIRS.has(d.name))
      .map((d) => (rel ? `${rel}/${d.name}` : d.name));
  };
  const walk = (rel, i) => {
    if (i === segs.length) return void out.push(rel);
    const seg = segs[i];
    if (seg === "**") {
      walk(rel, i + 1);
      for (const d of subdirs(rel)) walk(d, i);
    } else if (seg.includes("*")) {
      const re = new RegExp(`^${seg.split("*").map((p) => p.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join("[^/]*")}$`);
      for (const d of subdirs(rel)) if (re.test(d.split("/").pop())) walk(d, i + 1);
    } else {
      const next = rel ? `${rel}/${seg}` : seg;
      if (existsSync(join(root, next))) walk(next, i + 1);
    }
  };
  walk("", 0);
  return out;
}

/** Package dirs matched by the pnpm-workspace.yaml globs (`!` globs exclude). */
export function pkgDirs(root) {
  const globs = workspaceGlobs(readFileSync(join(root, "pnpm-workspace.yaml"), "utf8"));
  const include = new Set();
  for (const g of globs.filter((g) => !g.startsWith("!"))) for (const d of expandGlob(root, g)) include.add(d);
  for (const g of globs.filter((g) => g.startsWith("!"))) for (const d of expandGlob(root, g.slice(1))) include.delete(d);
  return [...include].filter((d) => existsSync(join(root, d, "package.json"))).sort();
}

/** Every package with `"private": false`, as { dir, name, version }. */
export function findPublishable(root) {
  return pkgDirs(root)
    .map((dir) => {
      const pkg = JSON.parse(readFileSync(join(root, dir, "package.json"), "utf8"));
      return { dir, name: pkg.name, version: pkg.version, isPrivate: pkg.private };
    })
    .filter((p) => p.isPrivate === false)
    .map(({ dir, name, version }) => ({ dir, name, version }));
}

/**
 * The exact set of packages a release publishes: the two foundations (ADR-0008,
 * decision update 2026-10-08). Discovery is asserted against this list so a
 * package that silently loses `"private": false` (or is renamed or duplicated)
 * fails the release instead of dropping out of it.
 */
export const EXPECTED_PACKAGES = Object.freeze([
  "@syntropic137/design-contracts",
  "@syntropic137/design-tokens",
]);

/**
 * Reference component implementations under designs/. They implement the
 * contracts and consume the tokens, ride the lockstep version, and must never
 * publish. `checkPackageSet` names them specifically if one turns publishable.
 */
export const REFERENCE_PACKAGES = Object.freeze([
  "@syntropic137/default-react-v18",
  "@syntropic137/default-svelte-v5",
  "@syntropic137/brutalist-react-v18",
  "@syntropic137/brutalist-svelte-v5",
]);

/** Workspace dirs that hold reference implementations (never published). */
export const isReferenceDir = (dir) => dir.startsWith("designs/");

/**
 * Every package that carries the lockstep version: the publishable set plus the
 * private reference implementations under designs/, as { dir, name, version, isPrivate }.
 */
export function findLockstep(root) {
  return pkgDirs(root)
    .map((dir) => {
      const pkg = JSON.parse(readFileSync(join(root, dir, "package.json"), "utf8"));
      return { dir, name: pkg.name, version: pkg.version, isPrivate: pkg.private };
    })
    .filter((p) => p.isPrivate === false || isReferenceDir(p.dir));
}

/** Problems when the discovered set differs from `expected` (missing, unexpected, duplicated). */
export function checkPackageSet(packages, expected = EXPECTED_PACKAGES) {
  const problems = [];
  const names = packages.map((p) => p.name);
  const counts = new Map();
  for (const n of names) counts.set(n, (counts.get(n) ?? 0) + 1);
  for (const [n, c] of counts) {
    if (c > 1) problems.push(`package ${JSON.stringify(n)} is declared by ${c} publishable packages`);
  }
  // A reference implementation is any name in REFERENCE_PACKAGES or any package under designs/.
  const reference = new Set([
    ...REFERENCE_PACKAGES,
    ...packages.filter((p) => typeof p.dir === "string" && isReferenceDir(p.dir)).map((p) => p.name),
  ]);
  for (const n of counts.keys()) {
    if (reference.has(n))
      problems.push(
        `reference implementation ${JSON.stringify(n)} is publishable; component implementations must stay "private": true (ADR-0008)`,
      );
    else if (!expected.includes(n))
      problems.push(`unexpected publishable package ${JSON.stringify(n)} (not in EXPECTED_PACKAGES)`);
  }
  for (const n of expected) {
    if (!counts.has(n))
      problems.push(`expected package ${n} was not discovered as publishable ("private": false)`);
  }
  return problems;
}

/**
 * Lockstep check (ADR-0008/0009): every publishable package carries one version,
 * and that version is a non-empty string. Returns { version, problems }; `version`
 * is null unless exactly one valid version exists.
 */
export function checkLockstep(packages) {
  if (packages.length === 0) {
    return { version: null, problems: ['no publishable packages (none with "private": false)'] };
  }
  const invalid = packages.filter((p) => typeof p.version !== "string" || p.version.trim() === "");
  if (invalid.length > 0) {
    return {
      version: null,
      problems: invalid.map(
        (p) => `package ${p.name} has no valid version (got ${JSON.stringify(p.version ?? null)})`,
      ),
    };
  }
  const versions = [...new Set(packages.map((p) => p.version))];
  if (versions.length === 1) return { version: versions[0], problems: [] };
  return {
    version: null,
    problems: [
      `packages are not on one lockstep version (${versions.join(", ")}): ` +
        packages.map((p) => `${p.name}@${p.version}`).join(", ") +
        "; run `pnpm version:bump <semver>`",
    ],
  };
}
