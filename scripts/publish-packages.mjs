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
import { existsSync, mkdtempSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { checkLockstep, checkPackageSet, findPublishable } from "./lib/publishable-packages.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dryRun = process.env.DRY_RUN === "1";
// Provenance attestations are only issued from a supported CI OIDC context
// (GitHub Actions). The one-time local bootstrap publish that creates the
// packages (docs/publishing-setup.md, step 1) has no such context and npm
// refuses `--provenance` there, so provenance is on in CI and off locally.
const inCi = process.env.GITHUB_ACTIONS === "true";
const provenanceFlag = inCi ? "--provenance" : "--provenance=false";
// Always talk to the public registry, for both the lookup and the publish, so a
// user or scoped registry override in npm config cannot redirect either.
const registryFlags = "--registry=https://registry.npmjs.org/ --@syntropic137:registry=https://registry.npmjs.org/";

const publishable = findPublishable(root);

if (publishable.length === 0) {
  console.error('No publishable packages (none with "private": false).');
  process.exit(1);
}

// Publish exactly the two foundations (ADR-0008). A designs/ reference
// implementation that turned publishable, or a foundation that lost
// `"private": false`, stops the publish before anything is packed.
const setProblems = checkPackageSet(publishable);
if (setProblems.length > 0) {
  console.error("Refusing to publish:");
  for (const problem of setProblems) console.error(`  ${problem}`);
  process.exit(1);
}

// Versions move in lockstep (ADR-0008/0009) and the release tag is derived from
// one of them, so refuse to publish a mixed set rather than tag the wrong version.
const lockstep = checkLockstep(publishable);
if (lockstep.problems.length > 0) {
  console.error("Refusing to publish:");
  for (const problem of lockstep.problems) console.error(`  ${problem}`);
  process.exit(1);
}

// A version already on the registry should not be re-published (npm would error and
// wedge a partially-completed release). `npm view` exits non-zero / prints nothing
// when the exact version is absent.
function alreadyPublished(name, version) {
  try {
    const v = execSync(`npm view ${registryFlags} -- ${name}@${version} version`, {
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
    console.log(`[dry-run] would run: npm publish "${tgz}" ${provenanceFlag} --access public ${registryFlags}`);
    continue;
  }
  execSync(`npm publish "${tgz}" ${provenanceFlag} --access public ${registryFlags}`, { cwd: root, stdio: "inherit" });
  console.log(`published ${pkg.name}@${pkg.version}`);
  published += 1;
}

console.log(
  dryRun
    ? `Dry run complete: packed ${publishable.length - skipped}, ${skipped} already published.`
    : `Done: published ${published}, skipped ${skipped} (already on npm).`,
);
