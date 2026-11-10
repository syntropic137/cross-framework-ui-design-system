# ADR-0011: One DTCG token source per design, generating CSS, resolved JSON and typed Rust

- Status: Accepted 2026-11-10 (names and publish policy: the DreamShip design contract, dreamship-v0-xvzo6.2 C1-C5)
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
  `$extensions["com.syntropic137.gradient"].angle`; OpenType features in
  `$extensions["com.syntropic137.typography"].fontFeatures` (e.g. tabular figures); the `em` dimension unit for
  type-relative sizes (tracking).
- The reader is a declared subset of DTCG 2025.10: curly-brace aliases (token and
  composite-property level) are supported; JSON Pointer `$ref`, `$root` and
  `$extends` are rejected with an error, never skipped, so no token is silently
  lost. Types: color (srgb), dimension, duration, cubicBezier, fontFamily,
  fontWeight, number, typography, gradient. Adding `$ref` is a separate change if a
  source ever needs it.
- Colours are quantised to 8 bits per channel at read time, so the contrast gate
  judges exactly the colour every output ships.
- The existing `--ds-*` generic token layer (ADR-0002) is unchanged.

## Consequences

- A theme swap is a source edit plus `tokens:build`; CSS, JSON and Rust change together.
- Rust consumers depend on the crate by git tag (no crates.io pipeline yet).
- Rust consumers pin the crate by the full sha of the release tag commit (`rev`), the tag only as a comment.

## Contract (dreamship-v0-xvzo6.2, ds_architect 2026-11-09)

- C1 Contract surface: every semantic and component token plus the reference
  scales (space, radius, duration, easing, font, typography). One name, three
  spellings: DTCG `color.content.secondary` = CSS `--ds-color-content-secondary` =
  Rust `color_content_secondary` = resolved-JSON key; a test proves the sets equal.
  The raw reference palette (reference-layer `color.*`, `gradient.*`, named by
  `design.json` `reference`) is not contract: CSS emits it as `--ds-ref-<path>`,
  JSON and Rust leave it out. `spatial.*` is reserved; the stub emits nothing.
- C2 A design replaces the generic ADR-0002 layer, never stacks on it: a document
  loads exactly one tokens sheet, marked `--ds-design: "<name>"`. Same name, same
  role in every design; values differ (the theme swap). Old names ship as one
  generated alias sheet (`design.json` `aliases`) for at least one minor that reaches npm, and are deleted only when a count of their uses across the consumers reads 0; the deletion PR shows the count (amended 2026-11-10, ARCH: 0.2.x never reached npm, so the `--os-*` aliases live through 0.3.x, earliest deletion 0.4.0).
- C3 Lockstep: npm design-tokens, design-contracts and the Rust crate carry one
  version (tested). 0.x: removing or renaming a contract name is a minor bump with
  an alias sheet; adding is minor; a value change that passes contrast is a patch.
  `--ds-ref-*` changes never break.
- C4 Publish: npm per ADR-0008 (two foundations; `designs/*` private); the Rust
  crate stays `publish = false`, consumed by git `rev`; generated Rust is committed
  and the drift test fails a stale copy.
