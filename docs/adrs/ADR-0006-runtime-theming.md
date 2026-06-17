# ADR-0006: Runtime theming via design tokens

- Status: Accepted
- Date: 2026-06-16
- Related: ADR-0002 (token generation), ADR-0005 (enforcement gate)

## Context

The system must support multiple visual themes (light, dark, and beyond) and let
an app switch between them **at runtime** — a settings toggle, OS preference, etc.
Two anti-patterns to avoid: (1) baking theme values into components (every color
change becomes a component edit), and (2) shipping a separate stylesheet per theme
(swapping requires re-loading CSS and components can't be theme-agnostic).

ADR-0002 already establishes that tokens are TypeScript-first and generated into
CSS. This ADR decides *how themes are expressed and switched*.

## Decision

Themes are **alternate values for the same `--ds-*` custom properties**, selected
by a `data-theme` attribute on the document root:

- The generated `design-tokens.css` puts the default (light) theme in `:root` and
  each additional theme in a `[data-theme="<name>"]` override block, all inside
  `@layer tokens`. Current themes: `light` (default), `dark`, `rose`, `serif`.
- A theme override only restates the tokens it changes; everything else inherits
  from `:root`.
- Themes are defined in **one** source (`packages/design-tokens/src/token-data.ts`,
  `themeDefinitions`) and generated deterministically to both CSS (browsers) and
  JSON (tooling), so the two never drift.
- Switching themes at runtime is a single DOM write:
  `document.documentElement.setAttribute("data-theme", name)`. No rebuild, no
  re-import, no component change.
- Derived shades use `color-mix(in oklab, var(--ds-color-x), var(--ds-color-fg)
  NN%)` so one hue change cascades correctly across light and dark.

Components consume `var(--ds-*)` exclusively (enforced by ADR-0005 CHECK B), which
is precisely what makes them theme-agnostic: they render whatever the active theme
resolves the variables to.

## Consequences

- **Positive:** theming is fully decoupled from components and from the *design*
  axis (ADR-0004) — design (default/brutalist) and theme (light/dark) vary
  independently. A new theme is a token-source edit + regenerate, never a
  component touch.
- **Positive:** runtime switching is instant and SSR-safe (attribute can be set
  before paint); the reference apps persist the choice in `localStorage`.
- **Cost:** every themeable value must be a token. A component that needs a new
  color must add a token first (which the enforcement gate requires anyway).
- The cookbook documents the consumer-facing recipe:
  [`docs/cookbook/theming.md`](../cookbook/theming.md).
