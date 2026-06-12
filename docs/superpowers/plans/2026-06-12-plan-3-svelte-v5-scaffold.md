# Plan 3: Svelte-v5 Package Scaffold + Button Component

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `@design-system/svelte-v5` — a new Svelte 5 component package in the monorepo with build tooling, Storybook, Vitest, and a fully implemented Button component that proves the pattern (implements `ButtonContract`, styled via `--ds-*` tokens and `data-*` attributes, no Tailwind).

**Architecture:** New package at `packages/component-libraries/svelte-v5/`. Uses `@sveltejs/package` to build distributable Svelte output. Bits UI is installed as an implementation dependency (private — never re-exported). Button is self-implemented (no Bits needed). This plan produces one working, tested, story-covered component. All future components follow the same pattern.

**Tech Stack:** Svelte 5, `@sveltejs/package`, Bits UI, Storybook (`@storybook/svelte-vite` + Svelte CSF), Vitest + `@testing-library/svelte`, TypeScript, vanilla CSS

**Prerequisite:** Plan 1 (token prefix rename) must be complete so `--ds-*` tokens exist. Plan 2 (`@design-system/contracts`) must be complete so `ButtonContract` is importable.

---

## File Map

```
packages/component-libraries/svelte-v5/
  src/
    lib/
      components/
        button/
          Button.svelte
          button.css
          index.ts
      index.ts               ← barrel re-export
  .storybook/
    main.ts
    preview.ts
  tests/
    components/
      Button.spec.ts
  package.json
  svelte.config.js
  vite.config.ts
  tsconfig.json
  .eslintrc.cjs
```

---

## Task 1: Scaffold package files

**Files:**
- Create: `packages/component-libraries/svelte-v5/package.json`
- Create: `packages/component-libraries/svelte-v5/svelte.config.js`
- Create: `packages/component-libraries/svelte-v5/vite.config.ts`
- Create: `packages/component-libraries/svelte-v5/tsconfig.json`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@design-system/svelte-v5",
  "version": "0.1.0",
  "private": false,
  "type": "module",
  "main": "./dist/index.js",
  "svelte": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types":  "./dist/index.d.ts",
      "svelte": "./dist/index.js",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build":           "svelte-package -i src/lib",
    "clean":           "rimraf dist",
    "lint":            "eslint \"src/**/*.{ts,svelte}\" \"tests/**/*.ts\"",
    "typecheck":       "svelte-check --tsconfig ./tsconfig.json",
    "test":            "vitest run",
    "test:watch":      "vitest",
    "format":          "prettier --check \"src/**/*.{ts,svelte}\" \"tests/**/*.ts\"",
    "storybook":       "storybook dev --config-dir .storybook --port 6007",
    "storybook:build": "storybook build --config-dir .storybook"
  },
  "peerDependencies": {
    "svelte": ">=5.0.0",
    "@design-system/tokens": ">=0.1.0"
  },
  "dependencies": {
    "bits-ui": "^1.0.0"
  },
  "devDependencies": {
    "@design-system/contracts":           "workspace:^",
    "@design-system/design-tokens":       "workspace:^",
    "@storybook/addon-docs":              "^8.6.0",
    "@storybook/addon-svelte-csf":        "^5.0.0",
    "@storybook/svelte-vite":             "^8.6.0",
    "@sveltejs/package":                  "^2.3.0",
    "@sveltejs/vite-plugin-svelte":       "^5.0.0",
    "@testing-library/svelte":            "^5.2.0",
    "@testing-library/jest-dom":          "^6.6.3",
    "@testing-library/user-event":        "^14.5.2",
    "jsdom":                              "^24.1.0",
    "prettier":                           "^3.3.2",
    "prettier-plugin-svelte":             "^3.2.5",
    "rimraf":                             "^5.0.7",
    "storybook":                          "^8.6.0",
    "svelte":                             "^5.0.0",
    "svelte-check":                       "^4.0.0",
    "typescript":                         "^5.5.4",
    "vite":                               "^5.4.8",
    "vitest":                             "^1.6.0"
  }
}
```

- [ ] **Step 2: Create svelte.config.js**

```javascript
// packages/component-libraries/svelte-v5/svelte.config.js
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

export default {
  preprocess: vitePreprocess(),
};
```

- [ ] **Step 3: Create vite.config.ts**

```typescript
// packages/component-libraries/svelte-v5/vite.config.ts
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [svelte()],
  test: {
    environment: "jsdom",
    globals:     true,
    setupFiles:  ["./tests/setup.ts"],
  },
});
```

- [ ] **Step 4: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target":            "ES2022",
    "module":            "NodeNext",
    "moduleResolution":  "NodeNext",
    "strict":            true,
    "declaration":       true,
    "declarationMap":    true,
    "sourceMap":         true,
    "esModuleInterop":   true,
    "skipLibCheck":      true,
    "verbatimModuleSyntax": true
  },
  "include": ["src/**/*.ts", "src/**/*.svelte", "tests/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 5: Create tests/setup.ts**

```typescript
// packages/component-libraries/svelte-v5/tests/setup.ts
import "@testing-library/jest-dom";
```

- [ ] **Step 6: Install dependencies**

```bash
cd packages/component-libraries/svelte-v5 && pnpm install
```

Expected: packages installed, no errors

---

## Task 2: Configure Storybook

**Files:**
- Create: `packages/component-libraries/svelte-v5/.storybook/main.ts`
- Create: `packages/component-libraries/svelte-v5/.storybook/preview.ts`

- [ ] **Step 1: Create .storybook/main.ts**

```typescript
// packages/component-libraries/svelte-v5/.storybook/main.ts
import type { StorybookConfig } from "@storybook/svelte-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.svelte"],
  addons:  [
    "@storybook/addon-docs",
    "@storybook/addon-svelte-csf",
  ],
  framework: {
    name:    "@storybook/svelte-vite",
    options: {},
  },
};

export default config;
```

- [ ] **Step 2: Create .storybook/preview.ts**

```typescript
// packages/component-libraries/svelte-v5/.storybook/preview.ts
import type { Preview } from "@storybook/svelte";
import "@design-system/design-tokens/generated/design-tokens.css";

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "#ffffff" },
        { name: "dark",  value: "#0c0f14" },
      ],
    },
  },
  globalTypes: {
    theme: {
      name:         "Theme",
      defaultValue: "light",
      toolbar: {
        icon:  "paintbrush",
        items: ["light", "dark", "rose"],
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals["theme"] ?? "light";
      if (typeof document !== "undefined") {
        document.documentElement.setAttribute("data-theme", theme === "light" ? "" : theme);
      }
      return Story();
    },
  ],
};

export default preview;
```

---

## Task 3: Write the failing Button test

**Files:**
- Create: `packages/component-libraries/svelte-v5/tests/components/Button.spec.ts`

- [ ] **Step 1: Create Button.spec.ts**

```typescript
// packages/component-libraries/svelte-v5/tests/components/Button.spec.ts
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import Button from "../../src/lib/components/button/Button.svelte";

describe("Button", () => {
  it("renders children", () => {
    render(Button, { props: { variant: "primary" }, slots: { default: "Click me" } });
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("applies variant as data attribute", () => {
    render(Button, { props: { variant: "danger" }, slots: { default: "Delete" } });
    expect(screen.getByRole("button")).toHaveAttribute("data-variant", "danger");
  });

  it("applies size as data attribute", () => {
    render(Button, { props: { variant: "primary", size: "sm" }, slots: { default: "Small" } });
    expect(screen.getByRole("button")).toHaveAttribute("data-size", "sm");
  });

  it("is disabled when disabled prop is true", () => {
    render(Button, { props: { variant: "primary", disabled: true }, slots: { default: "Disabled" } });
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("is disabled and aria-busy when loading prop is true", () => {
    render(Button, { props: { variant: "primary", loading: true }, slots: { default: "Loading" } });
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute("aria-busy", "true");
  });

  it("renders type attribute", () => {
    render(Button, { props: { variant: "primary", type: "submit" }, slots: { default: "Submit" } });
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  it("fires click events", async () => {
    const user = userEvent.setup();
    let clicked = false;
    const { getByRole } = render(Button, {
      props:  { variant: "primary" },
      slots:  { default: "Click" },
      events: { click: () => { clicked = true; } },
    });
    await user.click(getByRole("button"));
    expect(clicked).toBe(true);
  });
});
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
cd packages/component-libraries/svelte-v5 && pnpm test
```

Expected: FAIL — `Cannot find module '../../src/lib/components/button/Button.svelte'`

---

## Task 4: Implement Button component

**Files:**
- Create: `packages/component-libraries/svelte-v5/src/lib/components/button/Button.svelte`
- Create: `packages/component-libraries/svelte-v5/src/lib/components/button/button.css`
- Create: `packages/component-libraries/svelte-v5/src/lib/components/button/index.ts`

- [ ] **Step 1: Create button.css**

```css
/* packages/component-libraries/svelte-v5/src/lib/components/button/button.css */
.ds-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5em;
  border-radius: var(--ds-radius-md);
  font-size: var(--ds-text-sm);
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  transition:
    background var(--ds-duration-fast) var(--ds-ease),
    border-color var(--ds-duration-fast) var(--ds-ease),
    opacity var(--ds-duration-fast) var(--ds-ease);
}

/* Sizes */
.ds-button[data-size="sm"] { padding: var(--ds-space-1) var(--ds-space-2); font-size: var(--ds-text-xs); }
.ds-button[data-size="md"] { padding: var(--ds-space-2) var(--ds-space-3); }
.ds-button[data-size="lg"] { padding: var(--ds-space-3) var(--ds-space-4); font-size: var(--ds-text-md); }

/* Variants */
.ds-button[data-variant="primary"] {
  background:  var(--ds-color-accent);
  color:       var(--ds-color-accent-contrast);
  border:      1px solid transparent;
}
.ds-button[data-variant="primary"]:hover:not(:disabled) {
  background: color-mix(in oklab, var(--ds-color-accent), black 10%);
}

.ds-button[data-variant="secondary"] {
  background:  var(--ds-color-surface-raised);
  color:       var(--ds-color-fg);
  border:      1px solid var(--ds-color-border);
}
.ds-button[data-variant="secondary"]:hover:not(:disabled) {
  background: var(--ds-color-overlay);
}

.ds-button[data-variant="ghost"] {
  background: transparent;
  color:      var(--ds-color-fg);
  border:     1px solid transparent;
}
.ds-button[data-variant="ghost"]:hover:not(:disabled) {
  background: var(--ds-color-surface-raised);
}

.ds-button[data-variant="danger"] {
  --_danger: #e5484d;
  background: transparent;
  color:      var(--_danger);
  border:     1px solid var(--_danger);
}
.ds-button[data-variant="danger"]:hover:not(:disabled) {
  background: var(--_danger);
  color:      #ffffff;
}

/* States */
.ds-button:disabled          { opacity: 0.4; cursor: not-allowed; }
.ds-button:focus-visible     { outline: var(--ds-focus-ring); outline-offset: 2px; }
```

- [ ] **Step 2: Create Button.svelte**

```svelte
<!-- packages/component-libraries/svelte-v5/src/lib/components/button/Button.svelte -->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { ButtonContract } from "@design-system/contracts";
  import "./button.css";

  interface Props extends ButtonContract {
    children:  Snippet;
    onclick?:  () => void;
    class?:    string;
  }

  let {
    variant  = "primary",
    size     = "md",
    disabled = false,
    loading  = false,
    type     = "button",
    children,
    onclick,
    class: className,
  }: Props = $props();
</script>

<button
  class={["ds-button", className].filter(Boolean).join(" ")}
  data-variant={variant}
  data-size={size}
  {type}
  disabled={disabled || loading}
  aria-busy={loading || undefined}
  {onclick}
>
  {@render children()}
</button>
```

- [ ] **Step 3: Create button/index.ts**

```typescript
// packages/component-libraries/svelte-v5/src/lib/components/button/index.ts
export { default as Button } from "./Button.svelte";
```

- [ ] **Step 4: Create the package barrel export**

```typescript
// packages/component-libraries/svelte-v5/src/lib/index.ts
export * from "./components/button/index.js";
```

- [ ] **Step 5: Run tests — confirm they pass**

```bash
cd packages/component-libraries/svelte-v5 && pnpm test
```

Expected: 7 tests pass

- [ ] **Step 6: Type-check**

```bash
cd packages/component-libraries/svelte-v5 && pnpm typecheck
```

Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add packages/component-libraries/svelte-v5/
git commit -m "feat(svelte-v5): scaffold package and implement Button component"
```

---

## Task 5: Add Storybook stories for Button

**Files:**
- Create: `packages/component-libraries/svelte-v5/src/lib/components/button/Button.stories.svelte`

- [ ] **Step 1: Create Button.stories.svelte**

```svelte
<!-- packages/component-libraries/svelte-v5/src/lib/components/button/Button.stories.svelte -->
<script context="module">
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import Button from "./Button.svelte";

  const { Story } = defineMeta({
    title: "svelte-v5/Button",
    component: Button,
    argTypes: {
      variant: { control: "select", options: ["primary", "secondary", "ghost", "danger"] },
      size:    { control: "select", options: ["sm", "md", "lg"] },
    },
  });
</script>

<Story name="Primary" args={{ variant: "primary", size: "md" }}>
  {#snippet children()}Save changes{/snippet}
</Story>

<Story name="Secondary" args={{ variant: "secondary", size: "md" }}>
  {#snippet children()}Cancel{/snippet}
</Story>

<Story name="Ghost" args={{ variant: "ghost", size: "md" }}>
  {#snippet children()}Learn more{/snippet}
</Story>

<Story name="Danger" args={{ variant: "danger", size: "md" }}>
  {#snippet children()}Delete account{/snippet}
</Story>

<Story name="Small" args={{ variant: "primary", size: "sm" }}>
  {#snippet children()}Small{/snippet}
</Story>

<Story name="Large" args={{ variant: "primary", size: "lg" }}>
  {#snippet children()}Large action{/snippet}
</Story>

<Story name="Disabled" args={{ variant: "primary", disabled: true }}>
  {#snippet children()}Disabled{/snippet}
</Story>

<Story name="Loading" args={{ variant: "primary", loading: true }}>
  {#snippet children()}Saving…{/snippet}
</Story>
```

- [ ] **Step 2: Start Storybook and verify Button stories render correctly**

```bash
cd packages/component-libraries/svelte-v5 && pnpm storybook
```

Open http://localhost:6007. Verify:
- All 8 stories appear under `svelte-v5/Button`
- `data-variant` and `data-size` attributes are visible in the DOM inspector
- Disabled and Loading stories show the button in the disabled state
- Token-driven styles apply (requires `design-tokens:build` to have run)

- [ ] **Step 3: Commit stories**

```bash
git add packages/component-libraries/svelte-v5/src/lib/components/button/Button.stories.svelte
git commit -m "feat(svelte-v5): add Button Storybook stories"
```

---

## Task 6: Wire svelte-v5 into monorepo scripts

**Files:**
- Modify: `/package.json` (monorepo root)

- [ ] **Step 1: Add svelte-v5 to root scripts**

Open the root `package.json` and add to `scripts`:

```json
{
  "scripts": {
    "storybook:svelte": "pnpm --filter @design-system/svelte-v5 storybook",
    "test:svelte":      "pnpm --filter @design-system/svelte-v5 test"
  }
}
```

The `pnpm test` command already runs all packages via `-r` so svelte-v5 is included automatically once its `test` script exists.

- [ ] **Step 2: Run full monorepo test suite**

```bash
pnpm test
```

Expected: all tests pass (39 React + 7 Svelte Button tests + token tests)

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore: add svelte-v5 storybook and test scripts to monorepo root"
```
