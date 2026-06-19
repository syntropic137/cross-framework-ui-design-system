# Distribution & Packaging

How the design system is packaged, versioned, and published to npm. The *decision*
and rationale live in [ADR-0008](./adrs/ADR-0008-npm-distribution.md); this page is
the practical map and the pre-publish checklist.

## What ships

| Package | Publishes? | Runtime deps | Notes |
| --- | --- | --- | --- |
| `@syntropic137/contracts` | ✅ public | **none** (enforced) | framework-neutral API |
| `@syntropic137/design-tokens` | ✅ public | **none** (enforced) | tokens CSS + JSON |
| `@syntropic137/<design>-react-v18` | ✅ public | `clsx` only | `react`/`react-dom` are peers |
| `@syntropic137/<design>-svelte-v5` | ✅ public | `bits-ui` (`default` cell today) | `svelte` is a peer; cell deps audited in `rcl-tws.9` |
| `apps/tauri-harness*` | 🚫 private | — | demo apps, not products |
| `@syntropic137/component-generator` | 🚫 private | — | internal dev tool |
| `@syntropic137/dashboard` | 🚫 private | — | internal dev tool |

## Zero-dependency foundation

`contracts` and `design-tokens` are the foundation every consumer pulls in, so they
carry **zero runtime dependencies** — auditable to nothing. Today this holds by
construction (both packages declare no `dependencies`) but is **not yet enforced**: the
plan is a check (extending `design-system:verify`) that fails CI if either package
declares a runtime dependency, tracked in `rcl-tws.9`. The design *cells* are
deliberately not zero-dep: the react cells carry `clsx` and `default-svelte-v5` carries
`bits-ui`; the zero-dep guarantee is scoped to `contracts` and `design-tokens`.

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
   on it; this PR is the release gate.
3. **Merge.** `.github/workflows/release.yml` re-runs `pnpm qa`, then
   `pnpm publish:packages` publishes the 6 public packages, tags `vX.Y.Z`, and cuts a
   GitHub Release. A guard skips publish if the tag already exists, so re-pushing
   `release` is idempotent.

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
`syntropic137/cross-framework-ui-design-system` and workflow file
`.github/workflows/release.yml`.

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
pnpm add @syntropic137/contracts @syntropic137/design-tokens \
         @syntropic137/default-svelte-v5
```

There is also a planned **shadcn-style source export** (`rcl-tws.3`) for consumers
who prefer to copy component source in rather than depend on the package.
