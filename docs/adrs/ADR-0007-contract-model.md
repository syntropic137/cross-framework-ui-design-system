# ADR-0007: Framework-neutral contract model with per-cell adapters

- Status: Accepted
- Date: 2026-06-16
- Related: ADR-0004 (matrix), ADR-0005 (enforcement gate)

## Context

The system targets multiple frameworks (React 18, Svelte 5, later others) and
multiple designs, and its headline guarantee is that swapping a design is a
one-line change that the type system verifies (ADR-0004). For that to hold, there
must be a single definition of *what a component is* that is independent of any
framework — otherwise "Button" means something subtly different in each cell and
the swap is unsafe.

We modeled the API surface on **bits-ui** (the headless Svelte component library),
which already factors components into framework-light, prop/state contracts
(open/value/position/orientation, etc.) — a good neutral vocabulary to standardize
on.

## Decision

Split *contract* from *implementation*:

- **`@design-system/contracts`** is a framework-neutral, **zero-dependency**
  package defining each component's prop contract (`ButtonContract`,
  `BadgeContract`, …) plus shared union types (`shared.ts`: size, tone,
  orientation, side, align, open/value/position contracts). It contains no React
  or Svelte code. The full bits-ui surface (~41 components) exists here as contract
  files; `component-status.ts` marks each `required` | `planned` | `experimental`.
- **Each design×framework cell implements the contracts** and exports a stable
  adapter under a per-framework name: every `*-react-v18` cell exports
  `reactV18ContractAdapter`, every `*-svelte-v5` cell exports
  `svelteV5ContractAdapter`. Because the names are constant, a design swap changes
  only the import specifier (ADR-0004).
- **Conformance is compile-time.** Adapters use
  `satisfies RequiredComponentAdapter` / `AssertRequiredComponentProps<…>` so a
  missing or mistyped component is a type error. (Svelte cells annotate
  `: RequiredComponentAdapter` instead of `satisfies` to dodge a declaration-emit
  limitation, which widens value types to `unknown` — a known tradeoff tracked in
  `rcl-q64.13`.)
- **Graduation is explicit.** A component moves `planned → required` only by
  updating `componentContractStatus`, adding it to `RequiredComponentContracts`,
  implementing it in every supported cell, adding tests + stories, and passing
  `pnpm qa`. The process is documented in `docs/component-standard.md`.

Framework-native composition (React `children`/refs, Svelte snippets) is allowed
as **additive** props on top of the contract.

## Consequences

- **Positive:** the contract is the single source of truth; designs and frameworks
  are interchangeable behind it, and adding a framework is a new set of cells, not
  a contract change. The bits-ui modeling gives us a proven, complete target
  surface to grow into (roadmap waves filed as beads).
- **Positive:** "what's required vs aspirational" is data (`component-status.ts`),
  so the enforcement gate (ADR-0005 CHECK C) and Storybook coverage can key off it.
- **Cost:** the contract layer is real overhead per component — you define the
  neutral contract before implementing. Today only Button/Badge/Toggle are
  `required` cross-framework; the other ~38 are `planned` contracts awaiting
  implementation.
- **Cost:** the Svelte `unknown`-widening workaround leaks into consumers (they
  cast at the adapter boundary); `rcl-q64.13` tracks recovering precise types.
