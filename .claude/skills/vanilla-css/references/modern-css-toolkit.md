# Modern CSS toolkit

What this covers: the modern CSS features worth reaching for in this system, each with
its 2026 Baseline support status and a short example, plus the accessibility media
queries. Read this when you want to use a recent feature and need to know whether it is
safe. Support status is cited to MDN, web.dev, and caniuse (current to 2026).

Baseline terms: "Widely available" means safe across evergreen browsers for years.
"Newly available" means it just reached all three engines (verify if you support old
versions). "Not Baseline" means at least one engine lags; use with a fallback.

## Selection and structure

- `:where(...)` (Widely): zero specificity, so base styles never fight component
  overrides. `:is(...)` (Widely) groups selectors but takes the highest specificity of
  its arguments. Use `:where()` for resettable base rules.
- `:has(...)` (Newly, 2023): the parent/relational selector.
  `.field:has(:invalid) { ... }` styles a field whose input is invalid, no JS.
- Native nesting with `&` (2024-25): nest related rules. Gotcha: a nested type selector
  like `& span` works, but a bare nested element selector at the start of a rule needs
  `&` or it is treated as a nested style rule; keep `&` explicit to avoid surprises.
- `@layer` (Widely, 2024): cascade layers; see `layers-and-separation.md`.

## Sizing and layout

- Container queries and container units `cqi`/`cqw`/`cqb` (Widely, 2025): size a
  component by its container, not the viewport. See `responsive-mobile-first.md`.
- `clamp()`/`min()`/`max()` (Widely): fluid type and space; see `rem-and-sizing.md`.
- Logical properties (`padding-inline`, `margin-block`, `inset-*`) (Widely): one rule
  for LTR, RTL, and vertical writing.
- `aspect-ratio` (Widely): hold a box shape without padding hacks.

## Color and theming

- Custom properties `--ds-*` (Widely): the token mechanism; see `theming-with-tokens.md`.
- `color-mix(in oklab, ...)` (Widely, 2023): derive shades from tokens, perceptually
  even.
- `light-dark()` (Newly, 2024): pick by scheme; requires `color-scheme: light dark`.
  Prefer `data-theme` overrides for this multi-theme system.
- `@property` (Newly, 2024): register a typed custom property for animatable or
  guarded values.
- `accent-color` (Not fully Baseline; Safari full support arrived 26.2): tints native
  checkboxes/radios from a token. Practically usable, degrades gracefully.

## Text and content

- `text-wrap: balance` (Widely-ish): balance short headings across lines.
- `text-wrap: pretty` (Not Baseline; no Firefox as of 2026): avoid orphans in body
  text; safe as a progressive enhancement.
- Scroll-driven animations (Experimental; no stable Firefox): treat as enhancement,
  always behind a fallback and `prefers-reduced-motion`.

## Accessibility media queries

- `@media (prefers-reduced-motion: reduce)`: gate or remove non-essential motion.
  Design motion as enhancement so the reduced path is the calm default.

  ```css
  @media (prefers-reduced-motion: no-preference) {
    .panel { transition: transform var(--ds-duration-base) var(--ds-ease); }
  }
  ```

- `@media (prefers-contrast: more)` and `@media (forced-colors: active)`: respect
  high-contrast and forced-colors modes; avoid removing system colors in forced-colors.
- `:focus-visible`: show a clear keyboard focus ring sourced from a token; satisfies
  WCAG 2.4.7 (Focus Visible) and supports 2.4.11/2.4.13 (focus appearance).
- Contrast targets (WCAG 1.4.3 AA): 4.5:1 for body text, 3:1 for large text and for
  non-text UI components and graphics. APCA is a WCAG 3 candidate, not yet a
  requirement, so check against 1.4.3 today.
- Never disable zoom (`user-scalable=no`, `maximum-scale=1`); it fails WCAG 1.4.4 and
  1.4.10.

## Sources

MDN CSS reference and per-feature pages; web.dev/Chrome Baseline updates; caniuse; WCAG
2.2 Understanding docs (1.4.3, 1.4.4, 1.4.10, 2.4.7). Fetched June 2026.
