# Component Library Architecture Gap Review - Spec

**Date:** 2026-06-15
**Status:** Proposed for gap-closure planning

---

## Goal

Capture the current architecture review findings for the cross-framework component library and turn them into a concrete target state. This spec should be used as context for follow-up plans, issues, and implementation work that closes the gaps between the intended model and the current repository state.

The intended model is:

- Design tokens are the visual source of truth.
- Contracts are the framework-neutral UI API standard.
- Component libraries are framework adapters that implement the contracts.
- Tooling and CI prove token usage, contract coverage, and implementation conformance.

---

## Current Architecture Summary

The repository is already organized around the right high-level concerns:

```
packages/
  contracts/                        # Framework-neutral TypeScript contracts
  design-tokens/                    # Canonical token source and generated CSS/JSON
  component-libraries/
    react-v18/                      # React 18 implementation package
    svelte-v5/                      # Svelte 5 implementation package
  dev-tools/
    component-generator/            # Component scaffolding CLI
```

This package structure supports the long-term goal: an app should be able to swap one implementation package for another, such as React to Svelte, without changing application-level component API usage.

The main issue is not the package layout. The main issue is that several boundaries are currently documented or implied, but not enforced strongly enough by TypeScript, tests, or generator output.

---

## Findings

### 1. React does not currently implement contracts at the type level

React components define their own prop types instead of extending the contract package. This allows immediate drift between the framework-neutral standard and the implementation.

Example:

- `packages/contracts/src/components/button.ts` defines `ButtonContract` with `variant`, `size`, `disabled`, `loading`, and `type`.
- `packages/component-libraries/react-v18/src/components/Button.tsx` defines separate `ButtonVariant`, `ButtonSize`, and `ButtonProps`.
- React Button omits the `secondary` variant and `loading` prop currently present in the contract.

Target:

```ts
import type { ButtonContract } from "@design-system/contracts";

export type ButtonProps =
  ButtonHTMLAttributes<HTMLButtonElement> &
  ButtonContract & {
    className?: string;
  };
```

Svelte already demonstrates the preferred pattern by importing `ButtonContract` in `Button.svelte`.

### 2. Contract completeness is not enforced

The contracts package contains a broad component surface, while the implementations are much smaller.

Current observed coverage:

| Surface | Current state |
| --- | --- |
| Contracts | 43 component contract files |
| React v18 | 7 components: `Badge`, `Button`, `Card`, `Confetti`, `Input`, `Modal`, `Toggle` |
| Svelte v5 | 1 component: `Button` |

This may be acceptable during incremental development, but it must be explicit. CI should distinguish between:

- Required contracts for the current release.
- Planned contracts that are not yet required.
- Framework-specific extras that are intentionally outside the standard.

Target:

- Add a contract coverage manifest.
- Add a type/test gate that fails when required contracts are missing from an adapter.
- Track extras intentionally, rather than letting them silently diverge.

### 3. There are multiple sources of truth for component APIs

The docs, contracts, and implementation do not fully agree.

Examples:

- `docs/component-standard.md` lists one Button API.
- `packages/contracts/src/components/button.ts` lists a broader Button API.
- React Button implements a narrower API.
- Badge differs across docs, contracts, and React implementation.

Target:

- Treat `@design-system/contracts` as the canonical component API source.
- Generate docs from contracts, or add tests that validate docs against contracts.
- Move progress tracking out of the canonical component standard when it becomes stale easily.

### 4. React package lacks an explicit contracts dependency

`@design-system/react-v18` depends on design tokens but not on `@design-system/contracts`. This prevents TypeScript from enforcing adapter conformance in the primary implementation package.

Target:

- Add `@design-system/contracts` as a workspace dependency or dev dependency for React.
- Use contract imports in every component prop type.
- Add compile-time conformance checks to the React package.

### 5. Component CSS ownership should be co-located

React currently stores component files in `src/components` and CSS in `src/design-system/components`. The separation works for small scale, but it weakens ownership as the library grows.

Current:

```
src/
  components/
    Button.tsx
    Button.stories.tsx
  design-system/
    components/
      button.css
```

Recommended:

```
src/
  components/
    button/
      Button.tsx
      Button.stories.tsx
      Button.spec.tsx
      button.css
      index.ts
```

Package-level CSS aggregation can still exist:

```css
@import "@design-system/design-tokens/generated/design-tokens.css";
@import "./components/button/button.css";
@import "./components/toggle/toggle.css";
```

Target:

- Co-locate each component's implementation, styles, tests, stories, and local exports.
- Keep a single public package stylesheet for consumers.
- Preserve cascade layer ordering in the aggregated stylesheet.

### 6. Generator templates are not aligned with current tokens

The component generator templates use old or non-existent token names such as:

- `--space-2`
- `--radius-md`
- `--surface`
- `--accent`

Generated tokens currently use names such as:

- `--ds-space-2`
- `--ds-radius-md`
- `--ds-color-surface`
- `--ds-color-accent`

The generator also hardcodes semantic colors for danger, success, and warning variants. That conflicts with the token-first rule.

Target:

- Update generator CSS templates to emit only `--ds-*` tokens.
- Add token validation tests for generated CSS.
- Make generated components import and extend contract types.
- Make the generator create co-located component directories.

### 7. Token values do not fully match sizing conventions

The repo convention says component sizing should use `rem`, not `px`. The token source currently defines typography, spacing, radius, and focus ring values in `px`.

Target:

- Decide whether the convention applies to token source values or only component CSS.
- If it applies to tokens, migrate token values to `rem`.
- Add tests that reject disallowed unit usage in token categories where `rem` is required.

### 8. Root naming is React-specific

The root package name and README still frame the repository as a React component library, while the actual direction is cross-framework.

Current examples:

- Root package name: `react-component-library-monorepo`
- README title: `React Component Library Monorepo`

Target naming should be framework-neutral.

Recommended candidates:

- `modular-ui-system`
- `interface-system`
- `cross-framework-design-system`
- `ui-contracts`
- `design-system-monorepo`

Preferred short list:

- `modular-ui-system`
- `interface-system`

---

## Target Architecture

### Package responsibilities

| Package | Responsibility | Should depend on |
| --- | --- | --- |
| `@design-system/design-tokens` | Canonical token data, generated CSS, generated JSON | nothing |
| `@design-system/contracts` | Framework-neutral data prop contracts and shared variant types | optionally token name types only |
| `@design-system/react-v18` | React 18 adapter implementation | contracts, design tokens, React |
| `@design-system/svelte-v5` | Svelte 5 adapter implementation | contracts, design tokens, Svelte, headless primitives |
| `@design-system/component-generator` | Scaffolds contract-compliant components | contracts, design token metadata |

### Enforcement model

The desired compile-time enforcement has three layers:

1. Component prop types extend contract interfaces.
2. Adapter manifests prove required components are exported.
3. Tests or type assertions prove implementation-specific props are additive, not replacements for the contract.

### Adapter placement decision

Adapters live inside each implementation package. There should not be a separate higher-level app-facing adapter package for this repo.

Each concrete component library exposes its own contract-checked adapter entrypoint, such as `reactV18ContractAdapter` from `@design-system/react-v18`. Application code that wants a single swap point can import through one local app module, but this design system should not own that extra indirection. Swapping implementations should be as simple as changing one import line from one implementation package to another, assuming both packages satisfy the same required contract surface.

Example adapter manifest:

```ts
import type {
  BadgeContract,
  ButtonContract,
  ToggleContract
} from "@design-system/contracts";

export interface RequiredAdapterContracts {
  Badge: BadgeContract;
  Button: ButtonContract;
  Toggle: ToggleContract;
}
```

Example React conformance assertion:

```ts
import type { ButtonContract } from "@design-system/contracts";
import type { ButtonProps } from "../components/button/index.js";

type AssertExtendsContract<T extends ButtonContract> = T;
type _ButtonPropsSatisfyContract = AssertExtendsContract<ButtonProps>;
```

### Contract coverage states

Each contract should have an explicit status:

| Status | Meaning |
| --- | --- |
| `required` | Must be implemented by supported adapters for the current release |
| `planned` | Contract exists, implementation can lag without failing release gates |
| `experimental` | API may change and should not be required |
| `framework-extra` | Implementation-only component outside cross-framework standard |

This allows `Card`, `Confetti`, `Input`, and `Modal` to be handled intentionally if they remain outside current contracts.

---

## Acceptance Criteria

This gap review is closed when:

- React imports `@design-system/contracts`.
- React public component prop types extend their matching contract interfaces.
- Svelte continues using contract interfaces and adds the same conformance checks where practical.
- A required contract coverage manifest exists.
- CI fails when a required adapter component is missing.
- Component standard docs no longer contradict contract source.
- Generator templates emit current `--ds-*` token names.
- Generator templates create contract-based components.
- React component CSS is either co-located or a follow-up migration plan exists with explicit acceptance criteria.
- Root naming and README language are framework-neutral.

---

## Suggested Follow-Up Work Items

1. Create a contract coverage manifest and mark current release contracts as `required`, `planned`, or `experimental`.
2. Add `@design-system/contracts` to `@design-system/react-v18`.
3. Refactor React Button to extend `ButtonContract`.
4. Refactor React Badge and Toggle to either match existing contracts or update contracts deliberately.
5. Add type-level conformance tests for React adapter props.
6. Add a coverage test that reports missing required adapter exports.
7. Align `docs/component-standard.md` with contracts.
8. Update component generator templates to use `--ds-*` tokens.
9. Decide on and apply a framework-neutral root/repo name.
10. Plan the React component co-location migration.

---

## Notes

This spec captures a point-in-time review on 2026-06-15. It intentionally does not make implementation changes. It should be used as context for beads issues, implementation plans, and ADR updates.
