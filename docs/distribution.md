# Distribution & Packaging

How the design system is packaged, versioned, and published to npm. The *decision*
and rationale live in [ADR-0008](./adrs/ADR-0008-npm-distribution.md); this page is
the practical map and the pre-publish checklist.

## What ships

| Package | Publishes? | Runtime deps | Notes |
| --- | --- | --- | --- |
| `@design-system/contracts` | ✅ public | **none** (enforced) | framework-neutral API |
| `@design-system/design-tokens` | ✅ public | **none** (enforced) | tokens CSS + JSON |
| `@design-system/<design>-react-v18` | ✅ public | `clsx` only | `react`/`react-dom` are peers |
| `@design-system/<design>-svelte-v5` | ✅ public | `bits-ui` (`default` cell today) | `svelte` is a peer; cell deps audited in `rcl-tws.9` |
| `apps/tauri-harness*` | 🚫 private | — | demo apps, not products |
| `@design-system/component-generator` | 🚫 private | — | internal dev tool |
| `@design-system/dashboard` | 🚫 private | — | internal dev tool |

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

## Pre-publish checklist (blockers today)

The repo is **not yet publish-ready**. Before the first `pnpm publish`:

- [ ] **Add an `exports` map to `@design-system/design-tokens`.** It is imported by
      subpath (`@design-system/design-tokens/generated/design-tokens.css`) but has
      no `exports` field — that works in bundlers now but breaks under strict
      `exports` resolution once published. Export `.`, `./generated/design-tokens.css`,
      and the JSON.
- [ ] **Normalize `private` / `publishConfig`.** Today the flags are inconsistent
      (contracts `false`, design-tokens `true`, default-react-v18 `true`,
      default-svelte-v5 `false`). Set `private` per the table above, and add to each
      publishable package:
      ```jsonc
      "publishConfig": { "access": "public", "provenance": true }
      ```
- [ ] **Verify `files` / `.npmignore`** ship only built output (+ source the
      shadcn-style export needs) and that types resolve — the react cells' post-vite
      `tsc --build` `.d.ts` emission (ADR-0004) must produce `dist/*.d.ts`.
- [ ] **Secure the `@design-system` npm scope** (create the org, or rename the scope
      to an owned one). Intersects the repo-rename beads `rcl-95y` / `rcl-0fp`.
- [ ] **Wire a publish workflow** (`rcl-tws.2`): bump shared version → update
      CHANGELOG → tag → CI runs `pnpm qa` then publishes with provenance.

## Release flow (target)

```bash
# 1. bump the shared version across all publishable packages
# 2. update CHANGELOG
# 3. commit + tag (e.g. v0.2.0)
git tag -a v0.2.0 -m "..." && git push --tags
# 4. CI: install --frozen-lockfile, pnpm qa, then:
pnpm -r --filter "./packages/*" --filter "./designs/*/*" publish \
  --access public --provenance --no-git-checks
```

Publishing always runs from CI with **npm provenance** (OIDC), `ignore-scripts=true`,
and `--frozen-lockfile` — the existing supply-chain hardening
([ADR-0008](./adrs/ADR-0008-npm-distribution.md)) carries straight into release.

## Consuming the published packages

Once published, external apps install exactly as in the
[cookbook](./cookbook/integrate-tauri.md):

```bash
pnpm add @design-system/contracts @design-system/design-tokens \
         @design-system/default-svelte-v5
```

There is also a planned **shadcn-style source export** (`rcl-tws.3`) for consumers
who prefer to copy component source in rather than depend on the package.
