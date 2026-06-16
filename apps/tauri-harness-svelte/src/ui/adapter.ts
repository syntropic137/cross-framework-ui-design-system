// DESIGN SWAP POINT
// To swap designs at build time, set the VITE_UI_DESIGN env var:
//   VITE_UI_DESIGN=brutalist pnpm --filter tauri-harness-svelte build
//
// The canonical swap is just changing one package specifier or env var —
// the adapter contract guarantees both designs are structurally identical.
// Both adapters satisfy RequiredComponentAdapter, so TypeScript enforces the swap.
import type { RequiredComponentContracts } from "@design-system/contracts";
import { svelteV5ContractAdapter as defaultAdapter } from "@design-system/default-svelte-v5";
import { svelteV5ContractAdapter as brutalistAdapter } from "@design-system/brutalist-svelte-v5";

// Each design's component styles. vite lib mode emits CSS to a separate dist file
// the JS bundle does NOT auto-inject, so consumers must import it. Both are
// class-namespaced (brutalist uses `brutal-*`), so they coexist without collision
// and only the active design's rendered elements pick up styling.
import "@design-system/default-svelte-v5/styles.css";
import "@design-system/brutalist-svelte-v5/styles.css";

// Design tokens CSS — shared foundation consumed by both designs
import "@design-system/design-tokens/generated/design-tokens.css";

const design = (import.meta.env.VITE_UI_DESIGN ?? "default") as
  | "default"
  | "brutalist";

export const activeDesign: "default" | "brutalist" = design;

export const ui = (
  design === "brutalist" ? brutalistAdapter : defaultAdapter
) satisfies Record<keyof RequiredComponentContracts, unknown>;
