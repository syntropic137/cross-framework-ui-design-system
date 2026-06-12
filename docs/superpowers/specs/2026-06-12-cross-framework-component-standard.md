# Cross-Framework Component Standard — Design Spec

**Date:** 2026-06-12
**Status:** Approved for implementation planning

---

## Goal

Turn this monorepo into a publishable cross-framework component standard. Any component library that satisfies the contracts package can be dropped in as a replacement, completely changing the visual design of an application without touching app code. No Tailwind — vanilla CSS custom properties only.

---

## 1. Package Architecture

```
packages/
  design-tokens/                    ← @design-system/tokens (already exists)
  contracts/                        ← @design-system/contracts (NEW)
  component-libraries/
    react-v18/                      ← @design-system/react-v18 (already exists, 7 components)
    svelte-v5/                      ← @design-system/svelte-v5 (NEW)
  dev-tools/
    component-generator/            ← already exists
```

### Package responsibilities

| Package | Publishes | Depends on |
|---|---|---|
| `@design-system/tokens` | CSS files + TypeScript token types | nothing |
| `@design-system/contracts` | TypeScript interfaces + shared variant types | `@design-system/tokens` (for token name types only) |
| `@design-system/react-v18` | React 18 components + CSS | `@design-system/contracts`, `@design-system/tokens` |
| `@design-system/svelte-v5` | Svelte 5 components + CSS | `@design-system/contracts`, `@design-system/tokens`, `bits-ui` |

### Naming convention

Framework packages are named by framework + major version (`react-v18`, `svelte-v5`). This makes co-existing versions explicit and allows `react-v19` or `svelte-v6` to be added without renaming anything. `@design-system/tokens` and `@design-system/contracts` carry no version suffix — they are framework-agnostic and designed to be stable across framework generations.

### Publishing strategy

Internal (`private: false` fields set, `exports` maps correct) but not yet on npm. Changesets added at root for versioning. A GitHub Actions publish workflow is stubbed but gated — it runs only when manually triggered on a tag. Nothing auto-publishes until explicitly enabled.

---

## 2. Contract System (`@design-system/contracts`)

### What it is

A TypeScript-only package. Zero runtime code. No framework imports. Publishable as a sub-kilobyte types package. This is the standard that makes swap possible.

### What a contract covers

- **Data props:** `value`, `disabled`, `placeholder`, `open`, `loading`, `error` — anything that is pure data
- **Variant types:** `ButtonVariant`, `ComponentSize`, `ComponentTone` — union string literals
- **State props:** `open`, `checked`, `indeterminate`, `selected` — component state that consumers may bind
- **JSDoc behavior notes:** accessibility expectations and keyboard behavior documented in comments — not runtime enforced

### What a contract does NOT cover

- Children, snippets, or slots — these are framework-specific composition
- Event handlers — each framework uses different event patterns
- Refs, forwarded refs, `use:action` — implementation detail
- CSS classes or styling — that is the implementation's business

### Shared base types

```typescript
// contracts/src/shared.ts
export type ComponentSize    = 'sm' | 'md' | 'lg';
export type ComponentTone    = 'neutral' | 'success' | 'warning' | 'danger' | 'accent';
export type DataOrientation  = 'horizontal' | 'vertical';
export type DataState        = 'open' | 'closed' | 'checked' | 'unchecked' | 'indeterminate';
```

### Example contract files

```typescript
// contracts/src/components/button.ts
import type { ComponentSize } from '../shared.js';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonContract {
  variant?: ButtonVariant;
  size?:    ComponentSize;
  disabled?: boolean;
  loading?:  boolean;
  /** @default 'button' */
  type?:    'button' | 'submit' | 'reset';
}
```

```typescript
// contracts/src/components/dialog.ts
export interface DialogRootContract {
  open?:         boolean;
  onOpenChange?: (open: boolean) => void;
}
export interface DialogContentContract {
  /** Prevent closing when clicking the overlay */
  modal?: boolean;
}
```

```typescript
// contracts/src/components/select.ts
import type { ComponentSize } from '../shared.js';

export interface SelectRootContract {
  value?:         string;
  onValueChange?: (value: string) => void;
  disabled?:      boolean;
  placeholder?:   string;
}
export interface SelectItemContract {
  value:    string;
  label:    string;
  disabled?: boolean;
}
```

### How implementations satisfy contracts

**React:**
```typescript
import type { ButtonContract } from '@design-system/contracts';
export interface ButtonProps extends ButtonContract {
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
}
```

**Svelte 5:**
```typescript
import type { ButtonContract } from '@design-system/contracts';
// In Button.svelte:
// let { variant, size, disabled, loading, type, children }: ButtonContract & { children: Snippet } = $props();
```

### The 43 Bits UI components → contract files

Grouped by complexity:

**Simple (self-implement, no Bits needed):**
button, label, separator, avatar, badge, aspect-ratio

**Behavior-rich (wrap Bits UI in Svelte, use other headless libs in React):**
accordion, alert-dialog, calendar, checkbox, collapsible, combobox, command, context-menu, date-field, date-picker, date-range-field, date-range-picker, dialog, dropdown-menu, link-preview, menu, menubar, meter, navigation-menu, pagination, pin-input, popover, progress, radio-group, range-calendar, rating-group, scroll-area, select, slider, switch, tabs, time-field, time-range-field, toggle, toggle-group, toolbar, tooltip

**Shared types (not a component — becomes `shared.ts`):**
utilities

That is 35 contract files + 1 shared types file.

### Barrel export

```typescript
// contracts/src/index.ts
export * from './shared.js';
export * from './components/button.js';
export * from './components/dialog.js';
// ... all 35 component files
```

---

## 3. Svelte 5 Package (`@design-system/svelte-v5`)

### Build tooling

| Tool | Role |
|---|---|
| `@sveltejs/package` | Packages Svelte files for distribution — handles types, preprocessed output, exports map |
| `svelte-check` | TypeScript checking for `.svelte` files |
| `@storybook/svelte-vite` | Storybook with Svelte CSF stories |
| `vitest` + `@testing-library/svelte` | Unit tests |
| `bits-ui` | Headless behavior primitives (private — never re-exported) |

### Package structure

```
packages/component-libraries/svelte-v5/
  src/
    lib/
      components/
        button/
          Button.svelte
          button.css
          index.ts
        dialog/
          Dialog.svelte
          DialogTrigger.svelte
          DialogContent.svelte
          DialogHeader.svelte
          DialogFooter.svelte
          dialog.css
          index.ts
        ... (one directory per component)
      index.ts           ← barrel: export everything
  .storybook/
  tests/
  package.json
  svelte.config.js
  vite.config.ts
```

### Styling rules (same as React package)

- No Tailwind. No inline styles. No CSS-in-JS.
- All visual styling via CSS custom properties from `@design-system/tokens`.
- Styling hooks via `data-*` attributes only: `data-variant`, `data-size`, `data-tone`, `data-state`.
- Each component directory owns its CSS file. No shared component stylesheet.

```svelte
<!-- Button.svelte — the pattern every component follows -->
<script lang="ts">
  import type { ButtonContract } from '@design-system/contracts';
  import type { Snippet } from 'svelte';
  import './button.css';

  let {
    variant = 'primary',
    size    = 'md',
    disabled = false,
    loading  = false,
    type     = 'button',
    children,
    onclick,
  }: ButtonContract & { children: Snippet; onclick?: () => void } = $props();
</script>

<button
  class="ds-button"
  data-variant={variant}
  data-size={size}
  {type}
  disabled={disabled || loading}
  aria-busy={loading}
  {onclick}
>
  {@render children()}
</button>
```

### Bits UI wrapping pattern

Bits UI is always wrapped — never imported directly in application code. The app sees only `@design-system/svelte-v5`.

```svelte
<!-- dialog/Dialog.svelte -->
<script lang="ts">
  import { Dialog as BitsDialog } from 'bits-ui';
  import type { DialogRootContract } from '@design-system/contracts';

  let { open = $bindable(false), onOpenChange, children }: DialogRootContract & { children: Snippet } = $props();
</script>

<BitsDialog.Root bind:open {onOpenChange}>
  {@render children()}
</BitsDialog.Root>
```

### Storybook as contract test bench

Every component has Storybook stories covering: default, all variants, all sizes, disabled, loading/error, keyboard behavior, dark theme. Stories are the acceptance test for the contract. If a story breaks when internals change, the contract was violated.

```svelte
<!-- button/Button.stories.svelte -->
<script context="module">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Button from './Button.svelte';
  const { Story } = defineMeta({
    title: 'svelte-v5/Button',
    component: Button,
    argTypes: {
      variant: { control: 'select', options: ['primary','secondary','ghost','danger'] },
      size:    { control: 'select', options: ['sm','md','lg'] },
    },
  });
</script>

<Story name="Primary"   args={{ variant: 'primary',   size: 'md' }}>
  {#snippet children()}Save changes{/snippet}
</Story>
<Story name="Secondary" args={{ variant: 'secondary', size: 'md' }}>
  {#snippet children()}Cancel{/snippet}
</Story>
<Story name="Ghost"     args={{ variant: 'ghost',     size: 'md' }}>
  {#snippet children()}Learn more{/snippet}
</Story>
<Story name="Danger"    args={{ variant: 'danger',    size: 'md' }}>
  {#snippet children()}Delete{/snippet}
</Story>
<Story name="Disabled"  args={{ variant: 'primary', disabled: true }}>
  {#snippet children()}Disabled{/snippet}
</Story>
```

---

## 4. Token Foundation (`@design-system/tokens`)

### Current state

The existing `design-tokens` package already generates CSS custom properties with light/dark theme support. The generator outputs a `design-tokens.css` file with `@layer tokens` containing `:root` declarations and `[data-theme="dark"]` overrides.

### Changes needed

**Token prefix scoping:** Current tokens use unscoped names (`--brand`, `--bg`, `--text-sm`). These will collide in any real application. Rename to `--ds-*` prefix:

```css
/* Before */
--brand: hsl(222 85% 50%);
--bg: #ffffff;
--text-sm: 14px;

/* After */
--ds-color-brand: hsl(222 85% 50%);
--ds-color-bg: #ffffff;
--ds-text-sm: 14px;
```

**Semantic surface tokens:** Add the surface hierarchy the component packages need:

```css
:root {
  /* Surfaces */
  --ds-color-surface:        #ffffff;
  --ds-color-surface-raised: #f5f7fb;
  --ds-color-overlay:        #e9ecf0;

  /* Text */
  --ds-color-text:           #0b0c0e;
  --ds-color-text-muted:     #6b7280;
  --ds-color-text-subtle:    #9ca3af;

  /* Interactive */
  --ds-color-border:         #e5e7eb;
  --ds-color-border-focus:   var(--ds-color-brand);
  --ds-color-accent:         var(--ds-color-brand);
  --ds-color-accent-text:    #ffffff;

  /* Motion */
  --ds-duration-fast:        100ms;
  --ds-duration-base:        200ms;
  --ds-ease:                 cubic-bezier(0.4, 0, 0.2, 1);

  /* Z-index */
  --ds-z-dropdown:   100;
  --ds-z-sticky:     200;
  --ds-z-overlay:    300;
  --ds-z-modal:      400;
  --ds-z-toast:      500;
}
```

**Ship format:** `@design-system/tokens` publishes two files that consumers import directly:

```
dist/
  design-tokens.css      ← base tokens + all themes
  design-tokens.json     ← same data for tooling/JS consumers
```

No JavaScript required at runtime. Import the CSS once in the app root and tokens are available everywhere.

**Token generator stays:** The existing TypeScript generator (`token-data.ts` → `index.ts`) continues to be the source of truth. The rename to `--ds-*` prefix is done in `token-data.ts`, not in generated output.

---

## 5. Distribution & Publishing

### Versioning

Add `changesets` at monorepo root:

```
.changeset/
  config.json
```

Each package versions independently. `@design-system/contracts` changes are the most breaking — a contract change that removes a prop is a major bump. Token renames are breaking for `tokens` and all consumer packages.

### Package `exports` maps

Each package gets a correct `exports` field before any npm publishing:

```json
// @design-system/contracts package.json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  }
}
```

```json
// @design-system/svelte-v5 package.json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "svelte": "./dist/index.js",
      "import": "./dist/index.js"
    }
  }
}
```

### CI stub (not activated yet)

A `.github/workflows/publish.yml` is stubbed but the job is gated with `if: false` until publishing is ready. It exists so the scaffolding is there when needed.

### peerDependencies for consumer clarity

```json
// @design-system/svelte-v5 peerDependencies
{
  "svelte": ">=5.0.0",
  "@design-system/tokens": ">=1.0.0"
}

// @design-system/react-v18 peerDependencies  
{
  "react": ">=18.0.0",
  "react-dom": ">=18.0.0",
  "@design-system/tokens": ">=1.0.0"
}
```

`bits-ui` is a regular `dependency` of `svelte-v5`, not a peer — it is an implementation detail the consumer never needs to install.

---

## 6. What "Swap" Looks Like

The end state: an app that imports from `@design-system/react-v18` can switch to `@design-system/svelte-v5` (or a third-party `@somebody/react-v18` that also satisfies `@design-system/contracts`) by:

1. Changing the import path
2. Swapping the CSS token file for a different theme

Zero component logic changes. Zero prop renames. Zero restyling.

This is the thing worth publishing.

---

## Out of Scope

- Server-side rendering configuration (SvelteKit / Next.js adapter setup) — app concern, not library concern
- Animations beyond CSS transitions — no animation library dependencies
- Icon library — separate concern, not part of this standard
- Documentation site — future work
- Automated npm publishing — stubbed but not activated
