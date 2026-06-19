# Cascade layers & clean separation

What this covers: cascade-layer ordering and precedence, separating presentation from
behavior, and designing swappable designs and themes. Read this when structuring a
stylesheet.

This repo already uses cascade layers (`base.css` declares `@layer reset, base;`,
the tokens file is `@layer tokens`, every component CSS is `@layer components`).
This file explains the model and how it delivers swappability.

## What cascade layers buy you

`@layer` lets you control the cascade by **layer order**, decoupled from selector
specificity. Rules in a **later** layer beat rules in an **earlier** layer *even if the
earlier rule has higher specificity*. That kills two chronic problems:

- **Specificity wars** - no more `.a .b .c#id` escalation to win an override.
- **`!important`** - almost never needed; the layer order is the override contract.

## Canonical layer order for this design system

Declare the order once, early (before the layers are populated):

```css
@layer reset, base, tokens, components, utilities;
```

| Layer | Holds | Wins over |
|-------|-------|-----------|
| `reset` | box-sizing, margin zeroing, normalize | (lowest) |
| `base`  | element defaults (body, links, `:focus-visible`), the `62.5%` root | reset |
| `tokens`| `--ds-*` custom property definitions, `[data-theme]` overrides | base |
| `components` | component classes (`.btn`, `.card`, `.modal`) consuming tokens | tokens |
| `utilities` | tiny single-purpose helpers, last-resort overrides | components |

> Note: custom properties (`--ds-*`) are **not** subject to layer precedence the way normal
> declarations are - `var()` resolution uses the standard cascade for the property value at
> use-site. Putting tokens in their own layer keeps them organized and lets component rules
> override token-set properties cleanly. In practice: define tokens in `tokens`, *consume* them
> in `components`.

Third-party / generated CSS you don't control can go in its own earliest layer so your
authored layers always win:

```css
@import "vendor.css" layer(vendor);  /* vendor sits below everything you write */
```

## Separating the UI layer from the behavior layer

The presentation layer (CSS) and the behavior layer (JS/React/Svelte) must stay decoupled.
This is the same structural principle the monorepo is built on (swap React ↔ Svelte without
touching app code).

Concretely:

- **Behavior owns state; CSS owns appearance.** JS toggles a class or a `data-*`/ARIA
  attribute; CSS reacts to it. JS does not set inline styles for visual state.

  ```css
  /* behavior sets aria-pressed / data-state; CSS expresses the look */
  .toggle[aria-pressed="true"] { background: var(--ds-color-accent); }
  .accordion[data-state="open"] .accordion__panel { display: block; }
  ```

- **Style state via semantic attributes**, not bespoke classes where an ARIA/`data` attribute
  already encodes the state. This keeps a11y and styling in sync (`:disabled`, `[aria-expanded]`,
  `[data-theme]`, `:focus-visible`).

- **No styling logic in JS.** No CSS-in-JS, no computed style objects. The component's look is
  fully described by its stylesheet + tokens, which is what makes it portable.

## Designing for swappability

Two independent swaps must both be possible **without editing consumers**:

1. **Theme swap** - change `[data-theme]`; only token values change (see
   `references/theming-with-tokens.md`). Components are untouched because they only read tokens.

2. **Design swap** - a different design package (`designs/<design>/<framework>`) ships a
   different `components` stylesheet for the *same* markup/contract. Because components live in
   the `components` layer keyed off the same token contract and the same class/attribute hooks,
   the structural markup doesn't change - only the stylesheet does.

Rules that preserve both:

- Components read the **token contract** (`--ds-*`); they never hardcode values and never
  redefine the theme.
- Components hook onto **stable class names and semantic attributes**, so any design can target them.
- Keep component CSS **flat and layer-scoped** (`@layer components { ... }`) - low specificity,
  no deep descendant chains - so an alternate design can override cleanly via layer order.
- No cross-component coupling: a component styles only its own elements. Layout/spacing
  *between* components belongs to the parent/layout, not the child.

## Practical pattern (matches the repo)

```css
/* button.css */
@layer components {
  .btn {
    /* layout + appearance, all from tokens, all rem-friendly */
    display: inline-flex;
    align-items: center;
    gap: 0.5em;
    padding: 0.8rem 1.6rem;
    border-radius: var(--ds-radius-md);
    border: 1px solid var(--ds-color-border);
    background: var(--ds-color-surface);
    color: var(--ds-color-fg);
  }
  .btn--primary {
    background: var(--ds-color-accent);
    color: var(--ds-color-accent-contrast);
  }
  .btn:disabled { cursor: not-allowed; opacity: 0.6; }  /* state via the real attribute */
}
```

A different design swaps this file; a different theme swaps the tokens it reads. Consumers
that render `<button class="btn btn--primary">` change nothing in either case.
