# Plan 1: Token Prefix + Semantic Tokens

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename all CSS custom properties from unscoped names (`--bg`, `--brand`) to the `--ds-*` prefix, add missing semantic tokens (surfaces, motion, z-index), and update all consumer CSS in `react-v18` to match.

**Architecture:** The change lives entirely in `packages/design-tokens/src/token-data.ts` (source of truth) and the React CSS files that consume the generated tokens. The test file drives the rename — update tests first, watch them fail, then fix the source.

**Tech Stack:** TypeScript, Vitest, vanilla CSS

---

## Token Rename Map

| Old CSS name | New CSS name |
|---|---|
| `--brand-hue` | `--ds-color-brand-hue` |
| `--brand-sat` | `--ds-color-brand-sat` |
| `--brand` | `--ds-color-brand` |
| `--brand-600` | `--ds-color-brand-600` |
| `--brand-700` | `--ds-color-brand-700` |
| `--bg` | `--ds-color-bg` |
| `--fg` | `--ds-color-fg` |
| `--muted` | `--ds-color-text-muted` |
| `--surface` | `--ds-color-surface` |
| `--border` | `--ds-color-border` |
| `--accent` | `--ds-color-accent` |
| `--accent-contrast` | `--ds-color-accent-contrast` |
| `--focus-ring` | `--ds-focus-ring` |
| `--font-sans` | `--ds-font-sans` |
| `--font-mono` | `--ds-font-mono` |
| `--text-xs` | `--ds-text-xs` |
| `--text-sm` | `--ds-text-sm` |
| `--text-md` | `--ds-text-md` |
| `--text-lg` | `--ds-text-lg` |
| `--text-xl` | `--ds-text-xl` |
| `--text-2xl` | `--ds-text-2xl` |
| `--space-1` | `--ds-space-1` |
| `--space-2` | `--ds-space-2` |
| `--space-3` | `--ds-space-3` |
| `--space-4` | `--ds-space-4` |
| `--space-6` | `--ds-space-6` |
| `--space-8` | `--ds-space-8` |
| `--radius-sm` | `--ds-radius-sm` |
| `--radius-md` | `--ds-radius-md` |
| `--radius-lg` | `--ds-radius-lg` |
| `--shadow-sm` | `--ds-shadow-sm` |
| `--shadow-md` | `--ds-shadow-md` |

New tokens added: `--ds-color-surface-raised`, `--ds-color-overlay`, `--ds-color-text-subtle`, `--ds-color-border-focus`, plus new `motion` and `z` token categories.

---

## File Map

| File | Action |
|---|---|
| `packages/design-tokens/src/token-data.ts` | Modify — rename all keys, add new tokens + categories |
| `packages/design-tokens/tests/build.spec.ts` | Modify — update expected token names |
| `packages/component-libraries/react-v18/src/design-system/base.css` | Modify — update `var(--X)` references |
| `packages/component-libraries/react-v18/src/design-system/components/button.css` | Modify |
| `packages/component-libraries/react-v18/src/design-system/components/badge.css` | Modify |
| `packages/component-libraries/react-v18/src/design-system/components/card.css` | Modify |
| `packages/component-libraries/react-v18/src/design-system/components/input.css` | Modify |
| `packages/component-libraries/react-v18/src/design-system/components/modal.css` | Modify |
| `packages/component-libraries/react-v18/src/design-system/components/toggle.css` | Modify |

---

## Task 1: Update tests to expect `--ds-*` prefix (they will fail)

**Files:**
- Modify: `packages/design-tokens/tests/build.spec.ts`

- [ ] **Step 1: Replace the test file with updated expectations**

```typescript
// packages/design-tokens/tests/build.spec.ts
import { afterEach, describe, expect, it } from "vitest";
import { buildTokenOutputs, writeGeneratedFiles } from "../src/index.js";
import { readFile, rm, stat } from "node:fs/promises";
import { join } from "node:path";

const OUTPUT_DIR = join(process.cwd(), "packages", "design-tokens", "generated-test");

describe("design token generation", () => {
  it("produces CSS with --ds-* prefix for all tokens", () => {
    const outputs = buildTokenOutputs();

    expect(outputs.css).toContain("@layer tokens");
    expect(outputs.css).toContain(":root {\n    --ds-color-brand-hue: 222;");
    expect(outputs.css).toContain("[data-theme=\"dark\"]");
    expect(outputs.css).toContain("--ds-color-bg: #0c0f14;");
    expect(outputs.css).toContain("[data-theme=\"rose\"]");
    expect(outputs.css).toContain("--ds-font-sans: ui-serif");
  });

  it("includes new semantic tokens", () => {
    const outputs = buildTokenOutputs();

    expect(outputs.css).toContain("--ds-color-surface-raised:");
    expect(outputs.css).toContain("--ds-color-overlay:");
    expect(outputs.css).toContain("--ds-color-text-subtle:");
    expect(outputs.css).toContain("--ds-color-border-focus:");
    expect(outputs.css).toContain("--ds-duration-fast:");
    expect(outputs.css).toContain("--ds-z-modal:");
  });

  it("exposes tokens and themes in JSON form", () => {
    const outputs = buildTokenOutputs();

    expect(outputs.json.tokens.color["ds-color-bg"]).toBe("#ffffff");
    expect(outputs.json.tokens.typography["ds-text-md"]).toBe("16px");
    expect(outputs.json.themes.dark.color["ds-color-bg"]).toBe("#0c0f14");
  });

  it("writes generated assets to disk", async () => {
    await writeGeneratedFiles(OUTPUT_DIR);

    const cssPath = join(OUTPUT_DIR, "design-tokens.css");
    const jsonPath = join(OUTPUT_DIR, "design-tokens.json");

    expect(await fileExists(cssPath)).toBe(true);
    expect(await fileExists(jsonPath)).toBe(true);

    const css = await readFile(cssPath, "utf8");
    const json = JSON.parse(await readFile(jsonPath, "utf8"));

    expect(css).toContain("@layer tokens");
    expect(json.tokens.color["ds-color-accent"]).toBeDefined();
  });
});

async function fileExists(path: string) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

afterEach(async () => {
  await rm(OUTPUT_DIR, { recursive: true, force: true });
});
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
cd packages/design-tokens && pnpm test
```

Expected: FAIL — `expected '    --brand-hue: 222;' to contain '--ds-color-brand-hue: 222;'`

---

## Task 2: Rename tokens and add new categories in token-data.ts

**Files:**
- Modify: `packages/design-tokens/src/token-data.ts`

- [ ] **Step 1: Replace token-data.ts entirely**

```typescript
// packages/design-tokens/src/token-data.ts
export type TokenCategories = {
  color:      Record<string, string>;
  typography: Record<string, string>;
  space:      Record<string, string>;
  radius:     Record<string, string>;
  shadow:     Record<string, string>;
  motion:     Record<string, string>;
  z:          Record<string, string>;
};

export type ThemeDefinition = {
  name:        string;
  selector:    string;
  description: string;
  isDefault?:  boolean;
  overrides:   Partial<TokenCategories>;
};

const sansStack  = `ui-sans-serif, system-ui, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji`;
const monoStack  = `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace`;
const serifStack = `ui-serif, Georgia, Cambria, "Times New Roman", Times, serif`;

export const baseTokens: TokenCategories = {
  color: {
    "ds-color-brand-hue": "222",
    "ds-color-brand-sat": "85%",
    "ds-color-brand":     "hsl(var(--ds-color-brand-hue) var(--ds-color-brand-sat) 50%)",
    "ds-color-brand-600": "hsl(var(--ds-color-brand-hue) var(--ds-color-brand-sat) 40%)",
    "ds-color-brand-700": "hsl(var(--ds-color-brand-hue) var(--ds-color-brand-sat) 32%)",

    "ds-color-bg":              "#ffffff",
    "ds-color-fg":              "#0b0c0e",
    "ds-color-surface":         "#f5f7fb",
    "ds-color-surface-raised":  "#edf0f5",
    "ds-color-overlay":         "#e0e4ec",

    "ds-color-text-muted":  "#6b7280",
    "ds-color-text-subtle": "#9ca3af",

    "ds-color-border":       "#e5e7eb",
    "ds-color-border-focus": "var(--ds-color-accent)",

    "ds-color-accent":          "var(--ds-color-brand)",
    "ds-color-accent-contrast": "#ffffff",

    "ds-focus-ring": "2px solid var(--ds-color-brand)"
  },
  typography: {
    "ds-font-sans": sansStack,
    "ds-font-mono": monoStack,
    "ds-text-xs":   "12px",
    "ds-text-sm":   "14px",
    "ds-text-md":   "16px",
    "ds-text-lg":   "18px",
    "ds-text-xl":   "20px",
    "ds-text-2xl":  "24px"
  },
  space: {
    "ds-space-1": "4px",
    "ds-space-2": "8px",
    "ds-space-3": "12px",
    "ds-space-4": "16px",
    "ds-space-6": "24px",
    "ds-space-8": "32px"
  },
  radius: {
    "ds-radius-sm": "6px",
    "ds-radius-md": "10px",
    "ds-radius-lg": "14px"
  },
  shadow: {
    "ds-shadow-sm": "0 1px 2px rgba(0,0,0,.06)",
    "ds-shadow-md": "0 4px 12px rgba(0,0,0,.08)"
  },
  motion: {
    "ds-duration-fast": "100ms",
    "ds-duration-base": "200ms",
    "ds-duration-slow": "350ms",
    "ds-ease":          "cubic-bezier(0.4, 0, 0.2, 1)"
  },
  z: {
    "ds-z-dropdown": "100",
    "ds-z-sticky":   "200",
    "ds-z-overlay":  "300",
    "ds-z-modal":    "400",
    "ds-z-toast":    "500"
  }
};

export const themeDefinitions: ThemeDefinition[] = [
  {
    name:        "light",
    selector:    ":root",
    description: "Default light theme",
    isDefault:   true,
    overrides:   {}
  },
  {
    name:        "dark",
    selector:    "[data-theme=\"dark\"]",
    description: "Dark mode palette",
    overrides: {
      color: {
        "ds-color-bg":             "#0c0f14",
        "ds-color-fg":             "#e8eaee",
        "ds-color-text-muted":     "#a8b0bd",
        "ds-color-text-subtle":    "#6b7280",
        "ds-color-surface":        "#121621",
        "ds-color-surface-raised": "#1a1f2e",
        "ds-color-overlay":        "#1f2633",
        "ds-color-border":         "#1f2633",
        "ds-color-accent":         "hsl(var(--ds-color-brand-hue) var(--ds-color-brand-sat) 62%)",
        "ds-color-accent-contrast":"#0a0b0e",
        "ds-focus-ring":           "2px solid var(--ds-color-accent)"
      },
      shadow: {
        "ds-shadow-sm": "0 1px 2px rgba(0,0,0,.5)",
        "ds-shadow-md": "0 6px 18px rgba(0,0,0,.55)"
      }
    }
  },
  {
    name:        "rose",
    selector:    "[data-theme=\"rose\"]",
    description: "Rose brand accent",
    overrides: {
      color: {
        "ds-color-brand-hue": "340",
        "ds-color-brand-sat": "70%",
        "ds-color-accent":    "hsl(var(--ds-color-brand-hue) var(--ds-color-brand-sat) 55%)",
        "ds-color-accent-contrast": "#ffffff"
      }
    }
  },
  {
    name:        "serif",
    selector:    "[data-theme=\"serif\"]",
    description: "Serif typography option",
    overrides: {
      typography: {
        "ds-font-sans": serifStack
      }
    }
  }
];
```

- [ ] **Step 2: Update the CATEGORY_ORDER in index.ts to include the new categories**

Open `packages/design-tokens/src/index.ts` and update `CATEGORY_ORDER`:

```typescript
const CATEGORY_ORDER: (keyof TokenCategories)[] = [
  "color",
  "typography",
  "space",
  "radius",
  "shadow",
  "motion",
  "z"
];
```

Also update `mergeTokenCategories` to handle the new categories:

```typescript
function mergeTokenCategories(
  base: TokenCategories,
  overrides: Partial<TokenCategories> = {}
): TokenCategories {
  return {
    color:      { ...base.color,      ...(overrides.color      ?? {}) },
    typography: { ...base.typography, ...(overrides.typography ?? {}) },
    space:      { ...base.space,      ...(overrides.space      ?? {}) },
    radius:     { ...base.radius,     ...(overrides.radius     ?? {}) },
    shadow:     { ...base.shadow,     ...(overrides.shadow     ?? {}) },
    motion:     { ...base.motion,     ...(overrides.motion     ?? {}) },
    z:          { ...base.z,          ...(overrides.z          ?? {}) }
  };
}
```

- [ ] **Step 3: Run token tests — confirm they pass**

```bash
cd packages/design-tokens && pnpm test
```

Expected: 4 tests pass

- [ ] **Step 4: Commit**

```bash
git add packages/design-tokens/
git commit -m "feat(tokens): rename all tokens to --ds-* prefix, add motion and z categories"
```

---

## Task 3: Update React base.css

**Files:**
- Modify: `packages/component-libraries/react-v18/src/design-system/base.css`

- [ ] **Step 1: Replace base.css with updated token references**

```css
/* packages/component-libraries/react-v18/src/design-system/base.css */
@layer reset, base;

@layer reset {
  *, *::before, *::after {
    box-sizing: border-box;
  }

  html, body, #root {
    height: 100%;
  }

  body {
    margin: 0;
  }
}

@layer base {
  :root {
    color-scheme: light dark;

    /* Confetti color palette */
    --confetti-color-1: #ff6b6b;
    --confetti-color-2: #4ecdc4;
    --confetti-color-3: #45b7d1;
    --confetti-color-4: #f9ca24;
    --confetti-color-5: #f0932b;
    --confetti-color-6: #eb4d4b;
    --confetti-color-7: #6c5ce7;
    --confetti-color-8: #a29bfe;
  }

  body {
    background: var(--ds-color-bg);
    color: var(--ds-color-fg);
    font-family: var(--ds-font-sans);
    font-size: var(--ds-text-md);
    line-height: 1.5;
  }

  a {
    color: var(--ds-color-accent);
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  :focus-visible {
    outline: var(--ds-focus-ring);
    outline-offset: 2px;
  }
}
```

---

## Task 4: Update React component CSS files

**Files:**
- Modify: `packages/component-libraries/react-v18/src/design-system/components/button.css`
- Modify: `packages/component-libraries/react-v18/src/design-system/components/badge.css`
- Modify: `packages/component-libraries/react-v18/src/design-system/components/card.css`
- Modify: `packages/component-libraries/react-v18/src/design-system/components/input.css`
- Modify: `packages/component-libraries/react-v18/src/design-system/components/modal.css`
- Modify: `packages/component-libraries/react-v18/src/design-system/components/toggle.css`

- [ ] **Step 1: Replace button.css**

```css
/* packages/component-libraries/react-v18/src/design-system/components/button.css */
@layer components {
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5em;
    padding: calc(var(--ds-space-2) + 2px) var(--ds-space-4);
    border-radius: var(--ds-radius-md);
    border: 1px solid var(--ds-color-border);
    background: var(--ds-color-surface);
    color: var(--ds-color-fg);
    box-shadow: var(--ds-shadow-sm);
    cursor: pointer;
    transition: transform 0.04s ease, box-shadow var(--ds-duration-base) var(--ds-ease),
                background var(--ds-duration-base) var(--ds-ease), color var(--ds-duration-base) var(--ds-ease);
  }

  .btn:hover  { box-shadow: var(--ds-shadow-md); }
  .btn:active { transform: translateY(1px); }

  .btn--primary {
    background: var(--ds-color-accent);
    border-color: color-mix(in oklab, var(--ds-color-accent), black 12%);
    color: var(--ds-color-accent-contrast);
  }

  .btn--ghost {
    background: transparent;
    border-color: var(--ds-color-border);
  }

  .btn--danger {
    --danger: #e5484d;
    --danger-contrast: #ffffff;
    background: var(--danger);
    color: var(--danger-contrast);
    border-color: color-mix(in oklab, var(--danger), black 15%);
  }

  .btn--sm { padding: var(--ds-space-1) var(--ds-space-3); font-size: var(--ds-text-sm); }
  .btn--lg { padding: var(--ds-space-3) var(--ds-space-6); font-size: var(--ds-text-lg); }
}
```

- [ ] **Step 2: Replace badge.css**

```css
/* packages/component-libraries/react-v18/src/design-system/components/badge.css */
@layer components {
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5em;
    padding: var(--ds-space-2) var(--ds-space-4);
    border-radius: var(--ds-radius-md);
    border: 1px solid var(--ds-color-border);
    background: var(--ds-color-surface);
    color: var(--ds-color-fg);
    box-shadow: var(--ds-shadow-sm);
  }

  .badge:hover  { box-shadow: var(--ds-shadow-md); }
  .badge:active { transform: translateY(1px); }

  .badge--primary {
    background: var(--ds-color-accent);
    border-color: color-mix(in oklab, var(--ds-color-accent), black 12%);
    color: var(--ds-color-accent-contrast);
  }

  .badge--secondary {
    background: var(--ds-color-surface);
    border-color: var(--ds-color-border);
    color: var(--ds-color-fg);
  }

  .badge--ghost {
    background: transparent;
    border-color: transparent;
    color: var(--ds-color-fg);
  }

  .badge--danger {
    --danger: #e5484d;
    --danger-contrast: #ffffff;
    background: var(--danger);
    color: var(--danger-contrast);
    border-color: color-mix(in oklab, var(--danger), black 15%);
  }

  .badge--sm { padding: var(--ds-space-1) var(--ds-space-3); font-size: var(--ds-text-sm); }
  .badge--md { padding: var(--ds-space-2) var(--ds-space-4); font-size: var(--ds-text-md); }
  .badge--lg { padding: var(--ds-space-3) var(--ds-space-6); font-size: var(--ds-text-lg); }
}
```

- [ ] **Step 3: Replace card.css**

```css
/* packages/component-libraries/react-v18/src/design-system/components/card.css */
@layer components {
  .card {
    background: var(--ds-color-surface);
    color: var(--ds-color-fg);
    border: 1px solid var(--ds-color-border);
    border-radius: var(--ds-radius-lg);
    box-shadow: var(--ds-shadow-sm);
    padding: var(--ds-space-4);
  }

  .card--interactive { cursor: pointer; }
  .card--interactive:hover { box-shadow: var(--ds-shadow-md); }
}
```

- [ ] **Step 4: Replace input.css**

```css
/* packages/component-libraries/react-v18/src/design-system/components/input.css */
@layer components {
  .input {
    width: 100%;
    padding: var(--ds-space-2) var(--ds-space-3);
    background: var(--ds-color-surface);
    color: var(--ds-color-fg);
    border: 1px solid var(--ds-color-border);
    border-radius: var(--ds-radius-sm);
    outline: none;
  }

  .input::placeholder { color: var(--ds-color-text-muted); }

  .input:focus {
    border-color: var(--ds-color-accent);
    box-shadow: 0 0 0 3px color-mix(in oklab, var(--ds-color-accent), transparent 80%);
  }
}
```

- [ ] **Step 5: Replace modal.css**

```css
/* packages/component-libraries/react-v18/src/design-system/components/modal.css */
@layer components {
  .modal-overlay {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--ds-space-8) var(--ds-space-4);
    background-color: color-mix(in oklab, var(--ds-color-bg), transparent 50%);
    backdrop-filter: blur(4px);
    z-index: var(--ds-z-modal);
  }

  .modal {
    width: min(600px, 100%);
    background: var(--ds-color-surface);
    color: var(--ds-color-fg);
    border: 1px solid var(--ds-color-border);
    border-radius: var(--ds-radius-lg);
    box-shadow: var(--ds-shadow-md);
    padding: var(--ds-space-6);
    outline: none;
    display: flex;
    flex-direction: column;
    gap: var(--ds-space-4);
    animation: modal-in 160ms var(--ds-ease);
  }

  .modal__title {
    font-size: var(--ds-text-xl);
    font-weight: 600;
    margin: 0;
  }

  .modal__footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--ds-space-3);
  }

  @keyframes modal-in {
    from { opacity: 0; transform: translateY(12px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
}
```

- [ ] **Step 6: Replace toggle.css**

```css
/* packages/component-libraries/react-v18/src/design-system/components/toggle.css */
@layer components {
  .toggle {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 24px;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    transition: opacity var(--ds-duration-base) var(--ds-ease);
  }

  .toggle:focus-visible {
    outline: 2px solid color-mix(in oklab, var(--ds-color-accent), transparent 30%);
    outline-offset: 2px;
  }

  .toggle--disabled { cursor: not-allowed; opacity: 0.5; }

  .toggle__track {
    position: absolute;
    inset: 0;
    border-radius: 9999px;
    background: color-mix(in oklab, var(--ds-color-text-muted), transparent 40%);
    border: 1px solid color-mix(in oklab, var(--ds-color-border), transparent 40%);
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 2px;
    transition: background var(--ds-duration-base) var(--ds-ease), border var(--ds-duration-base) var(--ds-ease);
  }

  .toggle--checked .toggle__track {
    background: var(--ds-color-accent);
    border-color: color-mix(in oklab, var(--ds-color-accent), black 18%);
    justify-content: flex-end;
  }

  .toggle__thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--ds-color-surface);
    box-shadow: var(--ds-shadow-sm);
    transition: background var(--ds-duration-base) var(--ds-ease), box-shadow var(--ds-duration-base) var(--ds-ease);
  }

  .toggle--checked .toggle__thumb { background: var(--ds-color-accent-contrast); }
}
```

- [ ] **Step 7: Run the full test suite**

```bash
pnpm test
```

Expected: all 39 tests pass (token tests + React component tests)

- [ ] **Step 8: Commit**

```bash
git add packages/component-libraries/react-v18/src/design-system/
git commit -m "feat(react-v18): update component CSS to --ds-* token prefix"
```
