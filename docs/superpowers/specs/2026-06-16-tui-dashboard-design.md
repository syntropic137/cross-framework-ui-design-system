# TUI Dashboard — Design Spec

**Date:** 2026-06-16
**Status:** Approved design, pending spec review
**Related beads:** new TUI epic (to be created); depends on `rcl-q64.2` (Svelte adapter) for the Svelte swap path
**Builds on:** `docs/superpowers/specs/2026-06-15-component-library-architecture-gap-review.md` and the merged contract-enforcement work (`fc101e3`)

---

## Goal

A terminal dashboard that is the single entry point to this design system — both for **working in the monorepo** and for **integrating the system into a consuming app**. It is built on `@neuralempowerment/tui` (zero runtime dependencies) and surfaces:

- Launch React 18 Storybook and Svelte 5 Storybook.
- Run repo tasks (qa, build, test, lint, typecheck).
- **Install the contracts** into a target app: scaffold the app-owned, type-safe swap module that binds a chosen implementation adapter to the contract surface.
- Explain how design tokens are used as the cross-UI standard.

It is the **distribution/integration layer** on top of the now-merged contract-enforcement model. It does **not** introduce a repo-owned app-facing adapter package — that was explicitly rejected in the contract-enforcement merge; apps own a tiny swap module instead, and this tool generates it.

## Non-goals (v1)

- Publishing the package to npm (kept runnable via `pnpm tui` and, later, `npx`).
- Rich token-editing/generation UI (explainer only).
- Full Svelte swap parity — gated on `rcl-q64.2` (`svelteV5ContractAdapter`). React swap works today; the TUI offers only libraries that export an adapter.
- Driving real component generation logic (the existing `component-generator` is surfaced, not reimplemented).

---

## Architecture

### Placement & runtime

- New package `packages/dev-tools/dashboard` (`@design-system/dashboard`), mirroring the existing `component-generator` dev-tool.
- Runtime: Node 22 native type-stripping. Root script `"tui": "node --experimental-strip-types packages/dev-tools/dashboard/src/cli.ts"` — **no build step, one new dependency** (`@neuralempowerment/tui`). Constraint: use `import type` for type-only imports; avoid TS enums/namespaces (type-stripping limitation).
- A `build` (tsc) script + `bin` field are added so the package can later be `npx`'d from a consumer app. Publishing itself is out of scope for v1.

### Module layout (each unit one purpose, independently testable)

```
packages/dev-tools/dashboard/
  src/
    cli.ts                 # entry: detect context, render top menu, loop
    menu.ts                # builds the menu model for a given context
    context.ts             # detect in-repo vs external; resolve repo paths
    lib/
      run.ts               # spawn a child process (inherit stdio), resolve on exit
      scaffold.ts          # idempotent file writing (dry-run + confirm)
      pm.ts                # detect target package manager; build install commands
    actions/
      storybook.ts         # launch react / svelte storybook
      runTask.ts           # qa / build / test / lint / typecheck submenu
      installContracts.ts  # scaffold the app-owned swap module
      designTokens.ts      # render the token-standard explainer
    templates/
      adapter.ts.hbs       # the generated swap module (string template)
  tests/                   # vitest unit tests for the pure units
```

The interactive/process-spawning code (`cli.ts`, `actions/*` shells) stays thin; all decision logic lives in **pure functions** (`menu.ts`, `context.ts`, `pm.ts`, `scaffold.ts`, template rendering) that are unit-tested.

### Context detection (`context.ts`)

Walk up from `process.cwd()` looking for this monorepo's marker (root `package.json` name + `pnpm-workspace.yaml` listing the `@design-system/*` packages). Result:

- **in-repo** → expose repo root and package paths; show dev + integration actions.
- **external** → show integration actions only, operating on `process.cwd()` as the target app.

---

## Menus (context-aware)

**In-repo:**
- `Storybook ▸` → `React 18` | `Svelte 5`
- `Run task ▸` → `qa` | `build` | `test` | `lint` | `typecheck`
- `Install contracts into an app…`
- `Design tokens standard…`
- `Quit`

**External (run inside another app):**
- `Install contracts adapter…`
- `Set up design tokens…`
- `Quit`

Long actions show `tui` spinners/steps. Every action is wrapped so a failure prints a red `fail()` and returns to the menu — the TUI never crashes.

---

## Actions

### `storybook` (in-repo)

Spawns the existing scripts with inherited stdio; the server runs until Ctrl-C, then control returns to the menu:
- React: `pnpm --filter @design-system/react-v18 storybook`
- Svelte: `pnpm --filter @design-system/svelte-v5 storybook`

### `runTask` (in-repo)

Submenu → spawns `pnpm <task>` (`qa`, `build`, `test`, `lint`, `typecheck`) at repo root, streaming output, returning to the menu on exit.

### `installContracts` (in-repo and external) — the flagship

Generates the **app-owned swap module** sanctioned by the contract-enforcement merge.

Prompts:
1. Target directory (default: `process.cwd()` external, or asked in-repo).
2. Implementation library — offered **only if it exports a contract adapter**. Today: `react-v18` (`reactV18ContractAdapter`). `svelte-v5` appears once `rcl-q64.2` lands.
3. Adapter module path (default `src/ui/adapter.ts`).

Steps:
1. **Read the contract manifest** from the installed `@design-system/contracts`: `componentContractStatus`, `requiredContractNames`, `RequiredComponentContracts`. This tells the TUI what is `required` vs `planned`.
2. **Ensure dependencies** in the target app: `@design-system/contracts`, the chosen impl package, and `@design-system/design-tokens`. Default is **print the exact install command** (detected per the target's package manager in `pm.ts`) and let the user run it — it does **not** auto-run installs unless the user explicitly confirms. This respects the project's supply-chain stance (no surprise package-manager invocations).
3. **Generate the swap module** from `templates/adapter.ts.hbs`:

   ```ts
   import type { RequiredComponentContracts } from "@design-system/contracts";
   import { reactV18ContractAdapter } from "@design-system/react-v18";
   // Swap implementations by changing this one import:
   // import { svelteV5ContractAdapter } from "@design-system/svelte-v5";

   export const ui = reactV18ContractAdapter satisfies Record<
     keyof RequiredComponentContracts,
     unknown
   >;
   ```

   `planned` (not-yet-required) components are listed in a generated comment block as TODO binding points. The module **compiles today** (it re-exports the library's already-proven adapter) and **fails typecheck** if the chosen library stops satisfying the required surface.
4. **Wire design tokens**: ensure the target imports `@design-system/design-tokens/generated/design-tokens.css` (printed or appended to an entry file).
5. **Idempotent**: prints a dry-run summary of files/deps to be written; never overwrites without confirmation; re-running detects an existing adapter and offers update/skip.

**Build-boundary constraint (from the contract-enforcement merge):** consuming apps must resolve `@design-system/*` through **built package output**, not `packages/contracts/src`. The scaffold therefore depends on published/built packages and, for in-repo targets, ensures contracts is built first. The generated module never imports from package `src`.

### `designTokens` (in-repo and external)

Renders an explainer screen sourced from the **now-canonical** `docs/component-standard.md` plus the generated `--ds-*` tokens (e.g. `--ds-color-accent`, `--ds-space-2`): what the semantic tokens are, how to consume the layered CSS, rem sizing, and theme swapping. It reads the generated token output so it never hardcodes names (the old `--bg`/`--accent` aliases are gone). External mode also offers to wire the tokens CSS entry into the app.

---

## Error handling

- Every action is wrapped; failures `fail()` and return to the menu.
- Scaffolding: dry-run preview → confirm → write; idempotent on re-run.
- Package-manager step: if it can't run safely, it prints exact commands instead of guessing.
- Spawned tasks surface the child's exit code; non-zero shows a clear failure but doesn't kill the TUI.

---

## Testing (test-first, per repo convention)

Vitest unit tests on the pure units only:
- `context` — in-repo vs external detection against fixture directory trees.
- `menu` — selection → correct command/action for each context.
- `pm` — target package-manager detection → correct install command.
- `scaffold` + template — renders the adapter for a given library/manifest, writes into a temp dir, and is idempotent (second run is a no-op / update, not a duplicate).

Interactive prompts and process spawning are thin shells exercised through their pure helpers, not by driving a real TTY.

---

## Integration contract (TUI ↔ design system)

The TUI consumes, and depends on, these stable exports:

| Provider | Export | Used for |
| --- | --- | --- |
| `@design-system/contracts` | `componentContractStatus`, `requiredContractNames`, `RequiredComponentContracts` | Know required vs planned; type the generated module |
| `@design-system/react-v18` | `reactV18ContractAdapter` | The React swap target (exists today) |
| `@design-system/svelte-v5` | `svelteV5ContractAdapter` | The Svelte swap target — **pending `rcl-q64.2`** |
| `@design-system/design-tokens` | `generated/design-tokens.css` + `--ds-*` tokens | Token wiring + explainer |

If a library does not export an adapter, the TUI omits it from the swap menu rather than failing — so it degrades gracefully and lights up Svelte automatically once `rcl-q64.2` lands.

---

## Sequencing

1. Build the TUI (this spec) against the React adapter that exists on `main` today.
2. Then implement `rcl-q64.2` (Svelte v5 contract adapter) — at which point the TUI's Svelte swap path activates with no TUI changes.
