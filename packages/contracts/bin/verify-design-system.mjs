#!/usr/bin/env node
/**
 * design-system:verify — enforcement gate
 *
 * Validates that the design-system integration (tokens + contracts) is correctly
 * wired and enforced across all design packages.
 *
 * Runs in this repo (`pnpm design-system:verify`) and in any consumer repo
 * through the `design-system-verify` bin that ships with
 * @syntropic137/design-contracts. Run with --help for the options.
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
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const IN_REPO_TOKENS_CSS = 'packages/design-tokens/generated/design-tokens.css';
const TOKENS_CSS_SPECIFIER = '@syntropic137/design-tokens/css';
const DEFAULT_TYPECHECK = 'pnpm -r typecheck';

const USAGE = `Usage: design-system-verify [options]

Checks a repo's design packages against the design system:
  A  the token stylesheet exists and defines --ds-* properties
  B  design CSS uses tokens, never hardcoded colour literals
  C  the typecheck command passes (contract conformance)
  D  every design package exports a *ContractAdapter

Options:
  --root <dir>        Repo root. Default: the current directory.
  --designs <dir>     Scan <dir>/<design>/<cell>/ for design packages.
                      Repeatable. Default: designs (when no --package is given).
  --package <dir>     Check one design package directory. Repeatable.
  --tokens <file>     Token stylesheet. Default: ${IN_REPO_TOKENS_CSS} if it
                      exists, else ${TOKENS_CSS_SPECIFIER} resolved from --root.
  --typecheck <cmd>   Command for check C, run in --root. Default: "${DEFAULT_TYPECHECK}".
  --no-typecheck      Skip check C (for when typecheck runs as its own CI step).
  -h, --help          Show this help.

Relative paths resolve against --root.`;

/**
 * Parse CLI arguments into a gate config. Pure: no filesystem access beyond
 * resolving the default token stylesheet.
 */
export function parseArgs(argv, cwd = process.cwd()) {
  const raw = { designs: [], packages: [], tokens: null, typecheck: DEFAULT_TYPECHECK, root: cwd };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const value = () => {
      const next = argv[++i];
      if (next === undefined || next.startsWith('--')) {
        throw new Error(`${arg} needs a value`);
      }
      return next;
    };
    if (arg === '-h' || arg === '--help') return { help: true };
    else if (arg === '--root') raw.root = path.resolve(cwd, value());
    else if (arg === '--designs') raw.designs.push(value());
    else if (arg === '--package') raw.packages.push(value());
    else if (arg === '--tokens') raw.tokens = value();
    else if (arg === '--typecheck') raw.typecheck = value();
    else if (arg === '--no-typecheck') raw.typecheck = null;
    else throw new Error(`Unknown option: ${arg}`);
  }

  const root = raw.root;
  const designsDirs =
    raw.designs.length === 0 && raw.packages.length === 0 ? ['designs'] : raw.designs;
  return {
    help: false,
    root,
    designsDirs: designsDirs.map((d) => path.resolve(root, d)),
    packageDirs: raw.packages.map((d) => path.resolve(root, d)),
    tokensCss: raw.tokens ? path.resolve(root, raw.tokens) : defaultTokensCss(root),
    typecheck: raw.typecheck,
  };
}

/** The in-repo token build if present, else the installed package's stylesheet. */
function defaultTokensCss(root) {
  const inRepo = path.join(root, IN_REPO_TOKENS_CSS);
  if (fs.existsSync(inRepo)) return inRepo;
  try {
    return createRequire(path.join(root, 'noop.js')).resolve(TOKENS_CSS_SPECIFIER);
  } catch {
    return inRepo; // reported as missing by check A
  }
}

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

export function isDecorativeFile(filePath) {
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
  // Named CSS color keywords used as values (not as property names, not in --ds-* token names).
  // Allowlisted non-color keywords: transparent, currentColor, inherit, initial, unset, revert, none, auto.
  // (?<!-) prevents matching inside CSS custom property names like --ds-color-blackish.
  // (?!-) prevents matching CSS property fragments like "white" in "white-space".
  // (?!\s*:) prevents matching when the word is a CSS property name (followed by colon).
  {
    label: 'named color',
    re: /(?<!-)\b(aqua|black|blue|fuchsia|gray|grey|green|lime|maroon|navy|olive|orange|purple|red|silver|teal|white|yellow|cyan|magenta|coral|crimson|gold|indigo|ivory|khaki|lavender|linen|orchid|pink|plum|salmon|tan|tomato|turquoise|violet)\b(?!-|\s*:)/i,
  },
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
// Pure exported helpers (used by tests)
// ---------------------------------------------------------------------------

/**
 * Scan a CSS string for hardcoded color literals.
 * Returns an array of { lineNo, label, snippet, matched } objects —
 * one entry per offending source line (at most one violation per line).
 */
export function scanCssForHardcodedColors(cssContent) {
  const violations = [];
  const rawLines = cssContent.split('\n');
  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const lineNo = i + 1;
    for (const { label, re } of COLOR_PATTERNS) {
      const match = re.exec(line);
      if (match) {
        const snippet = line.trim().slice(0, 80);
        violations.push({ lineNo, label, snippet, matched: match[0] });
        break; // one violation per source line
      }
    }
  }
  return violations;
}

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

function readPackage(pkgDir, fallbackLabel) {
  const pkgJson = path.join(pkgDir, 'package.json');
  if (!fs.existsSync(pkgJson)) return null;
  const pkg = JSON.parse(fs.readFileSync(pkgJson, 'utf8'));
  return {
    name: pkg.name ?? fallbackLabel,
    dir: pkgDir,
    label: fallbackLabel,
  };
}

// Discover design packages: every <designsDir>/<theme>/<cell>/package.json, plus
// each explicit --package directory.
export function discoverDesignPackages(config) {
  const packages = [];
  for (const designsDir of config.designsDirs) {
    packages.push(...scanDesignsDir(designsDir));
  }
  for (const pkgDir of config.packageDirs) {
    const label = path.relative(config.root, pkgDir) || path.basename(pkgDir);
    const pkg = readPackage(pkgDir, label);
    if (!pkg) throw new Error(`--package ${pkgDir} has no package.json`);
    packages.push(pkg);
  }
  return packages;
}

function scanDesignsDir(designsDir) {
  const packages = [];
  if (!fs.existsSync(designsDir)) return packages;

  for (const theme of fs.readdirSync(designsDir, { withFileTypes: true })) {
    if (!theme.isDirectory()) continue;
    const themeDir = path.join(designsDir, theme.name);
    for (const cell of fs.readdirSync(themeDir, { withFileTypes: true })) {
      if (!cell.isDirectory()) continue;
      const pkg = readPackage(path.join(themeDir, cell.name), `${theme.name}/${cell.name}`);
      if (pkg) packages.push(pkg);
    }
  }
  return packages;
}

// ---------------------------------------------------------------------------
// CHECK A — tokens present
// ---------------------------------------------------------------------------

function checkA(config) {
  const TOKENS_CSS = config.tokensCss;
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

function checkB(config, packages) {
  const ROOT = config.root;
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
      const content = fs.readFileSync(cssFile, 'utf8');
      for (const v of scanCssForHardcodedColors(content)) {
        pkgViolations.push({ file: relPath, ...v });
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

function checkC(config) {
  const lines = [];
  const command = config.typecheck;
  lines.push(header(`CHECK C — Contract Conformance (${command ?? 'skipped'})`));

  if (command === null) {
    lines.push(`  ${C.yellow}skipped (--no-typecheck)${C.reset}`);
    return { passed: true, skipped: true, lines, violations: 0 };
  }

  lines.push(`  ${C.dim}Running: ${command}${C.reset}\n`);

  // The command is the operator's own CLI flag (or the fixed default), run
  // through the shell so consumers can pass e.g. "npm run typecheck".
  const result = spawnSync(command, {
    cwd: config.root,
    stdio: 'inherit',
    shell: true,
  });

  const passed = result.status === 0;
  lines.push('');
  if (passed) {
    lines.push(pass(`${command} exited 0 — all design contracts conform`));
  } else {
    lines.push(
      fail(`${command} exited ${result.status ?? '(signal: ' + result.signal + ')'}`)
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

function checkD(config, packages) {
  const ROOT = config.root;
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

export function main(argv = process.argv.slice(2), cwd = process.cwd()) {
  let config;
  try {
    config = parseArgs(argv, cwd);
  } catch (error) {
    console.error(`${error.message}\n\n${USAGE}`);
    process.exit(2);
  }
  if (config.help) {
    console.log(USAGE);
    process.exit(0);
  }

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
  const packages = discoverDesignPackages(config);
  console.log(`\n  ${C.bold}Discovered ${packages.length} design package(s):${C.reset}`);
  for (const p of packages) {
    console.log(`    ${C.dim}•${C.reset} ${p.label}  ${C.dim}(${p.name})${C.reset}`);
  }

  if (packages.length === 0) {
    console.log(`\n${C.red}  No design packages found — nothing to verify.${C.reset}\n`);
    process.exit(1);
  }

  // Run checks
  const a = checkA(config);
  for (const l of a.lines) console.log(l);

  const b = checkB(config, packages);
  for (const l of b.lines) console.log(l);

  const c = checkC(config);
  for (const l of c.lines) console.log(l);

  const d = checkD(config, packages);
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
    const status = ch.skipped
      ? `${C.yellow}SKIP${C.reset}`
      : ch.passed
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

// Only run the CLI when invoked directly (not when imported by tests or the
// in-repo wrapper). Compare real paths: a bin in node_modules/.bin is a symlink.
function invokedDirectly() {
  if (!process.argv[1]) return false;
  try {
    return import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href;
  } catch {
    return false;
  }
}

if (invokedDirectly()) {
  main();
}
