# Cookbook

Task-oriented recipes for using the design system in a real app. Each recipe is
self-contained and copy-pasteable. If you read nothing else, read **Quick start**
below, then jump to the recipe you need.

## The mental model (60 seconds)

The system is a **design × framework matrix**. Three layers:

1. **`@syntropic137/contracts`** — a framework-neutral API. It says *what* a
   `Button` or `Badge` accepts (props, variants), not *how* it looks or which
   framework renders it.
2. **`@syntropic137/design-tokens`** — the visual foundation as CSS custom
   properties (`--ds-color-*`, `--ds-radius-*`, …). Themes (light/dark/…) are
   just different values for the same variables, swapped at runtime via a
   `data-theme` attribute.
3. **Design cells** — `@syntropic137/<design>-<framework>` (e.g.
   `default-svelte-v5`, `brutalist-react-v18`). Each cell *implements* the
   contracts for one design in one framework, and exports a stable
   **contract adapter** (`svelteV5ContractAdapter` / `reactV18ContractAdapter`).

Because every cell of the same framework exports the **same adapter name** and
satisfies the **same contract**, swapping the look of your app is a one-line
import change — TypeScript proves the two designs are interchangeable.

```
contracts  (what)  ─┐
design-tokens (look)─┼─►  design cell  ─►  your app
framework  (how)   ─┘     (default/brutalist × react/svelte)
```

## Quick start

```bash
# 1. Add the layers you need (inside a workspace; for external apps see
#    docs/distribution.md for the published-package story).
pnpm add @syntropic137/contracts \
         @syntropic137/design-tokens \
         @syntropic137/default-svelte-v5   # pick your cell

# 2. Import the foundation once, near your app root:
#    - tokens CSS (the --ds-* variables + themes)
#    - your chosen cell's component styles
import "@syntropic137/design-tokens/generated/design-tokens.css";
import "@syntropic137/default-svelte-v5/styles.css";

# 3. Use the adapter:
import { svelteV5ContractAdapter as ui } from "@syntropic137/default-svelte-v5";
```

## Recipes

| Recipe | What you'll do |
| --- | --- |
| [Integrate into a Tauri app](./integrate-tauri.md) | Wire a cell + tokens into a Tauri (Svelte or React) frontend, including the two gotchas that cost real debugging time. |
| [Swap designs](./swap-designs.md) | Change the entire look (default ↔ brutalist) by changing one import — and how to make it switchable at build time. |
| [Theming (light/dark and beyond)](./theming.md) | Add a runtime theme toggle driven entirely by design tokens, no component edits. |

## See also

- [`docs/component-standard.md`](../component-standard.md) — the canonical contract surface and how a component graduates from `planned` → `required`.
- [`docs/distribution.md`](../distribution.md) — how the packages are versioned and published (zero-dependency policy for contracts + tokens).
- [`docs/adrs/`](../adrs/) — the architecture decisions behind all of this.
