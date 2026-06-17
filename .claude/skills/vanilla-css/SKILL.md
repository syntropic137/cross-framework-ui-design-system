---
name: vanilla-css
description: >-
  Use when writing, reviewing, or debugging hand-written CSS in this design system.
  Covers rem-at-root sizing, mobile-first responsive layout, cascade-layer
  separation, container queries, logical properties, and token-driven swappable
  theming. Trigger phrases include "write CSS", "style this component", "make it
  responsive", "mobile-first", "rem sizing", "@layer", "dark mode", "theming", "the
  layout breaks on mobile", "center this", "why isn't this themeable", "pass the
  token gate". Do NOT use to define design-token values (those live in
  @syntropic137/design-tokens; this skill consumes them), and do NOT use for
  component scripting or framework logic (see the svelte-5 skill).
---

# vanilla-css

## Overview

CSS is the presentation layer of this design system, and the system's premise is
swappability: a component design or a theme can change without editing consumers.
Strong CSS here keeps every value in a design token, sizes off a single rem root so
the whole UI scales together and still honors user zoom, builds mobile-first,
separates concerns with cascade layers, and expresses theming as token overrides
rather than component edits. The house style is plain CSS with no framework or
styling dependency. This skill covers authoring and reviewing stylesheets; it does
not cover defining the token values themselves (that is the design-tokens package).

## Outcomes we are looking for

### Outcome 1: components are themeable and swappable without editing them

Color, spacing, and radius come from tokens, so a theme change or a design swap
touches tokens or a stylesheet, never a consumer.

Evidence signals:
- Component CSS references `var(--ds-*)` and contains no color or spacing literals.
- Switching `data-theme` or swapping the design package restyles the UI with no
  component edits.

### Outcome 2: the UI scales from one root knob and respects user zoom

Sizing flows from the root font-size, and enlarging text or zooming the page scales
the layout rather than breaking it.

Evidence signals:
- Type, spacing, radius, and breakpoints are in `rem`; the root is a percentage, not
  a fixed px.
- Text can reach 200% without clipping; no `user-scalable=no` or `maximum-scale=1`.

### Outcome 3: layouts are responsive, mobile-first

Base styles target the smallest screen and capability is added upward, so the common
(mobile) case is the simplest case.

Evidence signals:
- Media queries are `min-width` in `rem`; base styles carry no query.
- No horizontal scroll at 320 CSS px (WCAG 1.4.10 Reflow).

### Outcome 4: specificity is predictable without escalation

Precedence comes from cascade-layer order, not from selector weight or `!important`.

Evidence signals:
- The stylesheet declares `@layer` order; component rules live in the components
  layer.
- No `!important` used to win ordering; selectors stay flat and low-specificity.

### Outcome 5: CSS passes review and the verify gate the first time

A new stylesheet clears `design-system:verify` token discipline and the accessibility
basics without a rework pass.

Evidence signals:
- `pnpm design-system:verify` CHECK B reports no hardcoded colors.
- Interactive elements have a `:focus-visible` style; animation is gated behind
  `prefers-reduced-motion`.

## Principles

- Put values in tokens, not literals. Reference `var(--ds-*)`; raw brand colors live
  in token definitions. This is what makes theme and design swap work, and what the
  verify gate enforces.
- Size off one rem root knob. Set the root to a percentage (`62.5%` gives `1rem =
  10px`) and size in `rem`, because the user's browser font-size preference must
  still multiply through. A fixed-px root pins sizing and fails WCAG 1.4.4.
- Build mobile-first. Base styles target the smallest screen; add capability with
  `min-width` rem queries, because additive complexity keeps both the cascade and the
  mobile payload clean.
- Let cascade layers decide precedence. Order `@layer reset, base, tokens, components,
  utilities`; a later layer wins regardless of selector specificity, which ends
  specificity wars and the `!important` arms race.
- Separate presentation from behavior. Keep visual design in token-keyed stylesheets
  and out of markup and JS, because that decoupling is what lets a different design
  restyle the same markup.
- Decouple theme from component. Theme through `[data-theme]` token overrides, never
  per-component color edits, because a theme is a set of token values, not a component
  variant.
- Prefer the modern platform. Use `clamp()`/`min()`/`max()`, container queries,
  logical properties, `:has()`, and `color-mix()`, because they replace media-query
  stacks, JS, and RTL override blocks with declarative CSS, and most are Baseline in
  2026.
- Treat accessibility as correctness. Provide `:focus-visible` rings, gate motion
  behind `prefers-reduced-motion`, meet WCAG contrast ratios, and never disable zoom.

## Anti-patterns

- Hardcoded colors in component CSS (`#fff`, `rgb(...)`, or named colors like `white`
  and `black`), which fail the verify gate and lock the component out of theming.
- A fixed-px root font-size (`:root { font-size: 10px }`) that pins sizing and ignores
  the user's browser font-size preference.
- `px` used for type and spacing, so nothing scales when the root knob turns.
- Desktop-first `max-width` media queries that claw capability back instead of adding
  it upward.
- `!important` reached for to win a specificity fight that a cascade layer would settle
  by order.
- Deeply nested, high-specificity selectors that build fragile override chains.
- `clamp()` with a pure-`vw` preferred value and a `vw` cap, which traps users who
  zoom because no `rem` term responds to it.
- `100vh` for full-height sections, which overflows under mobile browser toolbars where
  `dvh`/`svh` were needed.
- Per-component color overrides standing in for a theme, so adding a theme means
  editing every component.
- A theme shipped as a separate stylesheet swapped at load time instead of token
  overrides, coupling components to a build step.
- Tailwind utility classes or CSS-in-JS pulled in, adding the styling dependency the
  system exists to avoid.
- Interactive elements with no `:focus-visible`, and motion that ignores
  `prefers-reduced-motion`.

## Recommended tools and practices (as of 2026-06-16)

### For: components are themeable and swappable without editing them

- CSS custom properties plus `[data-theme]` overrides as the theme mechanism. Ladders
  up by making a theme a set of token values that components read indirectly.
  Tradeoffs: every themeable value must first exist as a token.
- `color-mix(in oklab, var(--ds-color-x), var(--ds-color-fg) 12%)` for derived shades.
  Ladders up by deriving hover/border tints from tokens so they track theme changes.
  Tradeoffs: oklab mixing is perceptual and differs from naive sRGB blends.
- `pnpm design-system:verify` (CHECK B) as the gate. Ladders up by failing CI when a
  literal color sneaks into component CSS. Tradeoffs: it scans component CSS, not token
  files, so token definitions are exempt by design.

### For: the UI scales from one root knob and respects user zoom

- `:root { font-size: 62.5% }` with `body { font-size: 1.6rem }`, then `rem`
  everywhere. Ladders up by giving easy px-to-rem math while keeping the root relative
  so zoom still works. Tradeoffs: third-party CSS assuming `1rem = 16px` renders ~37%
  small, and rem inside a media query resolves against the initial 16px, not the 62.5%
  override (`48rem` is 768px there).
- `clamp(rem-floor, rem + vw, rem-cap)` for fluid type and space, always with a `rem`
  term. Ladders up by replacing breakpoint stacks while staying zoom-responsive.
  Tradeoffs: a `vw`-only cap can fail WCAG 1.4.4; keep the cap generous and use
  `max(rem, vw)` for zoom-safe minimums.

### For: layouts are responsive, mobile-first

- `min-width` media queries in `rem`, breaking where the content breaks rather than at
  device names. Ladders up by reflowing layout in step with enlarged text.
- Container queries (`container-type: inline-size` plus `@container`) for reusable
  components. Ladders up by letting a card adapt to its slot, not the screen. Tradeoffs:
  Baseline widely available as of 2025, so safe for evergreen targets.
- `dvh`/`svh` instead of `100vh` for full-height sections. Ladders up by accounting for
  mobile browser toolbars. Tradeoffs: `dvh` can resize content during scroll.
- Logical properties (`padding-inline`, `margin-block`, `inset-*`). Ladders up by
  serving LTR, RTL, and vertical writing with one rule.

### For: specificity is predictable without escalation

- `@layer reset, base, tokens, components, utilities` declared once up front. Ladders
  up by making layer order the precedence contract instead of selector weight.
- `:where(...)` for zero-specificity base styles. Ladders up by letting component and
  utility layers override base without a specificity fight.

### For: CSS passes review and the verify gate the first time

- Write `var(--ds-*)` exclusively in component CSS and run `pnpm design-system:verify`
  before committing. Ladders up by catching gate failures locally.
- `:focus-visible` rings sourced from tokens, motion gated behind
  `@media (prefers-reduced-motion: reduce)`, and WCAG 1.4.3 contrast (4.5:1 body text,
  3:1 large text and non-text). Ladders up by making accessibility part of the same
  pass, not a later audit.

## References

- `references/rem-and-sizing.md`: the rem strategy, the 62.5% versus 10px verdict, unit
  selection, the px-to-rem table, and fluid type with `clamp()`. Read when choosing
  units.
- `references/responsive-mobile-first.md`: mobile-first method, rem breakpoints,
  container queries, viewport units, logical properties. Read when building layout.
- `references/layers-and-separation.md`: `@layer` ordering and separating presentation
  from behavior for swappable designs and themes. Read when structuring a stylesheet.
- `references/theming-with-tokens.md`: the `--ds-*` tokens, `data-theme` overrides,
  `color-mix`, and how to pass CHECK B. Read when theming or fixing a gate failure.
- `references/modern-css-toolkit.md`: `:has`, container queries, nesting, `color-mix`,
  `light-dark`, logical properties, and accessibility media queries, with 2026 support
  notes. Read when reaching for a modern feature.
- External: MDN CSS reference (https://developer.mozilla.org/en-US/docs/Web/CSS),
  web.dev, and WCAG 2.2 Understanding docs (cited inline in the references).

## Continual improvement

File drift, gaps, or corrections against this repository at
https://github.com/syntropic137/cross-framework-ui-design-system (open an issue or
capture a bead with `br create`). The CSS platform moves: when a feature's Baseline
status changes, update `references/modern-css-toolkit.md` and the dated section above,
leaving the Outcomes intact.
