# Recipe: Swap designs

A **design** is a complete look-and-behavior (e.g. `default`, `brutalist`). Within
one framework, swapping designs is the headline feature of this system: because
every cell of a framework exports the **same adapter name** and satisfies the
**same contract**, the swap is a one-line change that TypeScript verifies.

> Scope: the swap is **within a single framework+version** (default-svelte-v5 ↔
> brutalist-svelte-v5). Swapping React ↔ Svelte at runtime is a non-goal — the
> framework is the fixed "lane" you build in. See
> [ADR-0004](../adrs/ADR-0004-design-first-matrix.md).

## Option A — static swap (change one import)

If you built the adapter module from the [Tauri recipe](./integrate-tauri.md),
swapping the design is changing the package specifier and the stylesheet — the
binding name (`ui`, `svelteV5ContractAdapter`) does not change:

```diff
// src/ui/adapter.ts
- import { svelteV5ContractAdapter as ui } from "@syntropic137/default-svelte-v5";
- import "@syntropic137/default-svelte-v5/styles.css";
+ import { svelteV5ContractAdapter as ui } from "@syntropic137/brutalist-svelte-v5";
+ import "@syntropic137/brutalist-svelte-v5/styles.css";
```

Nothing else in your app changes. If `brutalist-svelte-v5` were missing a required
component, `pnpm typecheck` would fail at this line — the contract guarantees the
two adapters are structurally interchangeable.

## Option B — build-time switch (env var)

To build the *same* app under different designs without editing source, import
both cells and pick one from an env var. This is what the reference apps do:

```ts
// src/ui/adapter.ts
import type { RequiredComponentContracts } from "@syntropic137/contracts";
import { svelteV5ContractAdapter as defaultAdapter } from "@syntropic137/default-svelte-v5";
import { svelteV5ContractAdapter as brutalistAdapter } from "@syntropic137/brutalist-svelte-v5";

// Both cells' styles are imported; classes are namespaced (brutalist uses
// `brutal-*`), so they coexist and only the rendered design picks up styling.
import "@syntropic137/default-svelte-v5/styles.css";
import "@syntropic137/brutalist-svelte-v5/styles.css";
import "@syntropic137/design-tokens/generated/design-tokens.css";

const design = (import.meta.env.VITE_UI_DESIGN ?? "default") as
  | "default"
  | "brutalist";

export const activeDesign = design;
export const ui = (
  design === "brutalist" ? brutalistAdapter : defaultAdapter
) satisfies Record<keyof RequiredComponentContracts, unknown>;
```

Build either design:

```bash
pnpm build                                # default
VITE_UI_DESIGN=brutalist pnpm build       # brutalist
```

## Why this works (and what guarantees it)

- **Stable export names per framework** — every `*-svelte-v5` cell exports
  `svelteV5ContractAdapter`; every `*-react-v18` cell exports
  `reactV18ContractAdapter`.
- **One neutral contract** — both adapters
  `satisfies Record<keyof RequiredComponentContracts, …>`, so a missing or
  mistyped component is a compile error, not a runtime surprise.
- **Tokens are shared, styles are namespaced** — designs layer their own CSS on
  the same `--ds-*` foundation without colliding.

The enforcement gate (`pnpm design-system:verify`) checks that every cell ships
the required adapter and conforms to the contract, so a swap can never silently
half-work. See [theming.md](./theming.md) to change *color/theme* (a different
axis from *design*).
