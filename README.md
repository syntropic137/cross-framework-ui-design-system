# Design System — Cross-Framework Component Library

A pnpm monorepo (`pnpm@9.1.4`) that implements a **design-first matrix**: one framework-neutral contract, shared design tokens, and multiple designs each implemented per framework. The payoff is surgical: swap a design (one package specifier), swap a framework implementation behind the same contract, or switch themes at runtime — all decoupled, all enforced.

> See [ADR-0004](docs/adrs/ADR-0004-design-first-matrix.md) for the canonical architecture decision.

---

## Architecture

The system is organized in layers:

| Layer | Package / Path | Role |
|---|---|---|
| **Contract** | `packages/contracts` → `@syntropic137/contracts` | Framework-neutral prop contracts and the `RequiredComponentContracts` type that every adapter must satisfy |
| **Design tokens** | `packages/design-tokens` → `@syntropic137/design-tokens` | Token definitions → generated `--ds-*` CSS custom properties; light/dark/… themes via `@layer` |
| **Design cells** | `designs/<design>/<framework>/` → `@syntropic137/<design>-<framework>` | One package per (design × framework) cell; each exports a `*ContractAdapter` + `./styles.css` |
| **Dev tools** | `packages/dev-tools/{component-generator,dashboard}` | Component scaffolding CLI + TUI dashboard |
| **Example apps** | `apps/{tauri-harness,tauri-harness-svelte}` | Tauri harnesses that demonstrate the design swap and runtime theming |

### Current design × framework matrix

| | `react-v18` | `svelte-v5` |
|---|---|---|
| `default` | `@syntropic137/default-react-v18` | `@syntropic137/default-svelte-v5` |
| `brutalist` | `@syntropic137/brutalist-react-v18` | `@syntropic137/brutalist-svelte-v5` |

Each cell exports a stable adapter name tied to its framework, so a **design swap is a one-specifier change**:

```ts
// swap design (same framework — only the package name changes, binding is identical)
import { reactV18ContractAdapter } from "@syntropic137/default-react-v18";
import { reactV18ContractAdapter } from "@syntropic137/brutalist-react-v18";
```

Swapping across frameworks (React ↔ Svelte) at runtime is explicitly a non-goal; the framework+version is the fixed lane.

---

## Quick Start

```bash
pnpm install
```

Run the enforcement gate (tokens + token discipline + contract conformance + adapter presence):

```bash
pnpm design-system:verify
```

Run the full QA gate (lint → typecheck → build → test → design-system:verify → test:verify → storybook:test):

```bash
pnpm qa
```

**Run `pnpm qa` and fix all failures before finishing a task.**

---

## Common Commands

| Command | What it does |
|---|---|
| `pnpm qa` | Full gate: lint + typecheck + build + test + design-system:verify + test:verify + storybook:test |
| `pnpm lint` | ESLint across all packages |
| `pnpm typecheck` | tsc across all packages |
| `pnpm build` | Build design-tokens first, then all packages |
| `pnpm test` | Vitest across all packages |
| `pnpm format` | Prettier across all packages |
| `pnpm design-system:verify` | Enforcement gate (see below) |
| `pnpm test:verify` | Node test runner proving the gate script itself works |
| `pnpm storybook` | React Storybook (default-react-v18) |
| `pnpm storybook:svelte` | Svelte Storybook (default-svelte-v5) |
| `pnpm tui` | Dashboard TUI (dev-tools/dashboard) |
| `pnpm generate:component` | Scaffold a new component via the generator CLI |

### Running an example app

```bash
# Svelte harness — default design
pnpm --filter tauri-harness-svelte tauri dev

# Svelte harness — brutalist design (build-time swap)
VITE_UI_DESIGN=brutalist pnpm --filter tauri-harness-svelte tauri dev
```

Runtime light/dark theme toggle is implemented in the harness by flipping `data-theme` on the root element. No rebuild, no component changes — every `var(--ds-color-*)` re-resolves from the token layer.

---

## The Enforcement Gate (`design-system:verify`)

`scripts/verify-design-system.mjs` (invoked via `pnpm design-system:verify`) runs four checks across every discovered `designs/<design>/<framework>/` cell:

| Check | What it verifies |
|---|---|
| **A — Tokens present** | `packages/design-tokens/generated/design-tokens.css` exists and contains `--ds-*` custom properties |
| **B — Token discipline** | No hardcoded color literals (hex, `rgb()`, `hsl()`, named colors) in design `src/` CSS — components must use `var(--ds-color-*)` |
| **C — Contract conformance** | `pnpm -r typecheck` exits 0 (TypeScript enforces every adapter against `RequiredComponentContracts`) |
| **D — Adapter export presence** | Each cell has a `contract-adapter.ts` that `export const *ContractAdapter` |

`pnpm test:verify` runs the gate's own unit tests (Node built-in test runner). Both checks are included in `pnpm qa`.

---

## Consuming a Design Cell

```ts
// 1. Import styles (required — the JS bundle does not auto-inject CSS)
import "@syntropic137/default-svelte-v5/styles.css";
import "@syntropic137/design-tokens/generated/design-tokens.css";

// 2. Import the adapter (satisfies RequiredComponentAdapter)
import { svelteV5ContractAdapter as ui } from "@syntropic137/default-svelte-v5";

// 3. Use components from the adapter
const Button = ui.button;
```

To swap designs, change the package specifier on lines 1 and 2 — the adapter name and the rest of your code stay the same.

---

## How to Extend

### Add a new component (contract first)

1. Add the contract to `packages/contracts/src/components/<component>.ts`.
2. Set its status in `component-status.ts` (`planned` while implementing, `required` when ready).
3. Add it to `RequiredComponentContracts` when promoting to required.
4. Implement in each supported adapter cell; export the component under the required key.
5. Write tests (Vitest + Testing Library) and Storybook stories.
6. Run `pnpm qa`.

See [`docs/component-standard.md`](docs/component-standard.md) for the full compliance checklist.

### Add a new design

Create `designs/<new-design>/` with one subdirectory per framework you want to support. Mirror an existing cell (e.g. `designs/default/react-v18/`):
- Keep the same package layout and `contract-adapter.ts` shape.
- Name the package `@syntropic137/<new-design>-<framework>`.
- Export `reactV18ContractAdapter` (React) or `svelteV5ContractAdapter` (Svelte) — these names are stable per framework.
- Use only `var(--ds-color-*)` tokens; no hardcoded colors.
- Run `pnpm design-system:verify` to confirm the gate picks up the new cell.

### Add a new framework cell to an existing design

Create `designs/<design>/<new-framework>/`. Follow the same steps as above. The gate auto-discovers all `designs/<design>/<framework>/package.json` entries.

---

## Repo Layout

```
designs/
  default/
    react-v18/             @syntropic137/default-react-v18 — default React 18 cell
    svelte-v5/             @syntropic137/default-svelte-v5 — default Svelte 5 cell
  brutalist/
    react-v18/             @syntropic137/brutalist-react-v18 — brutalist React 18 cell
    svelte-v5/             @syntropic137/brutalist-svelte-v5 — brutalist Svelte 5 cell
packages/
  contracts/               @syntropic137/contracts — framework-neutral prop contracts
  design-tokens/           @syntropic137/design-tokens — token source → generated CSS/JSON
  dev-tools/
    component-generator/   @syntropic137/component-generator — scaffolding CLI
    dashboard/             TUI dashboard (pnpm tui)
apps/
  tauri-harness/           React 18 example app (Tauri)
  tauri-harness-svelte/    Svelte 5 example app (Tauri) — demonstrates design swap + theming
scripts/
  verify-design-system.mjs   Enforcement gate (design-system:verify)
  verify-design-system.test.mjs  Gate unit tests (test:verify)
docs/
  adrs/                    Architecture Decision Records
  component-standard.md    Component contract standard and compliance checklist
```

---

## Further Reading

- [`AGENTS.md`](AGENTS.md) — Canonical contributor instructions (CI gate, conventions, commit format, beads workflow). Read this first.
- [`docs/component-standard.md`](docs/component-standard.md) — Component contract standard, required vs. planned components, adapter compliance checklist.
- [`docs/adrs/`](docs/adrs/) — Architecture decisions: ADR-0001 monorepo, ADR-0002 token generation, ADR-0003 component generator, ADR-0004 design-first matrix.
- [`SECURITY.md`](SECURITY.md) — Security posture and dependency advisory controls.
