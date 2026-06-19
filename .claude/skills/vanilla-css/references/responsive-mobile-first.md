# Mobile-first, responsive-always

What this covers: the mobile-first method, rem breakpoints, intrinsic and
container-driven layout, viewport units, logical properties, and a responsive
checklist. Read this when building layout.

CLAUDE.md and the repo owner: the UI must be **responsive by default**. Start from the
smallest screen and enhance up. This is non-negotiable for new CSS.

## Why mobile-first (min-width), not desktop-first (max-width)

- **Progressive enhancement.** Base styles are the simplest, smallest-screen layout that
  works everywhere. Each `min-width` query *adds* capability as space appears.
- **Less code, fewer overrides.** Desktop-first means writing the complex layout, then
  unwinding it with `max-width` queries - more rules, more conflicts.
- **Performance on constrained devices.** The cheapest layout is the default; phones don't
  parse desktop rules they then have to undo.

```css
/* base: mobile - single column */
.layout {
  display: grid;
  gap: 1.6rem;
  grid-template-columns: 1fr;
}

/* enhance up */
@media (min-width: 48rem) {  /* ~768px */
  .layout { grid-template-columns: 20rem 1fr; }
}
@media (min-width: 80rem) {  /* ~1280px */
  .layout { grid-template-columns: 24rem 1fr 28rem; }
}
```

**Anti-pattern:** leading with `@media (max-width: ...)`. Reject in review.

## Breakpoint strategy

- Author breakpoints in **rem** so they respect the root font-size knob.
- Don't invent a breakpoint per device. Add one only where the *content* breaks. Common rem anchors:

| Name | rem | ~px | Typical use |
|------|-----|-----|-------------|
| sm   | 30rem | 480 | large phone / small layout shift |
| md   | 48rem | 768 | tablet / sidebar appears |
| lg   | 64rem | 1024 | desktop |
| xl   | 80rem | 1280 | wide desktop / third column |

- Prefer **intrinsic responsiveness** (below) so you need *fewer* breakpoints at all.

## Intrinsic / container-driven layout (prefer this first)

Often you don't need a media query - let the layout respond to its own content/space.

```css
/* auto-fit grid: as many columns as fit, each ≥ 24rem, no media queries */
.cards {
  display: grid;
  gap: 1.6rem;
  grid-template-columns: repeat(auto-fit, minmax(24rem, 1fr));
}

/* flex that wraps and grows */
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
}
```

## Container queries - component-level responsiveness

A component should respond to the space **it** is given, not the viewport. That's what
makes a component truly swappable/portable across layouts.

```css
.card-wrap {
  container-type: inline-size;
  container-name: card;
}

/* base: stacked */
.card { display: grid; gap: 1.2rem; }

/* when the CARD (not the page) is ≥ 40rem wide, go side-by-side */
@container card (min-width: 40rem) {
  .card { grid-template-columns: 12rem 1fr; }
}
```

Use viewport media queries for page-level structure; container queries for component internals.

## Logical properties - direction-agnostic by default

Use logical (flow-relative) properties so layouts work in LTR, RTL, and vertical writing modes
without rewrites:

| Physical | Logical |
|----------|---------|
| `padding-left` / `padding-right` | `padding-inline-start` / `padding-inline-end` (or `padding-inline`) |
| `margin-top` / `margin-bottom` | `margin-block-start` / `margin-block-end` (or `margin-block`) |
| `width` / `height` | `inline-size` / `block-size` |
| `max-width` | `max-inline-size` |
| `text-align: left` | `text-align: start` |
| `top/right/bottom/left` | `inset-block-*` / `inset-inline-*` (or `inset`) |

```css
.panel {
  padding-inline: 1.6rem;
  padding-block: 2.4rem;
  max-inline-size: 64rem;
  margin-inline: auto;   /* center within available inline space */
}
```

## Grid vs flex - quick guidance

- **Grid** for two-dimensional layout (rows *and* columns), page scaffolds, card galleries,
  and any "place items into defined tracks" problem. `minmax()` + `auto-fit`/`auto-fill` give
  responsive grids with no media queries.
- **Flex** for one-dimensional flow (a row of buttons, a wrapping tag list, distributing space
  along a single axis). `flex-wrap: wrap` + `gap` is the responsive toolbar pattern.
- Always use `gap` for spacing between flex/grid children - never margins on the children.

## Responsive checklist

- [ ] No horizontal scroll at 320px wide.
- [ ] Base styles = smallest screen; all media queries are `min-width`, in rem.
- [ ] Tried intrinsic layout (`auto-fit`/`minmax`, flex-wrap) before reaching for a breakpoint.
- [ ] Component internals use container queries, not viewport queries.
- [ ] Logical properties throughout; no hardcoded `left`/`right` for layout.
- [ ] Touch targets are at least ~4.4rem (44px) for interactive elements.
- [ ] Fluid type (`clamp`) for headings/hero where stepping is unnecessary.
- [ ] Tested at narrow, mid, and wide; tested with browser zoom at 200%.
