# Recipe: Integrate into a Tauri app

Goal: render design-system components inside a [Tauri](https://tauri.app) v2 app,
with tokens and theming wired up. We show the **Svelte** path first (the
reference app is `apps/tauri-harness-svelte`), then the **React** delta.

There are exactly two non-obvious things that will bite you — both are called out
inline as **⚠️ Gotcha**.

## 1. Create the app

A Tauri app is just a web frontend Tauri embeds in a native webview. Scaffold the
frontend however you like (here: Vite + Svelte 5), then add Tauri:

```bash
pnpm create vite@latest my-app -- --template svelte-ts
cd my-app
pnpm add -D @tauri-apps/cli
pnpm tauri init        # answers: dist dir = ../dist, dev url = http://localhost:1420
```

Add the design-system packages:

```bash
pnpm add @design-system/contracts \
         @design-system/design-tokens \
         @design-system/default-svelte-v5
```

## 2. Configure Vite

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [svelte()],
  // ⚠️ Gotcha #1 — Svelte browser condition.
  // Without this, Vite resolves Svelte's SSR build, your components bundle in
  // server mode, and `mount()` throws "lifecycle_function_unavailable
  // (not available on the server)" → a blank white window in the Tauri webview.
  // EVERY Svelte *app* needs this. (The Svelte design cells in this repo set it in
  // their own vite config too, so don't assume a dependency already handled it.)
  resolve: { conditions: ["browser"] },
  clearScreen: false,
  server: { port: 1420, strictPort: true },
});
```

> Debugging a blank Tauri window: load the built `dist/` in headless Playwright
> and read `pageerror` — that's how the SSR-mount error above was first caught.

## 3. Create a UI adapter module (your one swap point)

Centralize the design choice in a single file. This is the seam that makes design
swaps a one-line change (see [swap-designs.md](./swap-designs.md)).

```ts
// src/ui/adapter.ts
import type { RequiredComponentContracts } from "@design-system/contracts";
import { svelteV5ContractAdapter as defaultAdapter } from "@design-system/default-svelte-v5";

// ⚠️ Gotcha #2 — component CSS is NOT auto-injected.
// In Vite library mode the JS bundle and the CSS are separate files; importing
// the adapter does not pull in styles. Import the cell's stylesheet explicitly.
import "@design-system/default-svelte-v5/styles.css";

// The shared token foundation (the --ds-* variables + every theme).
import "@design-system/design-tokens/generated/design-tokens.css";

export const ui = defaultAdapter satisfies Record<
  keyof RequiredComponentContracts,
  unknown
>;
```

## 4. Render components

The adapter exposes each component under its contract key (`ui.button`,
`ui.badge`, `ui.toggle`). In Svelte, assign to capitalized locals so you can use
element syntax:

```svelte
<!-- src/App.svelte -->
<script lang="ts">
  import type { Component } from "svelte";
  import type { ButtonContract } from "@design-system/contracts";
  import { ui } from "./ui/adapter.js";

  const Button = ui.button as Component<ButtonContract & { children?: any }>;
</script>

<main>
  <Button variant="primary">Primary</Button>
  <Button variant="danger">Danger</Button>
</main>

<style>
  /* Tokens flow straight into your own CSS too. */
  :global(body) {
    background: var(--ds-color-bg);
    color: var(--ds-color-fg);
  }
</style>
```

Run it: `pnpm tauri dev`. You should see styled, themeable components in the
native window.

## 5. Build the bundle

```bash
pnpm tauri build
```

Two Tauri build notes the reference app already encodes (see
`apps/tauri-harness-svelte/src-tauri/tauri.conf.json`):

- **Set a unique bundle identifier.** Tauri rejects the default `com.tauri.dev`.
- **`bundle.targets: ["app"]`** to produce just the runnable `.app` and skip the
  DMG step (`bundle_dmg.sh`), which fails on many local machines.

## The React delta

Everything above holds, with three substitutions:

| Svelte | React |
| --- | --- |
| `@design-system/default-svelte-v5` | `@design-system/default-react-v18` |
| `svelteV5ContractAdapter` | `reactV18ContractAdapter` |
| `resolve.conditions: ["browser"]` | not needed (Gotcha #1 is Svelte-only) |

Gotcha #2 (import `…/styles.css` explicitly) and the Tauri bundle notes are
identical. The reference React app is `apps/tauri-harness`.

```ts
// src/ui/adapter.ts (React)
import { reactV18ContractAdapter as ui } from "@design-system/default-react-v18";
import "@design-system/default-react-v18/styles.css";
import "@design-system/design-tokens/generated/design-tokens.css";
export { ui };
```

Next: [swap the design](./swap-designs.md) or [add theming](./theming.md).
