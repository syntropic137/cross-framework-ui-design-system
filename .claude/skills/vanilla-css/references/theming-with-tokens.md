# Theming with tokens (and passing the verify gate)

What this covers: how this design system themes with `--ds-*` custom properties and
`data-theme` overrides, deriving shades with `color-mix`, and exactly what the
`design-system:verify` token gate (CHECK B) flags. Read this when theming a component
or fixing a gate failure.

## The token contract

Components never hold raw values. They read design tokens (CSS custom properties named
`--ds-*`): `--ds-color-bg`, `--ds-color-fg`, `--ds-color-accent`,
`--ds-color-accent-contrast`, `--ds-color-surface`, `--ds-color-border`,
`--ds-radius-*`, `--ds-space-*`, shadow and motion tokens, and so on. The token values
live in `@syntropic137/design-tokens` and are generated into CSS; component CSS only
consumes them.

```css
@layer components {
  .btn--primary {
    background: var(--ds-color-accent);
    color: var(--ds-color-accent-contrast);
  }
}
```

## Theme swapping via data-theme

A theme is a set of token values, not a component variant. The generated tokens CSS
puts the default (light) values in `:root` and each additional theme in a
`[data-theme="..."]` block, all inside `@layer tokens`.

```css
@layer tokens {
  :root              { --ds-color-bg: ...; --ds-color-fg: ...; }
  [data-theme="dark"]  { --ds-color-bg: ...; --ds-color-fg: ...; }
}
```

Switching themes at runtime is one DOM write,
`document.documentElement.setAttribute("data-theme", name)`, after which every
`var(--ds-color-*)` re-resolves. Components are never edited to change theme. Add a new
theme by editing the token source and regenerating, not by touching components.

## Deriving shades with color-mix

Derive hover, border, and tint shades from tokens so they track theme changes, instead
of hardcoding a second color:

```css
border-color: color-mix(in oklab, var(--ds-color-accent), var(--ds-color-fg) 12%);
```

`color-mix()` is Baseline widely available (since 2023). Mixing `in oklab` is
perceptually uniform, so a 12% mix looks even across hues; this is the repo's
convention. For a light/dark pair where you do not need named themes, `light-dark()`
is an option, but it is Baseline newly available (2024) and requires
`color-scheme: light dark` on the element, so prefer `data-theme` token overrides for
the multi-theme system here.

## Passing the verify gate (CHECK B)

`pnpm design-system:verify` scans design and component CSS for hardcoded colors and
fails the build on any. To pass, component CSS must not contain:

- hex colors (`#fff`, `#0b0c0e`)
- `rgb(...)`, `rgba(...)`, `hsl(...)`, `hsla(...)` with literal numbers
- named CSS colors used as values (`white`, `black`, `red`, `gray`, `blue`, ...)

Allowed: `var(--ds-color-*)`, `color-mix(in oklab, var(--ds-...), ...)`, and the
keywords `transparent`, `currentColor`, `inherit`, `initial`, `unset`, `revert`,
`none`, `auto`.

What is exempt: the gate does not scan the generated token files under
`packages/design-tokens/generated/`, because that is where literal colors legitimately
live (they are the definitions). Decorative files (for example confetti) are
allowlisted as a documented exception. If you write a literal color in a component
stylesheet, the fix is to add or use a token, not to add an exemption.

```css
/* fails CHECK B */            /* passes CHECK B */
.badge { color: #16a34a; }     .badge { color: var(--ds-color-success); }
```

## Sources

The repo's `scripts/verify-design-system.mjs` (CHECK B token discipline) and
`packages/design-tokens/generated/`; MDN `color-mix()`
(https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix) and
`light-dark()`
(https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark).
