# rem and sizing, in depth

What this covers: the rem-at-root strategy, the 62.5% versus fixed-10px verdict,
choosing between rem/em/px/%, the px-to-rem table, and fluid type with `clamp()`.
Read this when deciding what units to use. Claims are cited to MDN, WCAG, and web.dev
(current to 2026).

## The rem-at-root strategy

A `rem` is relative to the root (`<html>`) font-size. The browser default is usually
16px, but the user can change it in browser settings. The 62.5% technique sets:

```css
:root { font-size: 62.5%; } /* 62.5% of 16px = 10px, so 1rem = 10px */
body  { font-size: 1.6rem; } /* restore readable body text to 16px */
```

Now px-to-rem math is "divide by 10" (`2.4rem` is 24px), and one knob, the root
font-size, scales every rem-based value together.

## The verdict: 62.5% versus a fixed 10px root

Both make `1rem = 10px`. The difference is accessibility.

| | `:root { font-size: 62.5% }` | `:root { font-size: 10px }` |
|---|---|---|
| `1rem` at user default | 10px, scales with the user's setting | 10px, always |
| Respects browser font-size preference | Yes | No, it overrides it |
| WCAG 1.4.4 Resize Text friendly | Yes | Fails the intent for text |
| 1rem=10px convenience | Yes | Yes |

MDN: "Absolute lengths can cause accessibility problems because they are fixed and do
not scale according to user settings. Prefer relative lengths (such as em or rem) when
setting font-size." A fixed-px root pins everything that inherits from it, so a user
who raised their default to 20px is ignored. A percentage root computes from their
base, so their preference still flows through.

Verdict: if you adopt the 1rem=10px convenience, it must be `62.5%`, never `10px`.

Honest tradeoffs of 62.5% (per the source research):
- Third-party CSS that assumes `1rem = 16px` renders about 37% small. Scope or wrap it.
- You must restore body text to `1.6rem`, or base text renders at 10px (its own
  regression).
- The "everything is times ten" mapping is a small ongoing cognitive cost.

The conservative alternative is to leave the root at the browser default and size in
rem anyway (accepting px math). Both are accessible; this design system uses the 62.5%
knob for the easy math.

## rem versus em versus px versus %

| Unit | Relative to | Use for | Avoid for |
|---|---|---|---|
| `rem` | root font-size (user-scalable) | type, spacing, radius, breakpoints, layout | hairlines |
| `em` | the element's own font-size | padding/icon sizing that tracks this component's text | global layout (it compounds) |
| `px` | absolute device pixel | hairline borders, shadow offsets, 1px rules | font-size, anything that must zoom |
| `%` | parent dimension (root for font-size) | fluid widths, the relative root | precise type scales |

- `em` compounds: children inherit the computed value, so nested `1.2em` font-sizes
  multiply. Keep `em` to component-local sizing.
- `px` for a 1px border or a shadow is correct; it is not text and should not scale.
- rem-based media queries are preferable to px so layout reflows in step with enlarged
  text. Sharp caveat: in a media-query context, `rem`/`em` resolve against the initial
  16px, not a 62.5% override, so `48rem` in a query is 768px, not 480px. Plan
  breakpoint numbers accordingly.

## px to rem reference (default 16px root)

| px | rem (16px root) | rem under 62.5% (1rem=10px) |
|---:|---:|---:|
| 1 | 0.0625rem | 0.1rem |
| 4 | 0.25rem | 0.4rem |
| 8 | 0.5rem | 0.8rem |
| 12 | 0.75rem | 1.2rem |
| 16 | 1rem | 1.6rem |
| 24 | 1.5rem | 2.4rem |
| 32 | 2rem | 3.2rem |
| 48 | 3rem | 4.8rem |
| 64 | 4rem | 6.4rem |

## Fluid type and space with clamp()

`clamp(MIN, PREFERRED, MAX)` returns the preferred value, floored and capped.

```css
h1 { font-size: clamp(1.5rem, 1rem + 4vw, 3rem); }
--space-fluid: clamp(1rem, 0.5rem + 2vw, 2rem);
```

- The `rem + vw` middle scales fluidly and replaces stacks of media queries; the floor
  keeps small screens legible, the cap stops absurd growth on large screens.
- Accessibility rule: always include a `rem` term in the preferred value so page zoom
  (which scales rem) still moves the size. A pure-`vw` value with a `vw` cap can fail
  WCAG 1.4.4 by preventing text from reaching 200%. For a zoom-safe minimum use the
  `max(rem, vw)` trick, for example `font-size: max(1rem, 2.5vw)`.
- Utopia (utopia.fyi) generalizes this into a fluid type and space scale between two
  viewport anchors.

## Sources

MDN CSS length (https://developer.mozilla.org/en-US/docs/Web/CSS/length); WCAG 2.2 SC
1.4.4 Resize Text (https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html); the
62.5% trick analysis
(https://www.aleksandrhovhannisyan.com/blog/62-5-percent-font-size-trick/); web.dev
min/max/clamp (https://web.dev/articles/min-max-clamp).
