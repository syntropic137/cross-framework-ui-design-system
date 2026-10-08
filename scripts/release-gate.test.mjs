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
import assert from 'node:assert/strict';

import {
  checkSemver,
  checkTag,
  classifyNpmView,
  checkRegistry,
  checkChangelog,
  runGate,
} from './release-gate.mjs';
import { checkLockstep } from './lib/publishable-packages.mjs';

const NAMES = [
  '@syntropic137/contracts',
  '@syntropic137/design-tokens',
  '@syntropic137/default-react-v18',
  '@syntropic137/default-svelte-v5',
  '@syntropic137/brutalist-react-v18',
  '@syntropic137/brutalist-svelte-v5',
];
const pkgs = (version) => NAMES.map((name) => ({ name, version }));

const E404 = { status: 1, stdout: '', stderr: 'npm error code E404\nnpm error 404 Not Found\n' };
const NETWORK = {
  status: 1,
  stdout: '',
  stderr: 'npm error code ENOTFOUND\nnpm error network request to https://registry.npmjs.org failed\n',
};
const published = (v) => ({ status: 0, stdout: `${v}\n`, stderr: '' });

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

describe('checkLockstep', () => {
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
  it('exit 0 with no output is absent', () =>
    assert.equal(classifyNpmView('0.2.0', { status: 0, stdout: '\n', stderr: '' }), 'absent'));
  it('exit 0 echoing the version is published', () =>
    assert.equal(classifyNpmView('0.2.0', published('0.2.0')), 'published'));
  it('a network error is an error, never absent', () => {
    const r = classifyNpmView('0.2.0', NETWORK);
    assert.equal(typeof r, 'object');
    assert.match(r.error, /ENOTFOUND/);
  });
  it('a non-404 HTTP error is an error', () => {
    const r = classifyNpmView('0.2.0', { status: 1, stdout: '', stderr: 'npm error code E500\n' });
    assert.match(r.error, /E500/);
  });
  it('a spawn failure is an error', () => {
    const r = classifyNpmView('0.2.0', { status: null, error: new Error('spawn npm ENOENT') });
    assert.match(r.error, /ENOENT/);
  });
  it('unexpected output is an error', () => {
    assert.ok(classifyNpmView('0.2.0', { status: 0, stdout: '0.1.0\n', stderr: '' }).error);
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
        packages: pkgs('0.2'),
        localTags: () => ['v0.2'],
        npmView: (name) => (name.endsWith('tokens') ? published('0.2') : E404),
        changelog: () => '## Unreleased\n\n- x\n',
      }),
    );
    assert.equal(r.problems.length, 4);
    assert.match(r.problems[0], /not valid semver/);
    assert.match(r.problems[1], /tag v0\.2 already exists/);
    assert.match(r.problems[2], /design-tokens@0\.2 is already on npm/);
    assert.match(r.problems[3], /Unreleased/);
  });
});
