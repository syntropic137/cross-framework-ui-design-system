// Shared discovery of the publishable design-system packages and the lockstep
// version check. Used by publish-packages.mjs and release-gate.mjs so both agree
// on what "the release" is. Zero dependencies (Node built-ins only).

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** Package dirs under the workspace globs (packages/*, packages/*\/*, designs/*\/*). */
export function pkgDirs(root) {
  const out = [];
  const scan = (rel, depth) => {
    const abs = join(root, rel);
    if (!existsSync(abs)) return;
    for (const name of readdirSync(abs, { withFileTypes: true })) {
      if (!name.isDirectory()) continue;
      const childRel = join(rel, name.name);
      if (existsSync(join(root, childRel, "package.json"))) out.push(childRel);
      if (depth > 0) scan(childRel, depth - 1);
    }
  };
  scan("packages", 1);
  scan("designs", 1);
  return out;
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
 * The exact set of packages a release publishes. Discovery is asserted against
 * this list so a package that silently loses `"private": false` (or is renamed or
 * duplicated) fails the release instead of dropping out of it.
 */
export const EXPECTED_PACKAGES = Object.freeze([
  "@syntropic137/contracts",
  "@syntropic137/design-tokens",
  "@syntropic137/default-react-v18",
  "@syntropic137/default-svelte-v5",
  "@syntropic137/brutalist-react-v18",
  "@syntropic137/brutalist-svelte-v5",
]);

/** Problems when the discovered set differs from `expected` (missing, unexpected, duplicated). */
export function checkPackageSet(packages, expected = EXPECTED_PACKAGES) {
  const problems = [];
  const names = packages.map((p) => p.name);
  const counts = new Map();
  for (const n of names) counts.set(n, (counts.get(n) ?? 0) + 1);
  for (const [n, c] of counts) {
    if (c > 1) problems.push(`package ${JSON.stringify(n)} is declared by ${c} publishable packages`);
  }
  for (const n of counts.keys()) {
    if (!expected.includes(n))
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
