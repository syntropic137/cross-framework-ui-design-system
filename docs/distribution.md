# Distribution & Packaging

How the design system is packaged, versioned, and published to npm. The *decision*
and rationale live in [ADR-0008](./adrs/ADR-0008-npm-distribution.md); this page is
the practical map and the pre-publish checklist.

## What ships

| Package | Publishes? | Runtime deps | Notes |
| --- | --- | --- | --- |
| `@syntropic137/design-contracts` | ✅ public | **none** (enforced) | framework-neutral API |
| `@syntropic137/design-tokens` | ✅ public | **none** (enforced) | tokens CSS + JSON |
| `@syntropic137/<design>-react-v18` | ✅ public | `clsx` only | `react`/`react-dom` are peers |
| `@syntropic137/<design>-svelte-v5` | ✅ public | `bits-ui` (`default` cell today) | `svelte` is a peer; cell deps audited in `rcl-tws.9` |
| `apps/tauri-harness*` | 🚫 private | — | demo apps, not products |
| `@syntropic137/component-generator` | 🚫 private | — | internal dev tool |
| `@syntropic137/dashboard` | 🚫 private | — | internal dev tool |

## Zero-dependency foundation

`design-contracts` and `design-tokens` are the foundation every consumer pulls in, so they
carry **zero runtime dependencies** — auditable to nothing. This is enforced:
`scripts/package-publish.test.mjs` (run by `test:verify` in `pnpm qa`) fails if either
package declares `dependencies` or `peerDependencies`. The design *cells* are
deliberately not zero-dep: the react cells carry `clsx` and `default-svelte-v5` carries
`bits-ui`; the zero-dep guarantee is scoped to `design-contracts` and `design-tokens`.

The verify gate itself ([ADR-0005](./adrs/ADR-0005-enforcement-gate.md)) is likewise
zero-dep (Node built-ins only) for the same reason.

## Versioning

All design-system packages move in **lockstep** under one semver line, equal to the
Standard version in [`component-standard.md`](./component-standard.md). A contract
change ripples across every cell, so the contract release *is* the unit of release.
Practical consequence: compatible versions are simply *equal* versions.

`workspace:^` references between packages are rewritten to the concrete published
version automatically at `pnpm publish` time.

## Status: wired vs manual prerequisites

The packaging and pipeline are wired in-repo (ADR-0009). Done:

- [x] **`exports` map on `@syntropic137/design-tokens`** (`.`,
      `./generated/design-tokens.css`, `./generated/design-tokens.json`).
- [x] **Normalized `private` / `publishConfig`.** The 6 publishable packages are
      `"private": false` with `"publishConfig": { "access": "public", "provenance":
      true }` and a `repository` field; apps, dashboard, and generator are
      `"private": true`, and the publish script skips anything not publishable.
- [x] **Foundation packages consumable from outside the workspace**:
      `@syntropic137/design-contracts` and `@syntropic137/design-tokens` carry
      `exports` (with `types` and a `./package.json` entry), a `files` allowlist,
      `sideEffects`, `description` and `repository.directory` for provenance.
      `design-tokens` adds `./css` and the browser-safe, typed `./names` subpath.
      `scripts/package-publish.test.mjs` (part of `test:verify`) packs both,
      unpacks them into a clean consumer, and proves every export resolves at
      runtime and type-checks under `NodeNext`.
- [x] **Lockstep guard**: `publish:packages` refuses to publish when the
      publishable packages are not on one version.
- [x] **Release workflow + version tooling**: `.github/workflows/release.yml`,
      `scripts/bump-version.mjs`, and the `version:bump` / `publish:packages` scripts.

Manual prerequisites (cannot be done from the repo; blockers for the first live
publish):

- [x] **npm org `syntropic137`** exists, so the `@syntropic137` scope is publishable.
- [ ] **Configure npm trusted publishing (OIDC)** for each of the 6 packages, so no
      token is stored. See "Trusted publishing (OIDC) setup" below, including the
      one-time first-publish bootstrap.
- [ ] **Protect the `release` branch**: require `ci.yml` green and a review before
      merge. This is what turns the `main` -> `release` PR into a real gate.
- [ ] (Optional) confirm `dist/*.d.ts` ship for the react cells (ADR-0004 emission)
      before the first publish.

## Release flow

The model is **release branch + gate + publish-on-merge** (ADR-0009):

1. **Bump** the lockstep version on `main`: `pnpm version:bump 0.2.0` (updates every
   publishable package + root, seeds a CHANGELOG entry). Edit the CHANGELOG entry.
2. **Open the release PR** `main` -> `release`. `ci.yml` runs the full `pnpm qa` gate
   on it, and `release-gate.yml` runs the release gate (below); this PR is the
   release gate.
3. **Merge.** `.github/workflows/release.yml` re-runs `pnpm qa`, then
   `pnpm publish:packages` publishes the 6 public packages, tags `vX.Y.Z`, and cuts a
   GitHub Release. A guard skips publish if the tag already exists, so re-pushing
   `release` is idempotent.

### Release gate

`.github/workflows/release-gate.yml` runs on every PR into `release` (and on manual
dispatch). It runs `pnpm release:gate` (`scripts/release-gate.mjs`, zero-dep) and
fails, one line per problem, unless all of these hold for the version being released:

- the 6 publishable packages are on one lockstep version, and it is valid semver;
- no tag `v<version>` exists, locally or on origin;
- none of the 6 packages has `<version>` on npm (`404` is the pass; a registry or
  network error fails the gate, it is never skipped);
- `CHANGELOG.md` has a `## <version>` or `## [<version>]` heading (a lingering
  `## Unreleased` does not count).

On success it prints a per-package summary table. Run it locally before opening the
release PR: `pnpm release:gate`. To make it blocking, add the `Release Gate` check to
the `release` branch protection alongside `check`.

> **First release:** a stale `v0.1.0` tag exists on origin (it points at a docs
> commit; nothing was published). The gate fails on it by design, so delete it
> before the first release PR can pass:
> `git push origin :refs/tags/v0.1.0 && git tag -d v0.1.0`.

`publish:packages` (`scripts/publish-packages.mjs`) packs each package with
`pnpm pack` (which rewrites `workspace:^` deps to real version ranges) and publishes
the tarball with `npm publish --provenance`. Plain `npm publish` could not do the
workspace rewrite, and pnpm 9 cannot do the OIDC handshake, so the split uses each
tool for what it does well. Publishing runs from CI with `ignore-scripts=true` and
`--frozen-lockfile` (the ADR-0008 supply-chain hardening).

## Trusted publishing (OIDC) setup

The release uses npm **trusted publishing**: instead of storing an `NPM_TOKEN`, npm
trusts a specific GitHub repo + workflow. At publish time the workflow presents its
short-lived GitHub OIDC id-token (`permissions: id-token: write` in `release.yml`),
npm verifies it against the configured trusted publisher, and issues ephemeral
credentials. Nothing long-lived to leak, and provenance is attached automatically.

Configure once per package on npmjs.com: the package's **Settings -> Trusted
Publishers -> GitHub Actions**, with repository
`syntropic137/cross-framework-ui-design-system` and workflow filename
`release.yml` (the filename only, not the path).

**First-publish bootstrap.** A trusted publisher is attached to a package that already
exists, but these 6 packages are not on npm yet. Do a one-time first publish to create
each, then add the trusted publisher for all future automated releases:

```bash
npm login                 # interactive, or use a short-lived automation token once
pnpm build
node scripts/publish-packages.mjs   # packs + npm publish using your npm login
```

After that, add the trusted publisher to each package; every later release then goes
through the workflow with zero tokens.

## Consuming the published packages

Once published, external apps install exactly as in the
[cookbook](./cookbook/integrate-tauri.md):

```bash
pnpm add @syntropic137/design-contracts @syntropic137/design-tokens \
         @syntropic137/default-svelte-v5
```

There is also a planned **shadcn-style source export** (`rcl-tws.3`) for consumers
who prefer to copy component source in rather than depend on the package.
