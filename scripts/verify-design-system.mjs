#!/usr/bin/env node
/**
 * design-system:verify — enforcement gate
 *
 * Validates that the design-system integration (tokens + contracts) is correctly
 * wired and enforced across all design packages.
 *
 * Checks:
 *   A — tokens present (design-tokens.css exists and contains --ds- properties)
 *   B — token discipline (no hardcoded color literals in design src CSS)
 *   C — contract conformance (pnpm -r typecheck exit code)
 *   D — adapter export presence (contract-adapter.ts exists and exports an adapter)
 *
 * Zero external dependencies — Node built-ins only.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const TOKENS_CSS = path.join(ROOT, 'packages/design-tokens/generated/design-tokens.css');
const DESIGNS_GLOB_BASE = path.join(ROOT, 'designs');

// ---------------------------------------------------------------------------
// Decorative allowlist — CSS files whose hardcoded color literals are
// intentional and therefore exempt from CHECK B.
//
// Rule: a file basename (case-insensitive) that contains any of these strings
// is decorative and will be skipped. The gate PRINTS how many files were
// skipped so the exception is visible, not silent.
// ---------------------------------------------------------------------------
const DECORATIVE_ALLOWLIST = [
  'confetti', // multi-color rainbow palette — not a semantic token
];

function isDecorativeFile(filePath) {
  const basename = path.basename(filePath).toLowerCase();
  return DECORATIVE_ALLOWLIST.some((name) => basename.includes(name));
}

// Color literal patterns to flag in design CSS.
// hsl()/hsla()/rgb()/rgba() with actual values (not just CSS custom property
// definitions which use --ds-* names). We also catch hex literals.
const COLOR_PATTERNS = [
  // hex 3/4/6/8 digit
  { label: 'hex color', re: /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/ },
  // rgb( / rgba( with a digit immediately following (excludes `rgb(var(...)`)
  { label: 'rgb()', re: /\brgba?\s*\(\s*\d/ },
  // hsl( / hsla( with a digit immediately following (excludes `hsl(var(...)`)
  { label: 'hsl()', re: /\bhsla?\s*\(\s*\d/ },
];

// ANSI colours for terminal output
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pass(msg) {
  return `  ${C.green}✓${C.reset} ${msg}`;
}

function fail(msg) {
  return `  ${C.red}✗${C.reset} ${msg}`;
}

function header(title) {
  const bar = '─'.repeat(60);
  return `\n${C.bold}${C.cyan}${bar}${C.reset}\n${C.bold}  ${title}${C.reset}\n${C.bold}${C.cyan}${bar}${C.reset}`;
}

function subheader(title) {
  return `\n${C.bold}  ${title}${C.reset}`;
}

/** Walk a directory recursively, returning all file paths. */
function walkFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

// Discover design packages by scanning designs/<theme>/<cell>/package.json
function discoverDesignPackages() {
  const packages = [];
  if (!fs.existsSync(DESIGNS_GLOB_BASE)) return packages;

  for (const theme of fs.readdirSync(DESIGNS_GLOB_BASE, { withFileTypes: true })) {
    if (!theme.isDirectory()) continue;
    const themeDir = path.join(DESIGNS_GLOB_BASE, theme.name);
    for (const cell of fs.readdirSync(themeDir, { withFileTypes: true })) {
      if (!cell.isDirectory()) continue;
      const pkgDir = path.join(themeDir, cell.name);
      const pkgJson = path.join(pkgDir, 'package.json');
      if (!fs.existsSync(pkgJson)) continue;
      const pkg = JSON.parse(fs.readFileSync(pkgJson, 'utf8'));
      packages.push({
        name: pkg.name ?? `${theme.name}/${cell.name}`,
        theme: theme.name,
        cell: cell.name,
        dir: pkgDir,
        label: `${theme.name}/${cell.name}`,
      });
    }
  }
  return packages;
}

// ---------------------------------------------------------------------------
// CHECK A — tokens present
// ---------------------------------------------------------------------------

function checkA() {
  const lines = [];
  let passed = true;

  lines.push(header('CHECK A — Token File Present'));

  if (!fs.existsSync(TOKENS_CSS)) {
    lines.push(fail(`${TOKENS_CSS} does not exist`));
    passed = false;
  } else {
    const content = fs.readFileSync(TOKENS_CSS, 'utf8');
    const matches = content.match(/--ds-[a-zA-Z0-9-]+\s*:/g) ?? [];
    if (matches.length === 0) {
      lines.push(fail(`${TOKENS_CSS} exists but contains no --ds-* custom properties`));
      passed = false;
    } else {
      lines.push(pass(`${TOKENS_CSS}`));
      lines.push(`  ${C.dim}  ↳ ${matches.length} --ds-* custom properties found${C.reset}`);
    }
  }

  return { passed, lines, violations: passed ? 0 : 1 };
}

// ---------------------------------------------------------------------------
// CHECK B — token discipline (no hardcoded color literals in src CSS)
// ---------------------------------------------------------------------------

function checkB(packages) {
  const lines = [];
  let totalViolations = 0;
  let anyFailed = false;

  lines.push(header('CHECK B — Token Discipline (no hardcoded color literals)'));
  lines.push(
    `  ${C.dim}Rule: design CSS must use var(--ds-color-*), never hex/#/rgb/hsl literals${C.reset}`
  );

  let totalDecorativeSkipped = 0;

  for (const pkg of packages) {
    const srcDir = path.join(pkg.dir, 'src');
    const allCssFiles = walkFiles(srcDir).filter((f) => f.endsWith('.css'));

    // Split into enforced and decorative (allowlisted) files
    const decorativeFiles = allCssFiles.filter(isDecorativeFile);
    const cssFiles = allCssFiles.filter((f) => !isDecorativeFile(f));
    totalDecorativeSkipped += decorativeFiles.length;

    const pkgViolations = [];

    for (const cssFile of cssFiles) {
      const relPath = path.relative(ROOT, cssFile);
      const rawLines = fs.readFileSync(cssFile, 'utf8').split('\n');

      for (let i = 0; i < rawLines.length; i++) {
        const line = rawLines[i];
        const lineNo = i + 1;

        for (const { label, re } of COLOR_PATTERNS) {
          const match = re.exec(line);
          if (match) {
            const snippet = line.trim().slice(0, 80);
            pkgViolations.push({ file: relPath, lineNo, label, snippet, matched: match[0] });
            break; // one violation per source line is enough
          }
        }
      }
    }

    lines.push(subheader(`${pkg.label}  (${pkg.name})`));

    if (allCssFiles.length === 0) {
      lines.push(`    ${C.dim}no CSS files found under src/${C.reset}`);
    } else if (pkgViolations.length === 0) {
      lines.push(pass(`${cssFiles.length} CSS file(s) — no hardcoded color literals`));
    } else {
      anyFailed = true;
      lines.push(
        fail(
          `${pkgViolations.length} violation(s) in ${cssFiles.length} CSS file(s):`
        )
      );
      for (const v of pkgViolations) {
        lines.push(
          `    ${C.red}${v.file}:${v.lineNo}${C.reset}  ${C.dim}${v.snippet}${C.reset}`
        );
      }
      totalViolations += pkgViolations.length;
    }
  }

  if (totalDecorativeSkipped > 0) {
    const names = DECORATIVE_ALLOWLIST.join(', ');
    lines.push(
      `\n  ${C.yellow}(skipped ${totalDecorativeSkipped} decorative file(s): ${names})${C.reset}`
    );
  }

  return { passed: !anyFailed, lines, violations: totalViolations };
}

// ---------------------------------------------------------------------------
// CHECK C — contract conformance via pnpm -r typecheck
// ---------------------------------------------------------------------------

function checkC() {
  const lines = [];
  lines.push(header('CHECK C — Contract Conformance (pnpm -r typecheck)'));
  lines.push(`  ${C.dim}Running: pnpm -r typecheck${C.reset}\n`);

  const result = spawnSync('pnpm', ['-r', 'typecheck'], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: false,
  });

  const passed = result.status === 0;
  lines.push('');
  if (passed) {
    lines.push(pass('pnpm -r typecheck exited 0 — all design contracts conform'));
  } else {
    lines.push(
      fail(`pnpm -r typecheck exited ${result.status ?? '(signal: ' + result.signal + ')'}`)
    );
  }

  return { passed, lines, violations: passed ? 0 : 1 };
}

// ---------------------------------------------------------------------------
// CHECK D — adapter export presence
// ---------------------------------------------------------------------------

/**
 * For each design package find a contract-adapter file.
 * Svelte packages use src/lib/contract-adapter.ts; React packages use src/contract-adapter.ts.
 */
function findAdapterFile(pkg) {
  const candidates = [
    path.join(pkg.dir, 'src', 'contract-adapter.ts'),
    path.join(pkg.dir, 'src', 'lib', 'contract-adapter.ts'),
    path.join(pkg.dir, 'src', 'contract-adapter.svelte.ts'),
    path.join(pkg.dir, 'src', 'lib', 'contract-adapter.svelte.ts'),
  ];
  return candidates.find((c) => fs.existsSync(c)) ?? null;
}

const ADAPTER_EXPORT_RE = /export\s+const\s+(\w+ContractAdapter)\b/;

function checkD(packages) {
  const lines = [];
  let totalViolations = 0;
  let anyFailed = false;

  lines.push(header('CHECK D — Adapter Export Presence'));

  for (const pkg of packages) {
    const adapterFile = findAdapterFile(pkg);
    const relFile = adapterFile ? path.relative(ROOT, adapterFile) : null;

    if (!adapterFile) {
      lines.push(fail(`${pkg.label}  — no contract-adapter.ts found`));
      anyFailed = true;
      totalViolations++;
      continue;
    }

    const content = fs.readFileSync(adapterFile, 'utf8');
    const match = ADAPTER_EXPORT_RE.exec(content);

    if (!match) {
      lines.push(
        fail(
          `${pkg.label}  — ${relFile} exists but no \`export const *ContractAdapter\` found`
        )
      );
      anyFailed = true;
      totalViolations++;
    } else {
      lines.push(pass(`${pkg.label}  — ${relFile}`));
      lines.push(`  ${C.dim}  ↳ exports: ${match[1]}${C.reset}`);
    }
  }

  return { passed: !anyFailed, lines, violations: totalViolations };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log(
    `\n${C.bold}${C.cyan}╔══════════════════════════════════════════════════════════════╗${C.reset}`
  );
  console.log(
    `${C.bold}${C.cyan}║         design-system:verify  enforcement gate               ║${C.reset}`
  );
  console.log(
    `${C.bold}${C.cyan}╚══════════════════════════════════════════════════════════════╝${C.reset}`
  );

  // Discover packages
  const packages = discoverDesignPackages();
  console.log(`\n  ${C.bold}Discovered ${packages.length} design package(s):${C.reset}`);
  for (const p of packages) {
    console.log(`    ${C.dim}•${C.reset} ${p.label}  ${C.dim}(${p.name})${C.reset}`);
  }

  if (packages.length === 0) {
    console.log(`\n${C.red}  No design packages found — nothing to verify.${C.reset}\n`);
    process.exit(1);
  }

  // Run checks
  const a = checkA();
  for (const l of a.lines) console.log(l);

  const b = checkB(packages);
  for (const l of b.lines) console.log(l);

  const c = checkC();
  for (const l of c.lines) console.log(l);

  const d = checkD(packages);
  for (const l of d.lines) console.log(l);

  // Summary
  const checks = [
    { id: 'A', label: 'Token file present', ...a },
    { id: 'B', label: 'Token discipline', ...b },
    { id: 'C', label: 'Contract conformance', ...c },
    { id: 'D', label: 'Adapter export presence', ...d },
  ];

  const failedChecks = checks.filter((ch) => !ch.passed);
  const totalViolations = checks.reduce((s, ch) => s + ch.violations, 0);

  console.log(header('SUMMARY'));
  for (const ch of checks) {
    const status = ch.passed
      ? `${C.green}PASS${C.reset}`
      : `${C.red}FAIL${C.reset}`;
    const violStr = ch.violations > 0 ? `  ${C.dim}(${ch.violations} violation(s))${C.reset}` : '';
    console.log(`  CHECK ${ch.id}  ${status}  ${ch.label}${violStr}`);
  }

  console.log('');
  if (failedChecks.length === 0) {
    console.log(
      `${C.bold}${C.green}  design-system:verify: PASSED${C.reset}\n`
    );
    process.exit(0);
  } else {
    console.log(
      `${C.bold}${C.red}  design-system:verify: FAILED (${totalViolations} violation(s) across ${failedChecks.length} check(s))${C.reset}\n`
    );
    process.exit(1);
  }
}

main();
