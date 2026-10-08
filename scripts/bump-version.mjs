#!/usr/bin/env node
// Lockstep version bump for every design-system package.
// Zero dependencies (Node built-ins only), matching the repo's zero-dep ethos.
//
// Usage:
//   node scripts/bump-version.mjs <semver>      # e.g. 0.2.0
//   pnpm version:bump 0.2.0
//
// What it does:
//   - Sets `version` to <semver> in every lockstep package: the publishable
//     foundations (`"private": false`: design-contracts, design-tokens) and the
//     private reference implementations under designs/*/* (which never publish,
//     ADR-0008), plus the repo root package.json.
//   - Prepends a dated CHANGELOG.md section stub for the new version.
// What it does NOT do: git add / commit / tag. That happens in the release PR.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { findLockstep } from "./lib/publishable-packages.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const version = process.argv[2];

if (!version || !/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version)) {
  console.error("Usage: node scripts/bump-version.mjs <semver>  (e.g. 0.2.0)");
  process.exit(1);
}

const write = (file, obj) => writeFileSync(file, JSON.stringify(obj, null, 2) + "\n");

const bumped = [];
for (const { dir, isPrivate } of findLockstep(root)) {
  const file = join(root, dir, "package.json");
  const pkg = JSON.parse(readFileSync(file, "utf8"));
  pkg.version = version;
  write(file, pkg);
  bumped.push(`${pkg.name}${isPrivate === false ? "" : " (private, not published)"}`);
}

// Root package.json (private) tracks the same line for humans.
const rootFile = join(root, "package.json");
const rootPkg = JSON.parse(readFileSync(rootFile, "utf8"));
rootPkg.version = version;
write(rootFile, rootPkg);

// Prepend a CHANGELOG stub.
const changelogFile = join(root, "CHANGELOG.md");
const today = new Date().toISOString().slice(0, 10);
const entry = `## ${version} - ${today}\n\n- _Describe the changes in this release._\n\n`;
if (existsSync(changelogFile)) {
  const current = readFileSync(changelogFile, "utf8");
  const marker = "<!-- releases -->\n";
  const idx = current.indexOf(marker);
  const next =
    idx >= 0
      ? current.slice(0, idx + marker.length) + "\n" + entry + current.slice(idx + marker.length)
      : current + "\n" + entry;
  writeFileSync(changelogFile, next);
} else {
  writeFileSync(changelogFile, `# Changelog\n\n<!-- releases -->\n\n${entry}`);
}

console.log(`Bumped ${bumped.length} lockstep packages + root to ${version}:`);
for (const n of bumped) console.log(`  ${n}`);
console.log(`Wrote CHANGELOG.md entry for ${version}. Edit it, then open the release PR.`);
