/**
 * release-gate.test.mjs
 *
 * Proof tests for scripts/release-gate.mjs. Every check is exercised in both
 * directions (catches the problem, passes the clean case) against fake tag lists,
 * fake `npm view` results and fake changelogs. No network, no git.
 *
 * Zero external dependencies: Node built-ins only.
 */

import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  checkSemver,
  checkTag,
  classifyNpmView,
  checkRegistry,
  checkChangelog,
  runGate,
  checkPackageName,
  npmViewArgs,
  npmViewEnv,
  NPM_REGISTRY,
} from './release-gate.mjs';
import {
  checkLockstep,
  checkPackageSet,
  findPublishable,
  pkgDirs,
  workspaceGlobs,
  EXPECTED_PACKAGES,
} from './lib/publishable-packages.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO_WORKSPACE = fs.readFileSync(path.join(REPO_ROOT, 'pnpm-workspace.yaml'), 'utf8');

/** A temp workspace: { 'dir': manifest } plus this repo's pnpm-workspace.yaml (or `yaml`). */
function withWorkspace(manifests, fn, yaml = REPO_WORKSPACE) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'release-gate-ws-'));
  try {
    fs.writeFileSync(path.join(root, 'pnpm-workspace.yaml'), yaml);
    for (const [dir, manifest] of Object.entries(manifests)) {
      fs.mkdirSync(path.join(root, dir), { recursive: true });
      fs.writeFileSync(path.join(root, dir, 'package.json'), JSON.stringify(manifest));
    }
    return fn(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}
const REAL_DIRS = [
  'packages/contracts',
  'packages/design-tokens',
  'designs/default/react-v18',
  'designs/default/svelte-v5',
  'designs/brutalist/react-v18',
  'designs/brutalist/svelte-v5',
];
const realManifests = (over = {}) =>
  Object.fromEntries(
    REAL_DIRS.map((dir, i) => [dir, { name: EXPECTED_PACKAGES[i], version: '0.2.0', private: false, ...over[dir] }]),
  );

const NAMES = [
  '@syntropic137/contracts',
  '@syntropic137/design-tokens',
  '@syntropic137/default-react-v18',
  '@syntropic137/default-svelte-v5',
  '@syntropic137/brutalist-react-v18',
  '@syntropic137/brutalist-svelte-v5',
];
const pkgs = (version) => NAMES.map((name) => ({ name, version }));

/** What `npm view --json` prints on failure (stdout), as observed on npm 10. */
const jsonError = (code, summary = '', detail = '') =>
  JSON.stringify({ error: { code, summary, detail } }, null, 2) + '\n';
const E404 = {
  status: 1,
  stdout: jsonError('E404', 'Not Found - GET https://registry.npmjs.org/x - Not found'),
  stderr: 'npm error code E404\n',
};
const NETWORK = {
  status: 1,
  stdout: jsonError('ENOTFOUND', 'request to https://registry.npmjs.org failed'),
  stderr: 'npm error code ENOTFOUND\n',
};
const published = (v) => ({ status: 0, stdout: `${JSON.stringify(v)}\n`, stderr: '' });

const CHANGELOG = '# Changelog\n\n<!-- releases -->\n\n## 0.2.0 - 2026-10-08\n\n- stuff\n\n## 0.1.0 - 2026-06-15\n';

/** A clean io for 0.2.0; override any field per test. */
const io = (over = {}) => ({
  packages: pkgs('0.2.0'),
  localTags: () => ['v0.1.0'],
  remoteTags: () => [],
  npmView: () => E404,
  changelog: () => CHANGELOG,
  ...over,
});

it('fixture names are exactly EXPECTED_PACKAGES', () => {
  assert.deepEqual([...NAMES].sort(), [...EXPECTED_PACKAGES].sort());
});

it("discovery over this repo's real manifests is exactly EXPECTED_PACKAGES", () => {
  const found = findPublishable(REPO_ROOT);
  assert.deepEqual(found.map((p) => p.name).sort(), [...EXPECTED_PACKAGES].sort());
  assert.deepEqual(checkPackageSet(found), []);
});

describe('workspace discovery', () => {
  it('reads the pnpm-workspace.yaml packages globs', () => {
    assert.deepEqual(workspaceGlobs(REPO_WORKSPACE), [
      'packages/*',
      'packages/*/*',
      'packages/*/*/*',
      'apps/*',
      'designs/*/*',
    ]);
  });
  it('refuses a workspace file it cannot read rather than discovering nothing', () => {
    assert.throws(() => workspaceGlobs('packages:\n  - {weird: 1}\n'), /cannot parse/);
    assert.throws(() => workspaceGlobs('catalog:\n  x: 1\n'), /no packages globs/);
  });
  it('discovers a publishable manifest under apps/ and fails the set', () => {
    const manifests = realManifests();
    manifests['apps/stray'] = { name: '@syntropic137/stray-app', version: '0.2.0', private: false };
    withWorkspace(manifests, (root) => {
      const names = findPublishable(root).map((p) => p.name);
      assert.ok(names.includes('@syntropic137/stray-app'));
      const p = checkPackageSet(findPublishable(root));
      assert.equal(p.length, 1);
      assert.match(p[0], /unexpected publishable package "@syntropic137\/stray-app"/);
    });
  });
  it('discovers the deepest glob (packages/*/*/*) and skips node_modules', () => {
    const manifests = realManifests();
    manifests['packages/a/b/c'] = { name: '@syntropic137/deep', version: '0.2.0', private: false };
    manifests['packages/node_modules/x'] = { name: '@syntropic137/nm', version: '0.2.0', private: false };
    withWorkspace(manifests, (root) => {
      const dirs = pkgDirs(root);
      assert.ok(dirs.includes('packages/a/b/c'));
      assert.ok(!dirs.some((d) => d.includes('node_modules')));
    });
  });
  it('honours ! exclusion globs', () => {
    const manifests = realManifests();
    manifests['apps/stray'] = { name: '@syntropic137/stray-app', version: '0.2.0', private: false };
    withWorkspace(
      manifests,
      (root) => assert.ok(!pkgDirs(root).includes('apps/stray')),
      REPO_WORKSPACE + '  - "!apps/stray"\n',
    );
  });
  it('matches what pnpm itself lists for this repo', () => {
    assert.deepEqual(pkgDirs(REPO_ROOT), [
      'apps/tauri-harness',
      'apps/tauri-harness-svelte',
      'designs/brutalist/react-v18',
      'designs/brutalist/svelte-v5',
      'designs/default/react-v18',
      'designs/default/svelte-v5',
      'packages/contracts',
      'packages/design-tokens',
      'packages/dev-tools/component-generator',
      'packages/dev-tools/dashboard',
    ]);
  });
});

describe('checkPackageSet', () => {
  it('passes the exact expected set', () => assert.deepEqual(checkPackageSet(pkgs('0.2.0')), []));
  it('fails a missing package', () => {
    const p = checkPackageSet(pkgs('0.2.0').slice(1));
    assert.equal(p.length, 1);
    assert.match(p[0], /expected package @syntropic137\/contracts was not discovered/);
  });
  it('fails a renamed package (one unexpected, one missing)', () => {
    const set = pkgs('0.2.0');
    set[0] = { ...set[0], name: '@syntropic137/design-contracts' };
    const p = checkPackageSet(set);
    assert.equal(p.length, 2);
    assert.match(p.join('\n'), /unexpected publishable package "@syntropic137\/design-contracts"/);
    assert.match(p.join('\n'), /expected package @syntropic137\/contracts was not discovered/);
  });
  it('fails a duplicated package', () => {
    const set = [...pkgs('0.2.0'), { name: '@syntropic137/design-tokens', version: '0.2.0' }];
    const p = checkPackageSet(set);
    assert.equal(p.length, 1);
    assert.match(p[0], /design-tokens" is declared by 2/);
  });
  it('fails a package excluded by losing "private": false (real discovery on disk)', () => {
    withWorkspace(realManifests({ [REAL_DIRS[3]]: { private: true } }), (root) => {
      const found = findPublishable(root);
      assert.equal(found.length, 5);
      const p = checkPackageSet(found);
      assert.equal(p.length, 1);
      assert.match(p[0], new RegExp(`${EXPECTED_PACKAGES[3]} was not discovered`));
      // ...and the whole gate fails, even though the remaining five are clean.
      assert.equal(runGate(io({ packages: found })).problems.length, 1);
    });
  });
});

describe('checkLockstep', () => {
  it('fails six null versions instead of passing', () => {
    const { version, problems } = checkLockstep(pkgs(null));
    assert.equal(version, null);
    assert.equal(problems.length, 6);
    assert.match(problems[0], /has no valid version \(got null\)/);
  });
  it('fails missing, empty and non-string versions', () => {
    const set = pkgs('0.2.0');
    set[0] = { name: set[0].name };
    set[1] = { ...set[1], version: '' };
    set[2] = { ...set[2], version: 2 };
    const { version, problems } = checkLockstep(set);
    assert.equal(version, null);
    assert.equal(problems.length, 3);
  });
  it('passes one shared version', () => {
    assert.deepEqual(checkLockstep(pkgs('0.2.0')), { version: '0.2.0', problems: [] });
  });
  it('fails a mixed set, naming every package', () => {
    const mixed = pkgs('0.2.0');
    mixed[3] = { ...mixed[3], version: '0.1.9' };
    const { version, problems } = checkLockstep(mixed);
    assert.equal(version, null);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /0\.2\.0, 0\.1\.9/);
    assert.match(problems[0], /default-svelte-v5@0\.1\.9/);
  });
  it('fails an empty set', () => {
    assert.equal(checkLockstep([]).problems.length, 1);
  });
});

describe('checkSemver', () => {
  for (const v of ['0.2.0', '1.0.0-beta.1', '1.0.0+build.5', '10.20.30'])
    it(`accepts ${v}`, () => assert.deepEqual(checkSemver(v), []));
  for (const v of ['0.2', '01.2.3', 'v1.2.3', '1.2.3-', '1.2.3.4', ''])
    it(`rejects ${JSON.stringify(v)}`, () => assert.equal(checkSemver(v).length, 1));
});

describe('checkTag', () => {
  it('passes when the tag exists nowhere', () => {
    assert.deepEqual(checkTag('0.2.0', ['v0.1.0'], ['v0.1.0']), []);
  });
  it('fails a local-only tag', () => {
    assert.match(checkTag('0.2.0', ['v0.2.0'], [])[0], /v0\.2\.0 already exists \(locally\)/);
  });
  it('fails an origin-only tag (the stale v0.1.0 case)', () => {
    assert.match(checkTag('0.1.0', [], ['v0.1.0'])[0], /\(on origin\)/);
  });
  it('fails once when both have it', () => {
    const p = checkTag('0.1.0', ['v0.1.0'], ['v0.1.0']);
    assert.equal(p.length, 1);
    assert.match(p[0], /locally and on origin/);
  });
  it('does not match a prefix (v0.1.0 is not v0.1.0-beta.1)', () => {
    assert.deepEqual(checkTag('0.1.0', ['v0.1.0-beta.1'], ['v0.1.00']), []);
  });
});

describe('classifyNpmView', () => {
  it('E404 is absent', () => assert.equal(classifyNpmView('0.2.0', E404), 'absent'));
  it('exit 0 with no output is an error, never absent', () => {
    const r = classifyNpmView('0.2.0', { status: 0, stdout: '\n', stderr: '' });
    assert.equal(typeof r, 'object');
    assert.match(r.error, /unparseable/);
  });
  it('an E500 whose diagnostics mention E404 is an error', () => {
    const r = classifyNpmView('0.2.0', {
      status: 1,
      stdout: jsonError('E500', 'Internal Server Error - GET https://registry.npmjs.org/x/E404', 'see /E404'),
      stderr: 'npm error code E404\nnpm error 404 nope\n',
    });
    assert.match(r.error, /^E500/);
  });
  it('plain-text E404 on stderr without a structured code is an error', () => {
    const r = classifyNpmView('0.2.0', { status: 1, stdout: '', stderr: 'npm error code E404\n' });
    assert.ok(r.error);
  });
  it('a structured E404 with exit 0 is an error (inconsistent npm output)', () => {
    assert.ok(classifyNpmView('0.2.0', { status: 0, stdout: jsonError('E404'), stderr: '' }).error);
  });
  it('a structured error with a misleading summary uses the code, not the text', () => {
    const r = classifyNpmView('0.2.0', { status: 1, stdout: jsonError('EAI_AGAIN', 'E404 Not Found'), stderr: '' });
    assert.match(r.error, /^EAI_AGAIN/);
  });
  it('an array result (range match) is an error', () => {
    assert.ok(classifyNpmView('0.2.0', { status: 0, stdout: '["0.2.0","0.2.1"]', stderr: '' }).error);
  });
  it('exit 0 echoing the version is published', () =>
    assert.equal(classifyNpmView('0.2.0', published('0.2.0')), 'published'));
  it('a network error is an error, never absent', () => {
    const r = classifyNpmView('0.2.0', NETWORK);
    assert.equal(typeof r, 'object');
    assert.match(r.error, /ENOTFOUND/);
  });
  it('a non-404 HTTP error is an error', () => {
    const r = classifyNpmView('0.2.0', { status: 1, stdout: jsonError('E500'), stderr: 'npm error code E500\n' });
    assert.match(r.error, /E500/);
  });
  it('a spawn failure is an error', () => {
    const r = classifyNpmView('0.2.0', { status: null, error: new Error('spawn npm ENOENT') });
    assert.match(r.error, /ENOENT/);
  });
  it('unexpected output is an error', () => {
    assert.ok(classifyNpmView('0.2.0', { status: 0, stdout: '"0.1.0"\n', stderr: '' }).error);
  });
});

describe('npm invocation', () => {
  it('accepts every expected name', () => {
    for (const n of EXPECTED_PACKAGES) assert.deepEqual(checkPackageName(n), []);
  });
  for (const bad of ['--registry=https://evil.example/', '-g', 'contracts', '@Syntropic137/X', '@a/b c', '', null])
    it(`rejects name ${JSON.stringify(bad)}`, () => assert.equal(checkPackageName(bad).length, 1));

  it('ends options with -- before the positional spec', () => {
    const args = npmViewArgs('@syntropic137/contracts', '0.2.0');
    const dd = args.indexOf('--');
    assert.ok(dd > 0);
    assert.deepEqual(args.slice(dd + 1), ['@syntropic137/contracts@0.2.0', 'version']);
    assert.ok(args.slice(0, dd).includes('--json'));
  });
  it('pins the npmjs registry globally and for the @syntropic137 scope', () => {
    assert.equal(NPM_REGISTRY, 'https://registry.npmjs.org/');
    const args = npmViewArgs('@syntropic137/contracts', '0.2.0');
    assert.ok(args.includes('--registry=https://registry.npmjs.org/'));
    assert.ok(args.includes('--@syntropic137:registry=https://registry.npmjs.org/'));
  });
  it('strips registry overrides from the spawn env, any case, keeps the rest', () => {
    const env = npmViewEnv({
      PATH: '/bin',
      npm_config_registry: 'https://private.example/',
      NPM_CONFIG_REGISTRY: 'https://private.example/',
      'npm_config_@syntropic137:registry': 'https://private.example/',
      npm_config_cache: '/c',
    });
    assert.deepEqual(env, { PATH: '/bin', npm_config_cache: '/c' });
  });
  it('runGate never queries npm for an invalid name, and fails it', () => {
    const queried = [];
    const set = pkgs('0.2.0');
    set[0] = { ...set[0], name: '--registry=https://evil.example/' };
    const r = runGate(io({ packages: set, npmView: (n) => (queried.push(n), E404) }));
    assert.ok(!queried.includes('--registry=https://evil.example/'));
    assert.equal(queried.length, 5);
    assert.ok(r.problems.some((p) => /not a valid scoped npm package name/.test(p)));
  });
});

describe('checkRegistry', () => {
  it('passes when every package is absent', () => {
    assert.deepEqual(checkRegistry('0.2.0', NAMES.map((name) => ({ name, result: 'absent' }))), []);
  });
  it('reports one line per published package and per error', () => {
    const results = NAMES.map((name) => ({ name, result: 'absent' }));
    results[0].result = 'published';
    results[2].result = { error: 'ENOTFOUND' };
    const p = checkRegistry('0.2.0', results);
    assert.equal(p.length, 2);
    assert.match(p[0], /contracts@0\.2\.0 is already on npm/);
    assert.match(p[1], /default-react-v18@0\.2\.0 failed: ENOTFOUND/);
  });
});

describe('checkChangelog', () => {
  it('accepts "## <version> - <date>"', () => assert.deepEqual(checkChangelog('0.2.0', CHANGELOG), []));
  it('accepts "## [<version>]"', () =>
    assert.deepEqual(checkChangelog('0.2.0', '# C\n\n## [0.2.0] - 2026-10-08\n'), []));
  it('accepts a bare "## <version>"', () => assert.deepEqual(checkChangelog('0.2.0', '## 0.2.0\n'), []));
  it('fails when the version is missing', () => {
    assert.match(checkChangelog('0.3.0', CHANGELOG)[0], /no "## 0\.3\.0" heading/);
  });
  it('fails a lingering "## Unreleased" with content and says so', () => {
    const p = checkChangelog('0.3.0', '# C\n\n## Unreleased\n\n- new thing\n\n## 0.2.0\n');
    assert.equal(p.length, 1);
    assert.match(p[0], /Unreleased/);
  });
  it('does not accept a prefix match (0.2.0 vs 0.2.0-beta.1 / 0.2.01)', () => {
    assert.equal(checkChangelog('0.2.0', '## 0.2.0-beta.1\n## 0.2.01\n').length, 1);
  });
  it('treats dots literally (0.2.0 does not match 0x2y0)', () => {
    assert.equal(checkChangelog('0.2.0', '## 0x2y0\n').length, 1);
  });
  it('fails a missing CHANGELOG.md', () => assert.equal(checkChangelog('0.2.0', null).length, 1));
  it('does not let "##" on one line pair with the version on the next', () => {
    assert.equal(checkChangelog('0.2.0', '##\n0.2.0\n').length, 1);
    assert.equal(checkChangelog('0.2.0', '##   \n0.2.0 - 2026-10-08\n').length, 1);
  });
  it('a fence closes only on a bare marker of the same char and >= length', () => {
    // `~~~example` has an info string, so it cannot close the fence.
    assert.equal(checkChangelog('0.2.0', '~~~\n~~~example\n## 0.2.0\n~~~\n').length, 1);
    // A shorter or different-character marker does not close it either.
    assert.equal(checkChangelog('0.2.0', '````\n```\n## 0.2.0\n````\n').length, 1);
    assert.equal(checkChangelog('0.2.0', '```\n~~~\n## 0.2.0\n```\n').length, 1);
    // Trailing spaces/tabs after a bare marker do close it.
    assert.deepEqual(checkChangelog('0.2.0', '~~~\nx\n~~~ \t\n## 0.2.0\n'), []);
    // An unclosed fence runs to end of file.
    assert.equal(checkChangelog('0.2.0', '```\n## 0.2.0\n').length, 1);
  });
  it('ignores headings inside HTML comments, single- or multi-line', () => {
    assert.equal(checkChangelog('0.2.0', '<!--\n## 0.2.0\n-->\n').length, 1);
    assert.equal(checkChangelog('0.2.0', '<!-- start\n\n## [0.2.0]\n\nend -->\n').length, 1);
    assert.equal(checkChangelog('0.2.0', '<!--\n## 0.2.0\n').length, 1); // unclosed
    // A one-line comment (the real `<!-- releases -->` marker) does not hide what follows.
    assert.deepEqual(checkChangelog('0.2.0', '<!-- releases -->\n\n## 0.2.0 - 2026-10-08\n'), []);
    assert.deepEqual(checkChangelog('0.2.0', '<!--\nx\n-->\n## 0.2.0\n'), []);
  });
  it('ignores headings inside fenced code blocks', () => {
    assert.equal(checkChangelog('0.2.0', '# C\n\n```md\n## 0.2.0\n```\n').length, 1);
    assert.equal(checkChangelog('0.2.0', '~~~\n## [0.2.0]\n~~~\n').length, 1);
  });
  it('still finds the heading after a closed fence', () => {
    assert.deepEqual(checkChangelog('0.2.0', '```\nx\n```\n\n## 0.2.0\n'), []);
  });
  it('ignores a version mentioned outside a level-2 heading', () => {
    assert.equal(checkChangelog('0.2.0', '### 0.2.0\n- bumped to 0.2.0\n').length, 1);
  });
});

describe('runGate', () => {
  it('passes a clean release and returns one row per package', () => {
    const r = runGate(io());
    assert.deepEqual(r.problems, []);
    assert.equal(r.version, '0.2.0');
    assert.equal(r.rows.length, 6);
    assert.ok(r.rows.every((row) => row.npm === 'absent'));
  });

  it("fails today's state: stale v0.1.0 tag on origin", () => {
    const r = runGate(
      io({ packages: pkgs('0.1.0'), localTags: () => ['v0.1.0'], remoteTags: () => ['v0.1.0'] }),
    );
    assert.equal(r.problems.length, 1);
    assert.match(r.problems[0], /tag v0\.1\.0 already exists \(locally and on origin\)/);
  });

  it('passes the same state once the tag is deleted', () => {
    const r = runGate(io({ packages: pkgs('0.1.0'), localTags: () => [], remoteTags: () => [] }));
    assert.deepEqual(r.problems, []);
  });

  it('stops after a lockstep failure (no version to check against)', () => {
    const mixed = pkgs('0.2.0');
    mixed[0] = { ...mixed[0], version: '0.1.0' };
    let viewed = 0;
    const r = runGate(io({ packages: mixed, npmView: () => (viewed++, E404) }));
    assert.equal(r.problems.length, 1);
    assert.equal(viewed, 0);
  });

  it('fails loudly when origin cannot be reached', () => {
    const r = runGate(
      io({
        remoteTags: () => {
          throw new Error('Could not resolve host: github.com');
        },
      }),
    );
    assert.equal(r.problems.length, 1);
    assert.match(r.problems[0], /could not list tags on origin: Could not resolve host/);
  });

  it('fails loudly when the registry cannot be reached, one line per package', () => {
    const r = runGate(io({ npmView: () => NETWORK }));
    assert.equal(r.problems.length, 6);
    assert.ok(r.problems.every((p) => /npm registry check .* failed: .*ENOTFOUND/.test(p)));
  });

  it('collects every problem, one line each', () => {
    const r = runGate(
      io({
        packages: pkgs('0.3.0'),
        localTags: () => ['v0.3.0'],
        npmView: (name) => (name.endsWith('tokens') ? published('0.3.0') : E404),
        changelog: () => '## Unreleased\n\n- x\n',
      }),
    );
    assert.equal(r.problems.length, 3);
    assert.match(r.problems[0], /tag v0\.3\.0 already exists/);
    assert.match(r.problems[1], /design-tokens@0\.3\.0 is already on npm/);
    assert.match(r.problems[2], /Unreleased/);
  });

  it('an invalid semver fails and never reaches npm', () => {
    let viewed = 0;
    const r = runGate(io({ packages: pkgs('0.2'), npmView: () => (viewed++, E404), changelog: () => '## 0.2\n' }));
    assert.equal(viewed, 0);
    assert.equal(r.problems.length, 1);
    assert.match(r.problems[0], /not valid semver/);
  });
});
