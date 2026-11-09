# ADR-0011: One DTCG token source per design, generating CSS, resolved JSON and typed Rust

- Status: Proposed (names and publish policy are settled by the DreamShip design contract, dreamship-v0-xvzo6.2)
- Date: 2026-11-08
- Related: ADR-0002 (token generation), ADR-0006 (runtime theming), ADR-0008 (npm distribution)

## Context

DreamShip OS needs one design base across a native wgpu renderer, web pages and
in-world Screens. Its v1.0 kit had three token copies (kit `--ds-*`, this repo's
`--ds-*`, an in-engine `--os-*` set) and the renderer parsed CSS strings
(`linear-gradient(...)`, `rgba(...)`) to get colours. ADR-0002's generator emits
CSS and a JSON snapshot whose values are still CSS expressions, so a non-browser
consumer cannot use it without a CSS parser.

## Decision

- A design's source is DTCG JSON (Design Tokens Community Group format 2025.10) in
  `packages/design-tokens/dtcg/<design>/`, in four layers: reference (palette, font
  identities, scales), semantic (roles; one file per theme, every value an alias),
  component (only what a role does not already state) and spatial (stub until the
  interaction layer).
- `design.json` names the layer files, the themes with their CSS selectors, and a
  contrast policy. Generation fails when a theme misses a contrast minimum.
- One build (`tokens:build`) emits, from the resolved values only:
  - `generated/<design>/tokens.css`: custom properties in `@layer tokens`; the
    default theme in full, other themes as differences;
  - `generated/<design>/tokens.resolved.json`: colours as sRGB and linear
    components, numeric dimensions, millisecond durations, no CSS syntax;
  - `packages/design-tokens-rs/src/<design>.rs`: a typed `Theme` struct and one
    const per theme in the zero-dependency `no_std` crate
    `syntropic137-design-tokens`, committed so a Rust consumer needs no Node. Only `tokens:rust` rewrites
    it; the ordinary build does not, so the drift test fails on a stale copy.
- Extensions beyond DTCG, both namespaced or documented: gradient direction in
  `$extensions["com.syntropic137.gradient"].angle`; the `em` dimension unit for
  type-relative sizes (tracking).
- The existing `--ds-*` generic token layer (ADR-0002) is unchanged.

## Consequences

- A theme swap is a source edit plus `tokens:build`; CSS, JSON and Rust change together.
- Rust consumers depend on the crate by git tag (no crates.io pipeline yet).
- Open until the contract: the DTCG-path to CSS-name mapping (`color.content.primary`
  -> `--ds-color-content-primary`) and positional `space.N` collide in places with
  ADR-0002 names (`--ds-space-6` is 32px here, 24px there); a design's CSS is loaded
  instead of, not beside, the generic layer until the contract resolves this.
