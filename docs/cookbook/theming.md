# Recipe: Theming (light/dark and beyond)

Theming is a **different axis** from design. A *design* (default/brutalist) is the
component look-and-feel; a *theme* (light/dark/rose/serif) is a set of token
*values*. Themes are decoupled from components entirely: you never edit a
component to change colors. You flip one attribute and every `var(--ds-color-*)`
re-resolves.

## How it works

`@syntropic137/design-tokens` generates CSS where `:root` holds the default
(light) theme and each additional theme is a `[data-theme="…"]` override block:

```css
@layer tokens {
  :root            { --ds-color-bg: #fff; --ds-color-fg: #111; /* … */ }
  [data-theme="dark"]  { --ds-color-bg: #111; --ds-color-fg: #eee; /* … */ }
  [data-theme="rose"]  { /* brand-hue overrides */ }
  [data-theme="serif"] { /* typography overrides */ }
}
```

So theming at runtime is just:

```js
document.documentElement.setAttribute("data-theme", "dark");
```

No rebuild, no re-import, no component change. (Make sure the tokens CSS is
imported once — see the [Tauri recipe](./integrate-tauri.md) step 3.)

## A runtime toggle (Svelte 5)

This is the pattern from `apps/tauri-harness-svelte/src/App.svelte`: persist the
choice, apply it via an effect.

```svelte
<script lang="ts">
  type Theme = "light" | "dark";

  const stored =
    typeof localStorage !== "undefined" ? localStorage.getItem("ds-theme") : null;
  let theme = $state<Theme>(stored === "dark" ? "dark" : "light");

  $effect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("ds-theme", theme);
    } catch {
      /* localStorage unavailable — ignore */
    }
  });
</script>

<button onclick={() => (theme = theme === "light" ? "dark" : "light")}>
  {theme === "light" ? "🌙 Dark" : "☀️ Light"}
</button>
```

Style your own chrome from the same tokens so it transitions with the theme:

```css
:global(body) {
  background: var(--ds-color-bg);
  color: var(--ds-color-fg);
  transition:
    background var(--ds-duration-base, 200ms) var(--ds-ease, ease),
    color var(--ds-duration-base, 200ms) var(--ds-ease, ease);
}
```

## The React delta

Identical idea; use `ThemeProvider` from `@syntropic137/default-react-v18` (an
implementation extra) or set the attribute yourself in an effect:

```tsx
useEffect(() => {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("ds-theme", theme);
}, [theme]);
```

## Adding a new theme

Themes are TypeScript-first — you don't hand-write CSS. Edit the single source
and regenerate:

1. Add a theme entry in `packages/design-tokens/src/token-data.ts`
   (`themeDefinitions` — a selector like `[data-theme="midnight"]` plus the token
   values it overrides). You only override what changes; everything else inherits
   from `:root`.
2. Regenerate: `pnpm --filter @syntropic137/design-tokens tokens:build`.
3. Use it: `document.documentElement.setAttribute("data-theme", "midnight")`.

Because generation is deterministic from one source file, every consumer (CSS for
browsers, JSON for tooling) stays in sync. Derived shades use
`color-mix(in oklab, var(--ds-color-x), var(--ds-color-fg) NN%)` so a single hue
change cascades correctly across light and dark.

That's the whole theming model: **tokens are the contract, `data-theme` is the
switch, components are untouched.**
