# ADR-0004: Design-first matrix layout (design × framework)

**Status:** Accepted
**Date:** 2026-06-16
**Related:** ADR-0001 (monorepo foundation), `rcl-q64.11` (restructure), `rcl-q64.5` (swap demo), `rcl-0fp` (framework-neutral naming)

## Context

The design system targets multiple frameworks (React 18, Svelte 5, later Vue) behind one
framework-neutral contract (`@syntropic137/contracts`). We need to support **multiple visual
designs** (e.g. a `default` design, a `shadcn`-style design, a `brutalist` design), where:

- A **design** is a coherent look/behavior that can span several frameworks.
- The intended swap is **within a single framework + version**: replace one design's
  implementation with another design's implementation of the *same* contract. Both are the same
  framework, so the swap is type-safe and a true runtime swap (one import specifier changes).
- Swapping **across** frameworks (React ↔ Svelte) at runtime is explicitly a non-goal; the
  framework+version is the fixed "lane" you build the app in.

The original layout was framework-first (`packages/component-libraries/<framework>`), which has no
home for a design that spans frameworks and scatters a design's cross-framework implementations.

## Decision

Adopt a **design-first matrix** layout. The unit is a cell = (design × framework+version):

```
packages/
  contracts/                 # global, framework-neutral API (unchanged)
  design-tokens/             # global base tokens (unchanged)
  dev-tools/                 # generator, dashboard (unchanged)
designs/
  default/
    react-v18/               # @syntropic137/default-react-v18
    svelte-v5/               # @syntropic137/default-svelte-v5
  <design>/                  # future: shadcn/, brutalist/, ...
    <framework>/             # one cell per framework the design supports
```

- **Package naming:** `@syntropic137/<design>-<framework>` (e.g. `default-react-v18`).
- **Export names are stable per cell** — every React-18 cell exports `reactV18ContractAdapter`,
  every Svelte-5 cell exports `svelteV5ContractAdapter`. Consequence: **a design swap changes only
  the import specifier**, not the binding:
  ```ts
  import { reactV18ContractAdapter } from "@syntropic137/default-react-v18";
  // swap design (same framework): change the package only
  import { reactV18ContractAdapter } from "@syntropic137/shadcn-react-v18";
  ```
- A design's cross-framework **shared theme** (token/value layer) may later live at
  `designs/<design>/theme/`; deferred until a second design needs it.

## Consequences

- **Positive:** matches the mental model (a design spans frameworks, co-located); adding a design or
  adding a framework to a design is a new folder, not a rename; within-lane swap is a one-specifier
  change; contract + base tokens stay the single neutral spine.
- **Cost:** each cell still carries its own framework tooling (vite / svelte-package / storybook) —
  inherent and acceptable; cells are small.
- **Migration:** today's `packages/component-libraries/{react-v18,svelte-v5}` move to
  `designs/default/*` and are renamed `@syntropic137/default-*`. All package-name and path
  references update; export names are preserved. Done while only two cells exist (cheapest time).
- The dashboard TUI's "install contracts" will grow a **design** dimension (currently framework-only)
  as a follow-up.
