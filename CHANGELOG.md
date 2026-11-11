# Changelog

All notable changes to the published `@syntropic137/*` packages. Versions move in
lockstep (see ADR-0009). Newest first.

<!-- releases -->

## 0.3.0 - 2026-11-10

DreamShip alpha additions (dreamship-v0-xvzo6.3, design pages xvzo6.9 and xvzo6.10, ARCH 2026-11-10;
approved by the operator 2026-11-11: K1-K6 and D3, badges on the kit look).
No kit value changes.

- New role `color.overlay.scrim` (`--ds-color-overlay-scrim`, Rust `color_overlay_scrim`):
  backdrop behind dialogs, sheets, modal menus and onboarding. Dark = kit night at 72%,
  light = kit ink at 40% (reference `night-scrim`, `ink-scrim`; no new colour).
- New component sizes: `component.control.height` 40px, `component.control.height-touch`
  44px (coarse pointer), `component.chip.height` 40px.
- New component token `component.badge.label` (typography, aliases `typography.editorial.label`):
  status badges keep the kit v1.0 label look (operator ruling 2026-11-11, xvzo6.10). Badge
  colours stay the status roles.
- New contract `toast` (planned): kind `info` | `failed`, message, optional action.
- The `--os-*` alias sheet stays through 0.3.x (0.2.0 never reached npm); deletion no
  earlier than 0.4.0, when a count of its uses reads 0 (ADR-0011 C2 amended).

## 0.2.0 - 2026-11-10

DreamShip design contract (dreamship-v0-xvzo6.2 C1-C4, ADR-0011 Accepted).

- **Breaking (0.x minor):** the DreamShip raw reference palette is no longer
  contract. CSS names it `--ds-ref-<path>` (was `--ds-color-palette-*`,
  `--ds-gradient-tide*`); resolved JSON and the Rust `Theme` drop it
  (`color_palette_*`, `gradient_tide*`). Name roles instead
  (`--ds-color-surface-page`, `--ds-gradient-brand`, ...).
- `generated/dreamship/tokens.css` sets `--ds-design: "dreamship"`, so a consumer
  can prove a page loads exactly one tokens sheet.
- New export `@syntropic137/design-tokens/dreamship.aliases.css`: interface-kit v1.1
  `--os-*` names as `var(--ds-*)`, for this minor only (deleted in 0.3.0). Where v1.1
  drifted from v1.0 (muted, focus, radius steps, label) the alias takes the contract
  value.
- npm `design-tokens`, `design-contracts` and the Rust crate
  `syntropic137-design-tokens` share one version; a test enforces it.

## 0.1.1 - 2026-10-08

First release through the automated pipeline (main -> `release` PR, release gate,
OIDC trusted publishing from the `npm-publish` environment). 0.1.0 was a one-time
local bootstrap publish.

- **Breaking:** only `@syntropic137/design-contracts` and `@syntropic137/design-tokens`
  publish to npm; the four `designs/` component implementations are private
  reference examples (ADR-0008, updated in place).
- Release gate (`pnpm release:gate`, `.github/workflows/release-gate.yml`): refuses
  mixed versions, invalid semver, an existing `v<version>` tag, a version already
  on npm, a missing CHANGELOG heading, and any `designs/` package that becomes
  publishable.
- Publish script: provenance only in CI, public registry pinned for lookup and
  publish, package set checked before publishing.
- Security: `SECURITY.md` documents the release model; `CODEOWNERS` covers the
  release-sensitive paths; dependency advisories cleared via pnpm overrides
  (`braces` ignore dated, expires 2027-01-08).
- `@syntropic137/design-tokens/names`: typed token-name list (`TokenName`,
  `tokenNames`, `isTokenName()`, `cssVar()`).
- Root font size: the packages never set it; guidance assumes the 16px default.
- The verify gate ships as `design-system-verify` and runs from a consumer repo.

### Breaking: `@syntropic137/contracts` is now `@syntropic137/design-contracts`

The component-contract package is renamed before its first publish (ADR-0010).
`@syntropic137/contracts` was never on npm, so only workspace or submodule
consumers are affected. To migrate:

1. In `package.json`, replace `"@syntropic137/contracts"` with
   `"@syntropic137/design-contracts"` (same version range).
2. Replace every import specifier:
   `from "@syntropic137/contracts"` becomes `from "@syntropic137/design-contracts"`.
   A one-liner for a repo:
   `grep -rl "@syntropic137/contracts" src | xargs sed -i 's#@syntropic137/contracts#@syntropic137/design-contracts#g'`
3. Update tsconfig `paths` aliases and any `pnpm --filter @syntropic137/contracts`
   scripts the same way.

The exported API (`RequiredComponentContracts`, `requiredContractNames`,
`componentContractStatus`, every `*Contract` type) is unchanged. The source
directory stays at `packages/contracts/`. `@syntropic137/design-tokens` keeps its
name.

## Unreleased

- _Nothing yet._

## 0.1.0 - 2026-06-15

- Initial cross-framework design system: `contracts`, `design-tokens`, and the
  `default`/`brutalist` x `react-v18`/`svelte-v5` design cells.
