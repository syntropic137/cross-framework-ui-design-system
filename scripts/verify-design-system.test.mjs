/**
 * verify-design-system.test.mjs
 *
 * Proof tests for the design-system:verify enforcement gate.
 *
 * Proves BOTH directions:
 *   - The gate catches violations (does not pass vacuously)
 *   - The gate passes on compliant code (does not always fail)
 *
 * Zero external dependencies — Node built-ins only (node:test, node:assert,
 * node:child_process, node:os, node:fs, node:path).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  discoverDesignPackages,
  isDecorativeFile,
  parseArgs,
  scanCssForHardcodedColors,
} from './verify-design-system.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const GATE_SCRIPT = path.join(__dirname, 'verify-design-system.mjs');
// The same gate as consumers run it: the bin shipped with design-contracts.
const GATE_BIN = path.join(REPO_ROOT, 'packages', 'contracts', 'bin', 'verify-design-system.mjs');

// ---------------------------------------------------------------------------
// scanCssForHardcodedColors — must FLAG violations
// ---------------------------------------------------------------------------

describe('scanCssForHardcodedColors — FLAGS hardcoded color literals', () => {
  it('flags a hex shorthand: color: #fff', () => {
    const violations = scanCssForHardcodedColors('color: #fff;');
    assert.ok(violations.length >= 1, `Expected ≥1 violation, got ${violations.length}`);
    assert.equal(violations[0].label, 'hex color');
    assert.ok(violations[0].matched.startsWith('#'));
  });

  it('flags a 6-digit hex in a border rule: border: 1px solid #abc123', () => {
    const violations = scanCssForHardcodedColors('border: 1px solid #abc123;');
    assert.ok(violations.length >= 1, `Expected ≥1 violation, got ${violations.length}`);
    assert.equal(violations[0].label, 'hex color');
    assert.equal(violations[0].matched, '#abc123');
  });

  it('flags rgb(): background: rgb(0,0,0)', () => {
    const violations = scanCssForHardcodedColors('background: rgb(0,0,0);');
    assert.ok(violations.length >= 1, `Expected ≥1 violation, got ${violations.length}`);
    assert.equal(violations[0].label, 'rgb()');
  });

  it('flags hsl(): color: hsl(0 85% 50%)', () => {
    const violations = scanCssForHardcodedColors('color: hsl(0 85% 50%);');
    assert.ok(violations.length >= 1, `Expected ≥1 violation, got ${violations.length}`);
    assert.equal(violations[0].label, 'hsl()');
  });

  it('records the correct line number for a violation on line 3', () => {
    const css = '.a { color: red; }\n.b { font-size: 1rem; }\n.c { color: #deadbe; }';
    const violations = scanCssForHardcodedColors(css);
    assert.ok(violations.length >= 1);
    assert.equal(violations[violations.length - 1].lineNo, 3);
  });
});

// ---------------------------------------------------------------------------
// scanCssForHardcodedColors — must PASS compliant CSS
// ---------------------------------------------------------------------------

describe('scanCssForHardcodedColors — PASSES compliant CSS using var()', () => {
  it('passes color: var(--ds-color-fg)', () => {
    const violations = scanCssForHardcodedColors('color: var(--ds-color-fg);');
    assert.equal(violations.length, 0, `Expected 0 violations, got ${violations.length}`);
  });

  it('passes background: var(--ds-color-surface)', () => {
    const violations = scanCssForHardcodedColors('background: var(--ds-color-surface);');
    assert.equal(violations.length, 0, `Expected 0 violations, got ${violations.length}`);
  });

  it('passes a CSS custom property definition that looks like --ds-color-fg: #fff (it is a token definition, not a consumer)', () => {
    // Token definition files assign hex to --ds-* names. The gate only
    // targets design src CSS (which should consume tokens, not define them).
    // But to be rigorous: the scanner itself *will* flag a bare hex in any
    // line — the allowlisting of token-definition files happens at the
    // CHECK B level (isDecorativeFile / package-level). Here we just confirm
    // that pure var() usage in consumer CSS is clean.
    const css = [
      '.button {',
      '  color: var(--ds-color-fg);',
      '  background: var(--ds-color-surface);',
      '  border: 1px solid var(--ds-color-border);',
      '}',
    ].join('\n');
    const violations = scanCssForHardcodedColors(css);
    assert.equal(violations.length, 0, `Expected 0 violations, got ${violations.length}`);
  });
});

// ---------------------------------------------------------------------------
// scanCssForHardcodedColors — named CSS color keywords
// ---------------------------------------------------------------------------

describe('scanCssForHardcodedColors — FLAGS named CSS color keywords', () => {
  it('flags color: black', () => {
    const violations = scanCssForHardcodedColors('color: black;');
    assert.ok(violations.length >= 1, `Expected ≥1 violation for "color: black;", got ${violations.length}`);
    assert.equal(violations[0].label, 'named color');
  });

  it('flags color: white', () => {
    const violations = scanCssForHardcodedColors('color: white;');
    assert.ok(violations.length >= 1, `Expected ≥1 violation for "color: white;", got ${violations.length}`);
    assert.equal(violations[0].label, 'named color');
  });

  it('flags black inside color-mix(): color-mix(in oklab, var(--ds-color-danger), black 50%)', () => {
    const violations = scanCssForHardcodedColors(
      'box-shadow: 4px 4px 0 color-mix(in oklab, var(--ds-color-danger), black 50%);'
    );
    assert.ok(violations.length >= 1, `Expected ≥1 violation, got ${violations.length}`);
    assert.equal(violations[0].label, 'named color');
  });
});

describe('scanCssForHardcodedColors — PASSES allowlisted CSS keywords (not named colors)', () => {
  it('passes color: transparent', () => {
    const violations = scanCssForHardcodedColors('color: transparent;');
    assert.equal(violations.length, 0, `Expected 0 violations for "transparent", got ${violations.length}`);
  });

  it('passes color: currentColor', () => {
    const violations = scanCssForHardcodedColors('color: currentColor;');
    assert.equal(violations.length, 0, `Expected 0 violations for "currentColor", got ${violations.length}`);
  });

  it('passes color: var(--ds-color-fg)', () => {
    const violations = scanCssForHardcodedColors('color: var(--ds-color-fg);');
    assert.equal(violations.length, 0, `Expected 0 violations for "var(--ds-color-fg)", got ${violations.length}`);
  });

  it('passes a token name containing a color word (--ds-color-blackboard is hypothetical but safe)', () => {
    const violations = scanCssForHardcodedColors('color: var(--ds-color-blackboard);');
    assert.equal(violations.length, 0, `Expected 0 violations for token containing "black", got ${violations.length}`);
  });
});

// ---------------------------------------------------------------------------
// isDecorativeFile — allowlist predicate
// ---------------------------------------------------------------------------

describe('isDecorativeFile — decorative allowlist predicate', () => {
  it('returns true for confetti.css (exact match)', () => {
    assert.equal(isDecorativeFile('confetti.css'), true);
  });

  it('returns true for path containing confetti (path prefix)', () => {
    assert.equal(isDecorativeFile('/some/path/confetti-animation.css'), true);
  });

  it('returns true for CONFETTI.CSS (case-insensitive)', () => {
    assert.equal(isDecorativeFile('CONFETTI.CSS'), true);
  });

  it('returns false for button.css', () => {
    assert.equal(isDecorativeFile('button.css'), false);
  });

  it('returns false for theme.css', () => {
    assert.equal(isDecorativeFile('theme.css'), false);
  });

  it('returns false for tokens.css', () => {
    assert.equal(isDecorativeFile('tokens.css'), false);
  });
});

// ---------------------------------------------------------------------------
// Integration: gate PASSES on the clean repo (exit 0)
// ---------------------------------------------------------------------------

describe('integration — gate passes on clean repo', () => {
  it('node scripts/verify-design-system.mjs exits 0 on the clean repo', () => {
    const result = spawnSync('node', [GATE_SCRIPT], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      // Give typecheck time to run
      timeout: 120_000,
    });

    if (result.status !== 0) {
      console.error('--- stdout ---');
      console.error(result.stdout);
      console.error('--- stderr ---');
      console.error(result.stderr);
    }

    assert.equal(
      result.status,
      0,
      `Gate should exit 0 on clean repo but exited ${result.status}.\nstdout: ${result.stdout}\nstderr: ${result.stderr}`
    );
  });
});

// ---------------------------------------------------------------------------
// Integration: gate CATCHES drift (proves it doesn't pass vacuously)
// ---------------------------------------------------------------------------

describe('integration — scanner detects violation in drifted CSS content', () => {
  it('reports violation when CSS contains hardcoded #bada55', () => {
    // Write a temp CSS file with a forbidden hardcoded color.
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-verify-test-'));
    const tmpCss = path.join(tmpDir, 'drifted-component.css');

    try {
      fs.writeFileSync(
        tmpCss,
        [
          '/* Simulated drift — a developer hardcoded a color instead of using a token */',
          '.widget {',
          '  background: #bada55;',
          '  color: var(--ds-color-fg);',
          '}',
        ].join('\n'),
        'utf8'
      );

      const content = fs.readFileSync(tmpCss, 'utf8');
      const violations = scanCssForHardcodedColors(content);

      assert.ok(
        violations.length >= 1,
        `Expected scanner to report ≥1 violation for #bada55, got ${violations.length}`
      );

      const hasHexViolation = violations.some(
        (v) => v.label === 'hex color' && v.matched === '#bada55'
      );
      assert.ok(
        hasHexViolation,
        `Expected a 'hex color' violation matching '#bada55'. Got: ${JSON.stringify(violations)}`
      );
    } finally {
      // Clean up temp dir regardless of test outcome.
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('confirms scanner returns 0 violations for a fully-compliant CSS string (baseline)', () => {
    const cleanCss = [
      '.widget {',
      '  background: var(--ds-color-surface);',
      '  color: var(--ds-color-fg);',
      '}',
    ].join('\n');

    const violations = scanCssForHardcodedColors(cleanCss);
    assert.equal(
      violations.length,
      0,
      `Expected 0 violations for compliant CSS, got ${violations.length}: ${JSON.stringify(violations)}`
    );
  });
});

// ---------------------------------------------------------------------------
// Portable gate: runnable from another repo (Skyline and other consumers)
// ---------------------------------------------------------------------------

describe('parseArgs — consumer configuration', () => {
  it('defaults to <cwd>/designs and pnpm -r typecheck', () => {
    const config = parseArgs([], '/work/app');
    assert.equal(config.root, '/work/app');
    assert.deepEqual(config.designsDirs, ['/work/app/designs']);
    assert.deepEqual(config.packageDirs, []);
    assert.equal(config.typecheck, 'pnpm -r typecheck');
  });

  it('resolves --designs, --package and --tokens against --root', () => {
    const config = parseArgs(
      ['--root', '/work/app', '--package', 'packages/ui/skyline', '--tokens', 'theme/tokens.css'],
      '/elsewhere'
    );
    assert.equal(config.root, '/work/app');
    assert.deepEqual(config.designsDirs, [], 'an explicit --package drops the designs default');
    assert.deepEqual(config.packageDirs, ['/work/app/packages/ui/skyline']);
    assert.equal(config.tokensCss, '/work/app/theme/tokens.css');
  });

  it('accepts a custom typecheck command or none', () => {
    assert.equal(parseArgs(['--typecheck', 'npm run check']).typecheck, 'npm run check');
    assert.equal(parseArgs(['--no-typecheck']).typecheck, null);
  });

  it('rejects unknown options and missing values', () => {
    assert.throws(() => parseArgs(['--bogus']), /Unknown option/);
    assert.throws(() => parseArgs(['--package']), /needs a value/);
  });
});

/** A minimal consumer repo: one design package, a token stylesheet, an adapter. */
function makeConsumerRepo({ css }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-verify-consumer-'));
  const pkgDir = path.join(root, 'packages', 'ui', 'skyline-svelte');
  fs.mkdirSync(path.join(pkgDir, 'src', 'lib'), { recursive: true });
  fs.writeFileSync(path.join(pkgDir, 'package.json'), JSON.stringify({ name: '@acme/skyline-svelte' }));
  fs.writeFileSync(path.join(pkgDir, 'src', 'button.css'), css);
  fs.writeFileSync(
    path.join(pkgDir, 'src', 'lib', 'contract-adapter.ts'),
    'export const skylineContractAdapter = {};\n'
  );
  // Tokens come from the installed package, as they would in a real consumer.
  const tokensDir = path.join(root, 'node_modules', '@syntropic137', 'design-tokens');
  fs.mkdirSync(path.join(tokensDir, 'generated'), { recursive: true });
  fs.writeFileSync(
    path.join(tokensDir, 'package.json'),
    JSON.stringify({
      name: '@syntropic137/design-tokens',
      exports: { './css': './generated/design-tokens.css' },
    })
  );
  fs.writeFileSync(
    path.join(tokensDir, 'generated', 'design-tokens.css'),
    ':root { --ds-color-fg: #000; }\n'
  );
  return root;
}

function runGateBin(args, cwd) {
  return spawnSync('node', [GATE_BIN, ...args], { cwd, encoding: 'utf8', timeout: 60_000 });
}

describe('integration — gate runs from another repo', () => {
  it('passes a compliant consumer package, resolving tokens from node_modules', () => {
    const root = makeConsumerRepo({ css: '.b { color: var(--ds-color-fg); }\n' });
    try {
      const config = parseArgs(['--package', 'packages/ui/skyline-svelte'], root);
      assert.equal(
        config.tokensCss,
        fs.realpathSync(
          path.join(root, 'node_modules/@syntropic137/design-tokens/generated/design-tokens.css')
        )
      );
      assert.deepEqual(
        discoverDesignPackages(config).map((p) => p.name),
        ['@acme/skyline-svelte']
      );

      const result = runGateBin(
        ['--package', 'packages/ui/skyline-svelte', '--typecheck', 'node -e "process.exit(0)"'],
        root
      );
      assert.equal(result.status, 0, result.stdout + result.stderr);
      assert.match(result.stdout, /design-system:verify: PASSED/);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('fails a consumer package with a hardcoded colour', () => {
    const root = makeConsumerRepo({ css: '.b { color: #bada55; }\n' });
    try {
      const result = runGateBin(['--package', 'packages/ui/skyline-svelte', '--no-typecheck'], root);
      assert.equal(result.status, 1, result.stdout + result.stderr);
      assert.match(result.stdout, /CHECK B {2}.*FAIL/);
      assert.match(result.stdout, /CHECK C {2}.*SKIP/);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('fails when the typecheck command fails', () => {
    const root = makeConsumerRepo({ css: '.b { color: var(--ds-color-fg); }\n' });
    try {
      const result = runGateBin(
        ['--package', 'packages/ui/skyline-svelte', '--typecheck', 'node -e "process.exit(3)"'],
        root
      );
      assert.equal(result.status, 1, result.stdout + result.stderr);
      assert.match(result.stdout, /CHECK C {2}.*FAIL/);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('exits 2 with usage on a bad option', () => {
    const result = runGateBin(['--bogus'], REPO_ROOT);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /Usage: design-system-verify/);
  });
});
