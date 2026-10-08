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
 * Lockstep check (ADR-0008/0009): every publishable package carries one version.
 * Returns { version, problems }; `version` is null unless exactly one version exists.
 */
export function checkLockstep(packages) {
  if (packages.length === 0) {
    return { version: null, problems: ['no publishable packages (none with "private": false)'] };
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
