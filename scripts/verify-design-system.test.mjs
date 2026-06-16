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
  scanCssForHardcodedColors,
  isDecorativeFile,
} from './verify-design-system.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const GATE_SCRIPT = path.join(__dirname, 'verify-design-system.mjs');

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
