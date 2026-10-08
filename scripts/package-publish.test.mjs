/**
 * package-publish.test.mjs
 *
 * Proves the two foundation packages are publishable and usable from outside
 * this workspace: the manifests carry what npm and consumers need, and the
 * packed tarballs resolve every declared export, at runtime and for TypeScript.
 *
 * Needs a prior `pnpm build` (the qa gate runs build before this).
 * Zero external dependencies: Node built-ins, plus the repo's own pnpm and tsc.
 */

import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const REPO_URL = 'git+https://github.com/syntropic137/cross-framework-ui-design-system.git';

const FOUNDATION = [
  { dir: 'packages/contracts', name: '@syntropic137/design-contracts' },
  { dir: 'packages/design-tokens', name: '@syntropic137/design-tokens' },
];

const readManifest = (dir) =>
  JSON.parse(fs.readFileSync(path.join(ROOT, dir, 'package.json'), 'utf8'));

/** Every file path an `exports` map points at, flattened across conditions. */
function exportTargets(exportsField) {
  const out = [];
  const walk = (value) => {
    if (typeof value === 'string') out.push(value);
    else if (value && typeof value === 'object') Object.values(value).forEach(walk);
  };
  walk(exportsField);
  return out;
}

describe('foundation package manifests', () => {
  for (const { dir, name } of FOUNDATION) {
    describe(name, () => {
      const pkg = readManifest(dir);

      it('has the published name and is public', () => {
        assert.equal(pkg.name, name);
        assert.equal(pkg.private, false);
        assert.deepEqual(pkg.publishConfig, { access: 'public', provenance: true });
      });

      it('declares ESM, types, an exports map and a files allowlist', () => {
        assert.equal(pkg.type, 'module');
        assert.ok(pkg.types, 'types is set');
        assert.ok(pkg.exports?.['.'], 'exports["."] is set');
        assert.ok(pkg.exports['.'].types, 'exports["."] has a types condition');
        assert.ok(pkg.exports['./package.json'], 'exports exposes ./package.json');
        assert.ok(Array.isArray(pkg.files) && pkg.files.includes('dist'), 'files ships dist');
      });

      it('points repository at this repo and directory (needed for provenance)', () => {
        assert.equal(pkg.repository?.url, REPO_URL);
        assert.equal(pkg.repository?.directory, dir);
        assert.equal(pkg.license, 'MIT');
        assert.ok(pkg.description, 'description is set');
      });

      it('has zero runtime dependencies', () => {
        assert.deepEqual(Object.keys(pkg.dependencies ?? {}), []);
        assert.deepEqual(Object.keys(pkg.peerDependencies ?? {}), []);
      });
    });
  }

  it('keeps every publishable package on one lockstep version', () => {
    const versions = new Map();
    const scan = (rel, depth) => {
      const abs = path.join(ROOT, rel);
      if (!fs.existsSync(abs)) return;
      for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const child = path.join(rel, entry.name);
        const manifest = path.join(ROOT, child, 'package.json');
        if (fs.existsSync(manifest)) {
          const pkg = JSON.parse(fs.readFileSync(manifest, 'utf8'));
          if (pkg.private === false) versions.set(pkg.name, pkg.version);
        }
        if (depth > 0) scan(child, depth - 1);
      }
    };
    scan('packages', 1);
    scan('designs', 1);
    assert.equal(new Set(versions.values()).size, 1, JSON.stringify(Object.fromEntries(versions)));
  });
});

describe('packed tarballs work from a clean consumer', () => {
  let tmp;
  let consumer;

  before(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-pack-test-'));
    consumer = path.join(tmp, 'consumer');
    fs.mkdirSync(consumer);
    fs.writeFileSync(
      path.join(consumer, 'package.json'),
      JSON.stringify({ name: 'consumer', private: true, type: 'module' })
    );

    // Pack exactly what npm would receive, then unpack it into the consumer's
    // node_modules (no registry, no network: both packages have zero deps).
    for (const { dir, name } of FOUNDATION) {
      const out = execFileSync('pnpm', ['pack', '--pack-destination', tmp], {
        cwd: path.join(ROOT, dir),
        encoding: 'utf8',
      });
      const tgz = out.trim().split('\n').filter(Boolean).pop();
      const target = path.join(consumer, 'node_modules', ...name.split('/'));
      fs.mkdirSync(target, { recursive: true });
      execFileSync('tar', ['xzf', tgz, '-C', target, '--strip-components=1']);
    }
  });

  after(() => {
    if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('ships every file the exports maps point at', () => {
    for (const { name } of FOUNDATION) {
      const installed = path.join(consumer, 'node_modules', ...name.split('/'));
      const pkg = JSON.parse(fs.readFileSync(path.join(installed, 'package.json'), 'utf8'));
      for (const target of exportTargets(pkg.exports)) {
        assert.ok(fs.existsSync(path.join(installed, target)), `${name} is missing ${target}`);
      }
      assert.ok(!fs.existsSync(path.join(installed, 'tests')), `${name} must not ship tests`);
    }
  });

  it('imports at runtime through the exports maps (ESM and require)', () => {
    const script = `
      import { componentContractStatus } from '@syntropic137/design-contracts';
      import { tokenNames, cssVar } from '@syntropic137/design-tokens/names';
      import { createRequire } from 'node:module';
      const require = createRequire(import.meta.url);
      const cssPath = require.resolve('@syntropic137/design-tokens/css');
      if (componentContractStatus.button !== 'required') throw new Error('contracts');
      if (!tokenNames.includes('ds-color-accent')) throw new Error('names');
      if (cssVar('ds-color-accent') !== 'var(--ds-color-accent)') throw new Error('cssVar');
      if (!cssPath.endsWith('design-tokens.css')) throw new Error('css');
      console.log('ok');
    `;
    const result = spawnSync('node', ['--input-type=module', '-e', script], {
      cwd: consumer,
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.trim(), 'ok');
  });

  it('type-checks against the shipped declarations', () => {
    fs.writeFileSync(
      path.join(consumer, 'index.ts'),
      [
        "import type { ButtonContract } from '@syntropic137/design-contracts';",
        "import { cssVar, type TokenName } from '@syntropic137/design-tokens/names';",
        "const variant: ButtonContract['variant'] = 'primary';",
        "const name: TokenName = 'ds-color-accent';",
        "const ref: 'var(--ds-color-accent)' = cssVar('ds-color-accent');",
        '// @ts-expect-error - unknown token names must not compile',
        "cssVar('ds-color-nope');",
        'export { variant, name, ref };',
      ].join('\n')
    );
    fs.writeFileSync(
      path.join(consumer, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
          target: 'ES2022',
          strict: true,
          noEmit: true,
          skipLibCheck: false,
        },
        files: ['index.ts'],
      })
    );
    const tsc = path.join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc');
    const result = spawnSync('node', [tsc, '-p', consumer], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stdout + result.stderr);
  });
});
