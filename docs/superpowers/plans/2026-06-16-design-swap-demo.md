# Design Swap Demo (rcl-q64.5) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a second React-18 design (`@design-system/brutalist-react-v18`) and wire `apps/tauri-harness` to swap between `default` and `brutalist` designs via `VITE_UI_DESIGN` env var, proving within-framework design swaps.

**Architecture:** Mirrors the `designs/default/react-v18` package exactly — same tsconfig, vite, vitest setup — with brutalist-styled components (thick borders, hard edges, no border-radius, blocky shadows, mono font). The harness `src/ui/adapter.ts` becomes the single swap point, keyed by `import.meta.env.VITE_UI_DESIGN`.

**Tech Stack:** React 18, TypeScript 5, Vite 6, Vitest 4, clsx, pnpm workspaces, `@design-system/contracts`, `@design-system/design-tokens`

---

## File Map

### New files — `designs/brutalist/react-v18/`
- `package.json` — package manifest for `@design-system/brutalist-react-v18`
- `tsconfig.json` — extends `../../../tsconfig.base.json`, composite, jsx react-jsx
- `tsconfig.build.json` — emitDeclarationOnly, rootDir: src
- `vite.config.ts` — lib mode, entry src/index.ts, externalize react/react-dom/clsx
- `vitest.config.ts` — unit project only (no storybook)
- `tests/setup.ts` — same as default (jest-dom + localStorage polyfill)
- `src/components/Badge.tsx` — brutalist Badge implementing BadgeContract
- `src/components/Button.tsx` — brutalist Button implementing ButtonContract
- `src/components/Toggle.tsx` — brutalist Toggle implementing ToggleContract
- `src/styles/badge.css` — brutalist badge CSS (scoped to `[data-design="brutalist"]` or `brutal-` prefix)
- `src/styles/button.css` — brutalist button CSS
- `src/styles/toggle.css` — brutalist toggle CSS
- `src/contract-adapter.ts` — exports `reactV18ContractAdapter`, `ReactV18AdapterProps`, `ReactV18ContractConformance`
- `src/index.ts` — barrel export
- `tests/components/Badge.spec.tsx` — badge contract behaviors
- `tests/components/Button.spec.tsx` — button contract behaviors
- `tests/components/Toggle.spec.tsx` — toggle contract behaviors
- `tests/contract-adapter.spec.ts` — adapter keys cover requiredContractNames

### Modified files — `apps/tauri-harness/`
- `package.json` — add `@design-system/brutalist-react-v18` dep; update `build`/`typecheck` scripts
- `src/ui/adapter.ts` — VITE_UI_DESIGN-keyed swap point
- `src/App.tsx` — show active design label
- `src/vite-env.d.ts` — `/// <reference types="vite/client" />`

---

## Task 1: Scaffold the brutalist package — config files

**Files:**
- Create: `designs/brutalist/react-v18/package.json`
- Create: `designs/brutalist/react-v18/tsconfig.json`
- Create: `designs/brutalist/react-v18/tsconfig.build.json`
- Create: `designs/brutalist/react-v18/vite.config.ts`
- Create: `designs/brutalist/react-v18/vitest.config.ts`
- Create: `designs/brutalist/react-v18/tests/setup.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@design-system/brutalist-react-v18",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "rimraf dist tsconfig.build.tsbuildinfo && pnpm --filter @design-system/contracts build && vite build && tsc --build tsconfig.build.json",
    "clean": "rimraf dist",
    "lint": "eslint \"src/**/*.{ts,tsx}\" \"tests/**/*.ts?(x)\"",
    "typecheck": "pnpm --filter @design-system/contracts build && tsc --noEmit",
    "test": "pnpm --filter @design-system/contracts build && vitest run --project=unit",
    "test:watch": "pnpm --filter @design-system/contracts build && vitest --project=unit",
    "format": "prettier --check \"src/**/*.{ts,tsx}\" \"tests/**/*.ts?(x)\""
  },
  "peerDependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "dependencies": {
    "@design-system/contracts": "workspace:^",
    "@design-system/design-tokens": "workspace:^",
    "clsx": "^2.1.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^14.2.1",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.2",
    "@vitejs/plugin-react": "^4.7.0",
    "jsdom": "^24.1.0",
    "prettier": "^3.6.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "rimraf": "^5.0.7",
    "typescript": "^5.9.2",
    "vite": "^6.4.3",
    "vitest": "^4.1.8",
    "eslint": "^9.39.4"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "rootDir": ".",
    "outDir": "dist",
    "jsx": "react-jsx",
    "declaration": true,
    "declarationMap": true,
    "types": [
      "vitest/globals",
      "vitest/importMeta"
    ]
  },
  "include": [
    "src/**/*",
    "tests/**/*",
    "vite.config.ts",
    "vitest.config.ts"
  ],
  "exclude": [
    "dist"
  ]
}
```

- [ ] **Step 3: Create tsconfig.build.json**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "emitDeclarationOnly": true,
    "rootDir": "src"
  },
  "include": ["src/**/*"],
  "exclude": ["tests", "dist"]
}
```

- [ ] **Step 4: Create vite.config.ts**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "DesignSystemBrutalistReact18",
      formats: ["es", "cjs"],
      fileName: (format) => (format === "es" ? "index.js" : "index.cjs")
    },
    rollupOptions: {
      external: ["react", "react-dom", "clsx"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          clsx: "clsx"
        }
      }
    }
  }
});
```

- [ ] **Step 5: Create vitest.config.ts**

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [react()],
        test: {
          name: "unit",
          environment: "jsdom",
          environmentOptions: {
            jsdom: {
              url: "http://localhost"
            }
          },
          globals: true,
          setupFiles: [resolve(dir, "tests/setup.ts")],
          include: ["tests/**/*.spec.tsx", "tests/**/*.spec.ts"]
        }
      }
    ]
  }
});
```

- [ ] **Step 6: Create tests/setup.ts**

```typescript
import "@testing-library/jest-dom/vitest";
import { beforeAll } from "vitest";

function installLocalStorage() {
  if (typeof globalThis.localStorage !== "undefined") {
    return;
  }

  const storage = new Map<string, string>();
  const localStorage = {
    clear() {
      storage.clear();
    },
    getItem(key: string) {
      return storage.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(storage.keys())[index] ?? null;
    },
    removeItem(key: string) {
      storage.delete(key);
    },
    setItem(key: string, value: string) {
      storage.set(key, value);
    },
    get length() {
      return storage.size;
    }
  } satisfies Storage;

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: localStorage
  });

  if (typeof window !== "undefined") {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: localStorage
    });
  }
}

installLocalStorage();
beforeAll(() => {
  installLocalStorage();
});
```

- [ ] **Step 7: Commit**

```bash
git add designs/brutalist/react-v18/package.json designs/brutalist/react-v18/tsconfig.json designs/brutalist/react-v18/tsconfig.build.json designs/brutalist/react-v18/vite.config.ts designs/brutalist/react-v18/vitest.config.ts designs/brutalist/react-v18/tests/setup.ts
git commit -m "feat(brutalist-react-v18): scaffold package config and test setup"
```

---

## Task 2: Write the failing component tests

**Files:**
- Create: `designs/brutalist/react-v18/tests/components/Badge.spec.tsx`
- Create: `designs/brutalist/react-v18/tests/components/Button.spec.tsx`
- Create: `designs/brutalist/react-v18/tests/components/Toggle.spec.tsx`
- Create: `designs/brutalist/react-v18/tests/contract-adapter.spec.ts`

- [ ] **Step 1: Create tests/components/Badge.spec.tsx**

```tsx
import { render, screen } from "@testing-library/react";
import { Badge } from "../../src/components/Badge.js";

describe("Badge (brutalist)", () => {
  it("renders with base class and content", () => {
    render(<Badge>Test content</Badge>);
    const element = screen.getByText("Test content");
    expect(element).toHaveClass("brutal-badge");
  });

  it("applies variant classes", () => {
    const { rerender } = render(<Badge variant="solid">Solid content</Badge>);
    expect(screen.getByText("Solid content")).toHaveClass("brutal-badge--solid");

    rerender(<Badge variant="soft">Soft content</Badge>);
    expect(screen.getByText("Soft content")).toHaveClass("brutal-badge--soft");

    rerender(<Badge variant="outline">Outline content</Badge>);
    expect(screen.getByText("Outline content")).toHaveClass("brutal-badge--outline");
  });

  it("applies tone classes", () => {
    render(<Badge tone="danger">Danger content</Badge>);
    expect(screen.getByText("Danger content")).toHaveClass("brutal-badge--danger");
  });

  it("applies size variant classes", () => {
    const { rerender } = render(<Badge size="sm">Sm content</Badge>);
    expect(screen.getByText("Sm content")).toHaveClass("brutal-badge--sm");

    rerender(<Badge size="md">Md content</Badge>);
    expect(screen.getByText("Md content")).toHaveClass("brutal-badge--md");

    rerender(<Badge size="lg">Lg content</Badge>);
    expect(screen.getByText("Lg content")).toHaveClass("brutal-badge--lg");
  });

  it("merges custom className", () => {
    render(<Badge className="custom-class">Custom content</Badge>);
    const element = screen.getByText("Custom content");
    expect(element).toHaveClass("custom-class", "brutal-badge");
  });

  it("forwards ref correctly", () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<Badge ref={ref}>Ref test</Badge>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
```

- [ ] **Step 2: Create tests/components/Button.spec.tsx**

```tsx
import { render, screen } from "@testing-library/react";
import { Button } from "../../src/components/Button.js";

describe("Button (brutalist)", () => {
  it("applies base class and renders children", () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toHaveClass("brutal-btn", "brutal-btn--primary", "brutal-btn--md");
  });

  it("supports variant and size modifiers", () => {
    render(
      <Button variant="secondary" size="lg">
        Secondary
      </Button>
    );
    const button = screen.getByRole("button", { name: /secondary/i });
    expect(button).toHaveClass("brutal-btn--secondary", "brutal-btn--lg");
  });

  it("marks loading buttons busy and disabled", () => {
    render(<Button loading>Saving</Button>);
    const button = screen.getByRole("button", { name: /saving/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("merges custom className", () => {
    render(
      <Button className="custom-class" size="sm">
        Custom
      </Button>
    );
    const button = screen.getByRole("button", { name: /custom/i });
    expect(button).toHaveClass("custom-class", "brutal-btn--sm");
  });
});
```

- [ ] **Step 3: Create tests/components/Toggle.spec.tsx**

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { Toggle } from "../../src/components/Toggle.js";

describe("Toggle (brutalist)", () => {
  it("renders with button role and default unpressed state", () => {
    render(<Toggle aria-label="Airplane mode" />);
    const toggle = screen.getByRole("button", { name: /airplane mode/i });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });

  it("toggles value in uncontrolled mode when clicked", () => {
    const onPressedChange = vi.fn();
    render(
      <Toggle
        aria-label="Notifications"
        defaultPressed={false}
        onPressedChange={onPressedChange}
      />
    );
    const toggle = screen.getByRole("button", { name: /notifications/i });

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(onPressedChange).toHaveBeenCalledWith(true);

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(onPressedChange).toHaveBeenLastCalledWith(false);
  });

  it("supports controlled usage", () => {
    const onPressedChange = vi.fn();
    const { rerender } = render(
      <Toggle
        aria-label="Dark mode"
        pressed={false}
        onPressedChange={onPressedChange}
      />
    );
    const toggle = screen.getByRole("button", { name: /dark mode/i });

    fireEvent.click(toggle);
    expect(onPressedChange).toHaveBeenCalledWith(true);
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    rerender(
      <Toggle
        aria-label="Dark mode"
        pressed={true}
        onPressedChange={onPressedChange}
      />
    );
    expect(screen.getByRole("button", { name: /dark mode/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("responds to keyboard interaction", () => {
    const onPressedChange = vi.fn();
    render(
      <Toggle
        aria-label="Wi-Fi"
        defaultPressed={false}
        onPressedChange={onPressedChange}
      />
    );
    const toggle = screen.getByRole("button", { name: /wi-fi/i });
    toggle.focus();

    fireEvent.keyDown(toggle, { key: "Enter" });
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(onPressedChange).toHaveBeenCalledWith(true);
  });

  it("does not toggle when disabled", () => {
    const onPressedChange = vi.fn();
    render(
      <Toggle
        aria-label="Location"
        disabled
        defaultPressed={false}
        onPressedChange={onPressedChange}
      />
    );
    const toggle = screen.getByRole("button", { name: /location/i });

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(onPressedChange).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 4: Create tests/contract-adapter.spec.ts**

```typescript
import { describe, expect, it } from "vitest";
import { requiredContractNames } from "@design-system/contracts";
import { reactV18ContractAdapter } from "../src/contract-adapter.js";

describe("reactV18ContractAdapter (brutalist)", () => {
  it("exports every currently required contract implementation", () => {
    expect(Object.keys(reactV18ContractAdapter).sort()).toEqual([
      ...requiredContractNames,
    ].sort());
  });
});
```

- [ ] **Step 5: Run tests to confirm they FAIL (src files not created yet)**

```bash
cd /Users/neural/Code/node/react-component-library && pnpm --filter @design-system/brutalist-react-v18 test 2>&1 | tail -20
```

Expected: error about missing source modules (Badge.js, Button.js, Toggle.js, contract-adapter.js not found).

- [ ] **Step 6: Commit the failing tests**

```bash
git add designs/brutalist/react-v18/tests/
git commit -m "test(brutalist-react-v18): write failing contract tests"
```

---

## Task 3: Implement brutalist CSS styles

**Files:**
- Create: `designs/brutalist/react-v18/src/styles/badge.css`
- Create: `designs/brutalist/react-v18/src/styles/button.css`
- Create: `designs/brutalist/react-v18/src/styles/toggle.css`

These use `brutal-` prefix classes so they don't collide with `designs/default`'s `.badge`, `.btn`, `.toggle`.

- [ ] **Step 1: Create src/styles/badge.css**

```css
@layer components {
  .brutal-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5em;
    padding: var(--ds-space-2) var(--ds-space-4);
    border-radius: 0;
    border: 3px solid #000;
    background: #fff;
    color: #000;
    font-family: var(--ds-font-mono, monospace);
    font-weight: 700;
    box-shadow: 4px 4px 0 #000;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .brutal-badge--solid {
    background: #000;
    color: #fff;
  }

  .brutal-badge--soft {
    background: #f0f0f0;
    color: #000;
  }

  .brutal-badge--outline {
    background: transparent;
    color: #000;
  }

  .brutal-badge--danger {
    background: #e5484d;
    color: #fff;
    border-color: #000;
    box-shadow: 4px 4px 0 #7a0000;
  }

  .brutal-badge--success {
    background: #30a46c;
    color: #fff;
    border-color: #000;
    box-shadow: 4px 4px 0 #004d2c;
  }

  .brutal-badge--warning {
    background: #f76808;
    color: #fff;
    border-color: #000;
    box-shadow: 4px 4px 0 #7a2e00;
  }

  .brutal-badge--accent {
    background: var(--ds-color-accent, #3b5bdb);
    color: var(--ds-color-accent-contrast, #fff);
    border-color: #000;
    box-shadow: 4px 4px 0 #000;
  }

  .brutal-badge--neutral {
    background: #fff;
    color: #000;
  }

  .brutal-badge--sm {
    padding: var(--ds-space-1) var(--ds-space-3);
    font-size: var(--ds-text-sm, 0.75rem);
    box-shadow: 2px 2px 0 #000;
  }

  .brutal-badge--md {
    padding: var(--ds-space-2) var(--ds-space-4);
    font-size: var(--ds-text-md, 0.875rem);
  }

  .brutal-badge--lg {
    padding: var(--ds-space-3) var(--ds-space-6);
    font-size: var(--ds-text-lg, 1rem);
    box-shadow: 6px 6px 0 #000;
  }
}
```

- [ ] **Step 2: Create src/styles/button.css**

```css
@layer components {
  .brutal-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5em;
    padding: calc(var(--ds-space-2) + 2px) var(--ds-space-4);
    border-radius: 0;
    border: 3px solid #000;
    background: #fff;
    color: #000;
    font-family: var(--ds-font-mono, monospace);
    font-weight: 700;
    font-size: inherit;
    box-shadow: 4px 4px 0 #000;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    transition: transform 0.04s ease, box-shadow 0.04s ease;
  }

  .brutal-btn:hover:not(:disabled) {
    transform: translate(-2px, -2px);
    box-shadow: 6px 6px 0 #000;
  }

  .brutal-btn:active:not(:disabled) {
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0 #000;
  }

  .brutal-btn:disabled {
    cursor: not-allowed;
    opacity: 0.5;
    box-shadow: 2px 2px 0 #888;
    border-color: #888;
  }

  .brutal-btn--primary {
    background: #000;
    color: #fff;
    border-color: #000;
  }

  .brutal-btn--primary:hover:not(:disabled) {
    background: #222;
  }

  .brutal-btn--secondary {
    background: #fff;
    color: #000;
    border-color: #000;
  }

  .brutal-btn--ghost {
    background: transparent;
    color: #000;
    border-color: #000;
    box-shadow: none;
  }

  .brutal-btn--ghost:hover:not(:disabled) {
    background: #f0f0f0;
    box-shadow: 4px 4px 0 #000;
  }

  .brutal-btn--danger {
    background: #e5484d;
    color: #fff;
    border-color: #000;
    box-shadow: 4px 4px 0 #7a0000;
  }

  .brutal-btn--danger:hover:not(:disabled) {
    box-shadow: 6px 6px 0 #7a0000;
  }

  .brutal-btn--sm {
    padding: var(--ds-space-1) var(--ds-space-3);
    font-size: var(--ds-text-sm, 0.75rem);
    box-shadow: 2px 2px 0 #000;
  }

  .brutal-btn--md {
    font-size: var(--ds-text-md, 0.875rem);
  }

  .brutal-btn--lg {
    padding: var(--ds-space-3) var(--ds-space-6);
    font-size: var(--ds-text-lg, 1rem);
    box-shadow: 6px 6px 0 #000;
  }
}
```

- [ ] **Step 3: Create src/styles/toggle.css**

```css
@layer components {
  .brutal-toggle {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 28px;
    padding: 0;
    border: 3px solid #000;
    background: none;
    cursor: pointer;
    box-shadow: 3px 3px 0 #000;
    border-radius: 0;
    transition: box-shadow 0.04s ease, transform 0.04s ease;
  }

  .brutal-toggle:hover:not(.brutal-toggle--disabled) {
    transform: translate(-1px, -1px);
    box-shadow: 4px 4px 0 #000;
  }

  .brutal-toggle:focus-visible {
    outline: 3px solid #000;
    outline-offset: 3px;
  }

  .brutal-toggle--disabled {
    cursor: not-allowed;
    opacity: 0.45;
    box-shadow: 1px 1px 0 #888;
    border-color: #888;
  }

  .brutal-toggle__track {
    position: absolute;
    inset: 0;
    background: #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 3px;
  }

  .brutal-toggle--pressed .brutal-toggle__track {
    background: #000;
    justify-content: flex-end;
  }

  .brutal-toggle__thumb {
    width: 18px;
    height: 18px;
    background: #000;
    border: 2px solid #000;
  }

  .brutal-toggle--pressed .brutal-toggle__thumb {
    background: #fff;
    border-color: #fff;
  }
}
```

- [ ] **Step 4: Commit CSS**

```bash
git add designs/brutalist/react-v18/src/styles/
git commit -m "feat(brutalist-react-v18): add brutalist CSS styles (brutal- prefix)"
```

---

## Task 4: Implement the brutalist React components

**Files:**
- Create: `designs/brutalist/react-v18/src/components/Badge.tsx`
- Create: `designs/brutalist/react-v18/src/components/Button.tsx`
- Create: `designs/brutalist/react-v18/src/components/Toggle.tsx`

- [ ] **Step 1: Create src/components/Badge.tsx**

```tsx
import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import type { BadgeContract, ComponentSize } from "@design-system/contracts";
import clsx from "clsx";
import "../styles/badge.css";

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    BadgeContract {
  size?: ComponentSize;
}

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(function Badge(
  { variant = "solid", tone = "neutral", size = "md", className, ...rest },
  ref
) {
  return (
    <div
      ref={ref}
      className={clsx(
        "brutal-badge",
        `brutal-badge--${variant}`,
        `brutal-badge--${tone}`,
        `brutal-badge--${size}`,
        className
      )}
      {...rest}
    />
  );
});
```

- [ ] **Step 2: Create src/components/Button.tsx**

```tsx
import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import type { ButtonContract } from "@design-system/contracts";
import clsx from "clsx";
import "../styles/button.css";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & ButtonContract;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    disabled,
    className,
    ...rest
  },
  ref
) {
  return (
    <button
      ref={ref}
      className={clsx(
        "brutal-btn",
        `brutal-btn--${variant}`,
        `brutal-btn--${size}`,
        className
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    />
  );
});
```

- [ ] **Step 3: Create src/components/Toggle.tsx**

```tsx
import { forwardRef, useCallback, useEffect, useState } from "react";
import type {
  ButtonHTMLAttributes,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent
} from "react";
import type { ToggleContract } from "@design-system/contracts";
import clsx from "clsx";
import "../styles/toggle.css";

export type ToggleProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "type" | "onChange" | "value"
> &
  ToggleContract;

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(function Toggle(
  {
    pressed,
    defaultPressed = false,
    onPressedChange,
    disabled,
    className,
    onClick,
    onKeyDown,
    ...rest
  },
  ref
) {
  const isControlled = pressed !== undefined;
  const [internalPressed, setInternalPressed] = useState(defaultPressed);

  useEffect(() => {
    if (!isControlled) {
      setInternalPressed(defaultPressed);
    }
  }, [defaultPressed, isControlled]);

  const currentPressed = isControlled ? pressed! : internalPressed;

  const emitChange = useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setInternalPressed(next);
      }
      onPressedChange?.(next);
    },
    [isControlled, onPressedChange]
  );

  const handleToggle = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      if (disabled) {
        return;
      }
      emitChange(!currentPressed);
      onClick?.(event);
    },
    [currentPressed, disabled, emitChange, onClick]
  );

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>) => {
      if (disabled) {
        onKeyDown?.(event);
        return;
      }
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        emitChange(!currentPressed);
      }
      onKeyDown?.(event);
    },
    [currentPressed, disabled, emitChange, onKeyDown]
  );

  return (
    <button
      {...rest}
      ref={ref}
      type="button"
      aria-pressed={currentPressed}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      data-state={currentPressed ? "pressed" : "unpressed"}
      className={clsx(
        "brutal-toggle",
        currentPressed && "brutal-toggle--pressed",
        disabled && "brutal-toggle--disabled",
        className
      )}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
    >
      <span className="brutal-toggle__track" aria-hidden="true">
        <span className="brutal-toggle__thumb" />
      </span>
    </button>
  );
});
```

- [ ] **Step 4: Commit components**

```bash
git add designs/brutalist/react-v18/src/components/
git commit -m "feat(brutalist-react-v18): implement Badge, Button, Toggle components"
```

---

## Task 5: Add contract adapter and barrel export

**Files:**
- Create: `designs/brutalist/react-v18/src/contract-adapter.ts`
- Create: `designs/brutalist/react-v18/src/index.ts`

- [ ] **Step 1: Create src/contract-adapter.ts**

```typescript
import type { ComponentProps } from "react";
import type {
  AssertRequiredComponentProps,
  RequiredComponentAdapter,
} from "@design-system/contracts";
import { Badge } from "./components/Badge.js";
import { Button } from "./components/Button.js";
import { Toggle } from "./components/Toggle.js";

export const reactV18ContractAdapter = {
  badge: Badge,
  button: Button,
  toggle: Toggle,
} satisfies RequiredComponentAdapter;

export type ReactV18AdapterProps = {
  badge: ComponentProps<typeof Badge>;
  button: ComponentProps<typeof Button>;
  toggle: ComponentProps<typeof Toggle>;
};

export type ReactV18ContractConformance =
  AssertRequiredComponentProps<ReactV18AdapterProps>;
```

- [ ] **Step 2: Create src/index.ts**

```typescript
export { Badge } from "./components/Badge.js";
export { Button } from "./components/Button.js";
export { Toggle } from "./components/Toggle.js";
export { reactV18ContractAdapter } from "./contract-adapter.js";
export type {
  ReactV18AdapterProps,
  ReactV18ContractConformance
} from "./contract-adapter.js";
export type { BadgeProps } from "./components/Badge.js";
export type { ButtonProps } from "./components/Button.js";
export type { ToggleProps } from "./components/Toggle.js";
```

- [ ] **Step 3: Commit**

```bash
git add designs/brutalist/react-v18/src/contract-adapter.ts designs/brutalist/react-v18/src/index.ts
git commit -m "feat(brutalist-react-v18): add contract-adapter and barrel export"
```

---

## Task 6: Install deps and run tests — iterate until green

- [ ] **Step 1: Install workspace deps**

```bash
cd /Users/neural/Code/node/react-component-library && pnpm install
```

Expected: pnpm resolves `@design-system/brutalist-react-v18` in workspace.

- [ ] **Step 2: Build contracts (tests depend on it)**

```bash
cd /Users/neural/Code/node/react-component-library && pnpm --filter @design-system/contracts build
```

Expected: exits 0.

- [ ] **Step 3: Run brutalist tests**

```bash
cd /Users/neural/Code/node/react-component-library && pnpm --filter @design-system/brutalist-react-v18 test
```

Expected: all tests PASS (Badge, Button, Toggle, contract-adapter).

- [ ] **Step 4: Build the brutalist package**

```bash
cd /Users/neural/Code/node/react-component-library && pnpm --filter @design-system/brutalist-react-v18 build
```

Expected: exits 0, creates `designs/brutalist/react-v18/dist/`.

- [ ] **Step 5: Verify dist/index.d.ts exists**

```bash
ls -la /Users/neural/Code/node/react-component-library/designs/brutalist/react-v18/dist/index.d.ts
```

Expected: file present with non-zero size.

---

## Task 7: Wire the harness swap point

**Files:**
- Modify: `apps/tauri-harness/package.json`
- Create: `apps/tauri-harness/src/vite-env.d.ts`
- Modify: `apps/tauri-harness/src/ui/adapter.ts`
- Modify: `apps/tauri-harness/src/App.tsx`

- [ ] **Step 1: Add brutalist dep and update build/typecheck scripts in apps/tauri-harness/package.json**

Replace the `"scripts"` and `"dependencies"` sections. The build script must build both designs before running vite:

```json
{
  "name": "tauri-harness",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "pnpm --filter @design-system/default-react-v18 build && pnpm --filter @design-system/brutalist-react-v18 build && pnpm --filter @design-system/design-tokens build && tsc -b && vite build",
    "typecheck": "pnpm --filter @design-system/default-react-v18 build && pnpm --filter @design-system/brutalist-react-v18 build && pnpm --filter @design-system/design-tokens build && tsc --noEmit",
    "lint": "eslint \"src/**/*.{ts,tsx}\"",
    "tauri": "tauri"
  },
  "dependencies": {
    "@design-system/contracts": "workspace:^",
    "@design-system/design-tokens": "workspace:^",
    "@design-system/default-react-v18": "workspace:^",
    "@design-system/brutalist-react-v18": "workspace:^",
    "@tauri-apps/api": "^2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.2",
    "@vitejs/plugin-react": "^4.7.0",
    "eslint": "^9.39.4",
    "typescript": "^5.9.2",
    "vite": "^6.4.3"
  }
}
```

- [ ] **Step 2: Create src/vite-env.d.ts for import.meta.env types**

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_UI_DESIGN?: "default" | "brutalist";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

- [ ] **Step 3: Rewrite src/ui/adapter.ts as the single design swap point**

```typescript
// DESIGN SWAP POINT
// To swap designs at build time, set the VITE_UI_DESIGN env var:
//   VITE_UI_DESIGN=brutalist pnpm --filter tauri-harness build
// The canonical swap is just changing one package specifier or env var —
// the adapter contract guarantees both designs are structurally identical.
import type { RequiredComponentContracts } from "@design-system/contracts";
import { reactV18ContractAdapter as defaultAdapter } from "@design-system/default-react-v18";
import { reactV18ContractAdapter as brutalistAdapter } from "@design-system/brutalist-react-v18";
// Import component CSS for each design so the active design's styles are bundled.
// Vite tree-shakes unused imports when building, but both are safe to import.
import "@design-system/default-react-v18";
import "@design-system/brutalist-react-v18";

const design = (import.meta.env.VITE_UI_DESIGN ?? "default") as "default" | "brutalist";

export const activeDesign: "default" | "brutalist" = design;

export const ui = (
  design === "brutalist" ? brutalistAdapter : defaultAdapter
) satisfies Record<keyof RequiredComponentContracts, unknown>;
```

- [ ] **Step 4: Update src/App.tsx to show the active design label**

```tsx
import "@design-system/design-tokens/generated/design-tokens.css";
import { useState } from "react";
import { ThemeProvider } from "@design-system/default-react-v18";
import { ui, activeDesign } from "./ui/adapter.js";

const { badge: Badge, button: Button, toggle: Toggle } = ui;

export function App() {
  const [pressed, setPressed] = useState(false);

  return (
    <ThemeProvider>
      <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
        <h1>Design System Harness</h1>
        <p style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "#666", marginTop: 0 }}>
          design: <strong>{activeDesign}</strong>
        </p>

        <section style={{ marginBottom: "2rem" }}>
          <h2>Button</h2>
          <Button variant="primary">Primary</Button>{" "}
          <Button variant="secondary">Secondary</Button>{" "}
          <Button variant="ghost">Ghost</Button>{" "}
          <Button variant="danger">Danger</Button>
        </section>

        <section style={{ marginBottom: "2rem" }}>
          <h2>Badge</h2>
          <Badge variant="solid" tone="neutral">
            Neutral
          </Badge>{" "}
          <Badge variant="solid" tone="accent">
            Accent
          </Badge>{" "}
          <Badge variant="outline" tone="success">
            Success
          </Badge>{" "}
          <Badge variant="soft" tone="danger">
            Danger
          </Badge>
        </section>

        <section style={{ marginBottom: "2rem" }}>
          <h2>Toggle</h2>
          <Toggle pressed={pressed} onPressedChange={setPressed}>
            {pressed ? "ON" : "OFF"}
          </Toggle>
        </section>
      </main>
    </ThemeProvider>
  );
}
```

- [ ] **Step 5: Run pnpm install to link new dep**

```bash
cd /Users/neural/Code/node/react-component-library && pnpm install
```

- [ ] **Step 6: Commit harness changes**

```bash
git add apps/tauri-harness/package.json apps/tauri-harness/src/vite-env.d.ts apps/tauri-harness/src/ui/adapter.ts apps/tauri-harness/src/App.tsx
git commit -m "feat(tauri-harness): swap designs via VITE_UI_DESIGN env var"
```

---

## Task 8: Verify all build targets pass

- [ ] **Step 1: Typecheck the harness**

```bash
cd /Users/neural/Code/node/react-component-library && pnpm --filter tauri-harness typecheck
```

Expected: exits 0 (no TypeScript errors).

- [ ] **Step 2: Build harness with default design**

```bash
cd /Users/neural/Code/node/react-component-library && pnpm --filter tauri-harness build
```

Expected: exits 0. Proves default design swap path compiles.

- [ ] **Step 3: Build harness with brutalist design**

```bash
cd /Users/neural/Code/node/react-component-library && VITE_UI_DESIGN=brutalist pnpm --filter tauri-harness build
```

Expected: exits 0. Proves brutalist design swap path compiles.

- [ ] **Step 4: Check cargo**

```bash
cargo check --manifest-path /Users/neural/Code/node/react-component-library/apps/tauri-harness/src-tauri/Cargo.toml
```

Expected: exits 0 (Rust backend unaffected).

- [ ] **Step 5: Run full QA**

```bash
cd /Users/neural/Code/node/react-component-library && pnpm qa
```

Expected: all checks pass. If only the Storybook Vite re-optimization flake fails, rerun:
```bash
cd /Users/neural/Code/node/react-component-library && pnpm storybook:test && pnpm qa
```

Any other failure → fix before committing.

---

## Task 9: Final commit

- [ ] **Step 1: Verify git status is clean**

```bash
cd /Users/neural/Code/node/react-component-library && git status
```

- [ ] **Step 2: Confirm branch is feat/design-swap-demo**

```bash
git branch --show-current
```

Expected: `feat/design-swap-demo`

- [ ] **Step 3: Summary report**

Collect and report:
- Commit SHAs (from `git log --oneline -6`)
- Output of `ls designs/brutalist/react-v18/dist/index.d.ts`
- Confirmation that both `pnpm --filter tauri-harness build` runs (default + VITE_UI_DESIGN=brutalist) succeeded
- Final `pnpm qa` result
- Any deviations from the spec
