#!/usr/bin/env node
// Publish the design-system packages to npm.
//
// Strategy (so npm OIDC "trusted publishing" works without a token):
//   1. `pnpm pack` each publishable package. pnpm rewrites `workspace:^` deps into
//      real version ranges in the packed manifest (plain `npm publish` cannot), so
//      the tarball is registry-correct.
//   2. `npm publish <tarball>` for each. The npm CLI (>= 11.5.1) does the OIDC
//      handshake when a trusted publisher is configured and the workflow has
//      `id-token: write`, so no NPM_TOKEN is needed.
//
// Idempotent: a version already on the registry is skipped, so re-running after a
// partial failure publishes only what is missing (it never errors on a duplicate,
// which would otherwise wedge a half-finished release).
//
// Zero dependencies. Run from CI on push to `release` (see release.yml), or locally:
//   DRY_RUN=1 node scripts/publish-packages.mjs   # pack only, publish nothing

import { execSync } from "node:child_process";
import { readFileSync, existsSync, readdirSync, mkdtempSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dryRun = process.env.DRY_RUN === "1";

function pkgDirs() {
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

const publishable = pkgDirs()
  .map((dir) => {
    const pkg = JSON.parse(readFileSync(join(root, dir, "package.json"), "utf8"));
    return { dir, name: pkg.name, version: pkg.version, isPrivate: pkg.private };
  })
  .filter((p) => p.isPrivate === false);

if (publishable.length === 0) {
  console.error('No publishable packages (none with "private": false).');
  process.exit(1);
}

// A version already on the registry should not be re-published (npm would error and
// wedge a partially-completed release). `npm view` exits non-zero / prints nothing
// when the exact version is absent.
function alreadyPublished(name, version) {
  try {
    const v = execSync(`npm view ${name}@${version} version`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return v === version;
  } catch {
    return false;
  }
}

const tarballDir = mkdtempSync(join(tmpdir(), "ds-publish-"));
let published = 0;
let skipped = 0;

for (const pkg of publishable) {
  if (alreadyPublished(pkg.name, pkg.version)) {
    console.log(`skip   ${pkg.name}@${pkg.version} (already on npm)`);
    skipped += 1;
    continue;
  }

  const stdout = execSync(`pnpm pack --pack-destination "${tarballDir}"`, {
    cwd: join(root, pkg.dir),
    encoding: "utf8",
  });
  const tgz = stdout.trim().split("\n").filter(Boolean).pop();
  if (!tgz || !tgz.endsWith(".tgz") || !existsSync(tgz)) {
    throw new Error(`pnpm pack did not produce a .tgz for ${pkg.name}; got: ${JSON.stringify(tgz)}`);
  }
  console.log(`packed ${pkg.name}@${pkg.version} -> ${tgz}`);

  if (dryRun) {
    console.log(`[dry-run] would run: npm publish "${tgz}" --provenance --access public`);
    continue;
  }
  execSync(`npm publish "${tgz}" --provenance --access public`, { cwd: root, stdio: "inherit" });
  console.log(`published ${pkg.name}@${pkg.version}`);
  published += 1;
}

console.log(
  dryRun
    ? `Dry run complete: packed ${publishable.length - skipped}, ${skipped} already published.`
    : `Done: published ${published}, skipped ${skipped} (already on npm).`,
);
