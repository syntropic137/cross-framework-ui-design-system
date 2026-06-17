#!/usr/bin/env node
// Lockstep version bump for every publishable design-system package.
// Zero dependencies (Node built-ins only), matching the repo's zero-dep ethos.
//
// Usage:
//   node scripts/bump-version.mjs <semver>      # e.g. 0.2.0
//   pnpm version:bump 0.2.0
//
// What it does:
//   - Sets `version` to <semver> in every package whose package.json has
//     `"private": false` (the publishable set: contracts, design-tokens, and
//     every design cell), plus the repo root package.json.
//   - Prepends a dated CHANGELOG.md section stub for the new version.
// What it does NOT do: git add / commit / tag. That happens in the release PR.

import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const version = process.argv[2];

if (!version || !/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version)) {
  console.error("Usage: node scripts/bump-version.mjs <semver>  (e.g. 0.2.0)");
  process.exit(1);
}

// Discover package.json files under the workspace globs (packages/*, packages/*/*, designs/*/*).
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
  scan("packages", 1); // packages/* and packages/*/*
  scan("designs", 1); // designs/*/*
  return out;
}

const write = (file, obj) => writeFileSync(file, JSON.stringify(obj, null, 2) + "\n");

const bumped = [];
for (const rel of pkgDirs()) {
  const file = join(root, rel, "package.json");
  const pkg = JSON.parse(readFileSync(file, "utf8"));
  if (pkg.private !== false) continue; // only publishable packages
  pkg.version = version;
  write(file, pkg);
  bumped.push(pkg.name);
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

console.log(`Bumped ${bumped.length} publishable packages + root to ${version}:`);
for (const n of bumped) console.log(`  ${n}`);
console.log(`Wrote CHANGELOG.md entry for ${version}. Edit it, then open the release PR.`);
