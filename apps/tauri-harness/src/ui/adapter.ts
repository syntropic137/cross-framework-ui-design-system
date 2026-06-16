// DESIGN SWAP POINT
// To swap designs at build time, set the VITE_UI_DESIGN env var:
//   VITE_UI_DESIGN=brutalist pnpm --filter tauri-harness build
//
// The canonical swap is just changing one package specifier or env var —
// the adapter contract guarantees both designs are structurally identical.
// Both adapters satisfy RequiredComponentAdapter, so TypeScript enforces the swap.
import type { RequiredComponentContracts } from "@design-system/contracts";
import { reactV18ContractAdapter as defaultAdapter } from "@design-system/default-react-v18";
import { reactV18ContractAdapter as brutalistAdapter } from "@design-system/brutalist-react-v18";

const design = (import.meta.env.VITE_UI_DESIGN ?? "default") as
  | "default"
  | "brutalist";

export const activeDesign: "default" | "brutalist" = design;

export const ui = (
  design === "brutalist" ? brutalistAdapter : defaultAdapter
) satisfies Record<keyof RequiredComponentContracts, unknown>;
