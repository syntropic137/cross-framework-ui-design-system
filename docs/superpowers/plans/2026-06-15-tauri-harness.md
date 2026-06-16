# Tauri Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold `apps/tauri-harness` — a Tauri v2 + React 18 + Vite app that imports `@design-system/{contracts,react-v18,design-tokens}` via a contract adapter and renders Badge/Button/Toggle, proving type-safe clean import.

**Architecture:** The frontend is a standard Vite+React 18+TS SPA. An app-owned swap-module (`src/ui/adapter.ts`) re-exports `reactV18ContractAdapter` typed against `RequiredComponentContracts` — this is the single seam for swapping frameworks later. `cargo tauri init --ci` lays down `src-tauri/` without interactive prompts. Acceptance is typecheck + vite build + `cargo check` (not a full native bundle).

**Tech Stack:** pnpm workspaces, Vite 6, React 18, TypeScript 5.9, `@vitejs/plugin-react`, Tauri v2 CLI (`cargo tauri`), `@tauri-apps/api@^2`, `@design-system/{contracts,react-v18,design-tokens}` workspace packages.

---

### Task 1: Extend pnpm workspace to include `apps/*`

**Files:**
- Modify: `pnpm-workspace.yaml`

- [ ] **Step 1: Add `apps/*` to packages list**

Current content:
```yaml
packages:
  - "packages/*"
  - "packages/*/*"
  - "packages/*/*/*"
```

New content — add `apps/*`:
```yaml
packages:
  - "packages/*"
  - "packages/*/*"
  - "packages/*/*/*"
  - "apps/*"
```

- [ ] **Step 2: Verify the file looks correct**

Run: `cat pnpm-workspace.yaml`
Expected: four entries including `"apps/*"`.

- [ ] **Step 3: Commit**

```bash
git add pnpm-workspace.yaml
git commit -m "chore(workspace): add apps/* to pnpm workspace"
```

---

### Task 2: Create `apps/tauri-harness` directory and `package.json`

**Files:**
- Create: `apps/tauri-harness/package.json`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p apps/tauri-harness/src/ui
```

- [ ] **Step 2: Write `package.json`**

```json
{
  "name": "tauri-harness",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "typecheck": "tsc --noEmit",
    "lint": "eslint \"src/**/*.{ts,tsx}\"",
    "tauri": "tauri"
  },
  "dependencies": {
    "@design-system/contracts": "workspace:^",
    "@design-system/design-tokens": "workspace:^",
    "@design-system/react-v18": "workspace:^",
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

---

### Task 3: Write TypeScript configuration

**Files:**
- Create: `apps/tauri-harness/tsconfig.json`
- Create: `apps/tauri-harness/tsconfig.node.json`

- [ ] **Step 1: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "verbatimModuleSyntax": true,
    "resolveJsonModule": true,
    "noEmit": true,
    "allowImportingTsExtensions": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "src-tauri"]
}
```

- [ ] **Step 2: Write `tsconfig.node.json`** (for vite.config.ts)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["vite.config.ts"]
}
```

---

### Task 4: Write `vite.config.ts` and `index.html`

**Files:**
- Create: `apps/tauri-harness/vite.config.ts`
- Create: `apps/tauri-harness/index.html`

- [ ] **Step 1: Write `vite.config.ts`**

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
  },
  build: {
    outDir: "dist",
  },
});
```

- [ ] **Step 2: Write `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Design System Harness</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

### Task 5: Write the adapter swap-module and React source files

**Files:**
- Create: `apps/tauri-harness/src/ui/adapter.ts`
- Create: `apps/tauri-harness/src/App.tsx`
- Create: `apps/tauri-harness/src/main.tsx`

- [ ] **Step 1: Write `src/ui/adapter.ts`** — the app-owned swap module

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

- [ ] **Step 2: Write `src/App.tsx`**

```tsx
import "@design-system/design-tokens/generated/design-tokens.css";
import { useState } from "react";
import { ThemeProvider } from "@design-system/react-v18";
import { ui } from "./ui/adapter.js";

const { badge: Badge, button: Button, toggle: Toggle } = ui;

export function App() {
  const [pressed, setPressed] = useState(false);

  return (
    <ThemeProvider>
      <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
        <h1>Design System Harness</h1>

        <section style={{ marginBottom: "2rem" }}>
          <h2>Button</h2>
          <Button variant="primary">Primary</Button>{" "}
          <Button variant="secondary">Secondary</Button>{" "}
          <Button variant="ghost">Ghost</Button>{" "}
          <Button variant="danger">Danger</Button>
        </section>

        <section style={{ marginBottom: "2rem" }}>
          <h2>Badge</h2>
          <Badge variant="solid" tone="neutral">Neutral</Badge>{" "}
          <Badge variant="solid" tone="brand">Brand</Badge>{" "}
          <Badge variant="outline" tone="success">Success</Badge>{" "}
          <Badge variant="soft" tone="danger">Danger</Badge>
        </section>

        <section style={{ marginBottom: "2rem" }}>
          <h2>Toggle</h2>
          <Toggle
            pressed={pressed}
            onPressedChange={setPressed}
          >
            {pressed ? "ON" : "OFF"}
          </Toggle>
        </section>
      </main>
    </ThemeProvider>
  );
}
```

- [ ] **Step 3: Write `src/main.tsx`**

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.js";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

---

### Task 6: Run `cargo tauri init` to scaffold `src-tauri/`

**Files:**
- Create: `apps/tauri-harness/src-tauri/` (generated by cargo tauri init)

- [ ] **Step 1: Confirm exact flags from `--help`**

Run: `cargo tauri init --help`

Expected flags: `--ci`, `-A/--app-name`, `-W/--window-title`, `-D/--frontend-dist`, `-P/--dev-url`, `--before-dev-command`, `--before-build-command`

- [ ] **Step 2: Run `cargo tauri init` non-interactively**

Run from `apps/tauri-harness/`:
```bash
cd apps/tauri-harness && cargo tauri init \
  --ci \
  --app-name tauri-harness \
  --window-title "Design System Harness" \
  --frontend-dist ../dist \
  --dev-url http://localhost:1420 \
  --before-dev-command "pnpm dev" \
  --before-build-command "pnpm build"
```

Expected: creates `src-tauri/` with `Cargo.toml`, `tauri.conf.json`, `src/main.rs`, `build.rs`, `icons/`.

**STOP and report BLOCKED if this exits non-zero.**

- [ ] **Step 3: Verify `src-tauri/` exists**

Run: `ls apps/tauri-harness/src-tauri/`
Expected: `Cargo.toml`, `build.rs`, `capabilities`, `icons`, `src`, `tauri.conf.json`

---

### Task 7: Add `.gitignore` for build artifacts

**Files:**
- Create: `apps/tauri-harness/.gitignore`

- [ ] **Step 1: Write `.gitignore`**

```
# Frontend build output
dist/

# Rust build artifacts
src-tauri/target/

# Tauri generated files
src-tauri/gen/

# Node modules
node_modules/
```

---

### Task 8: Install dependencies and build workspace packages

- [ ] **Step 1: Run `pnpm install` from repo root to link new workspace app**

Run: `pnpm install` (from `/Users/neural/Code/node/react-component-library`)

Expected: resolves `tauri-harness` workspace deps including `@design-system/*` packages.

**STOP and report BLOCKED if this exits non-zero.**

- [ ] **Step 2: Build all workspace packages** (so `dist/` dirs exist for imports)

Run: `pnpm build` (from repo root)

Expected: builds `@design-system/design-tokens`, `@design-system/contracts`, `@design-system/react-v18` etc. All dist/ dirs populated.

**STOP and report BLOCKED if this exits non-zero.**

---

### Task 9: Verify — typecheck + vite build + cargo check

- [ ] **Step 1: Typecheck the frontend**

Run: `pnpm --filter tauri-harness typecheck`

Expected: exits 0, no output (or only whitespace). This proves the adapter and component imports are type-safe.

**STOP and report BLOCKED if this exits non-zero.**

- [ ] **Step 2: Vite build**

Run: `pnpm --filter tauri-harness build`

Expected: exits 0, produces `apps/tauri-harness/dist/` with `index.html` and assets.

**STOP and report BLOCKED if this exits non-zero.**

- [ ] **Step 3: Cargo check (Rust side only — not a full native bundle)**

Run: `cargo check --manifest-path apps/tauri-harness/src-tauri/Cargo.toml`

Expected: downloads crates (may take 2-5 min first time), exits 0 with `Finished` message.

If this fails on a system/native dependency, report DONE_WITH_CONCERNS with the exact error — do not fake success.

---

### Task 10: Commit all new files

- [ ] **Step 1: Stage and commit scaffold files**

```bash
git add apps/tauri-harness/package.json \
        apps/tauri-harness/tsconfig.json \
        apps/tauri-harness/tsconfig.node.json \
        apps/tauri-harness/vite.config.ts \
        apps/tauri-harness/index.html \
        apps/tauri-harness/.gitignore \
        apps/tauri-harness/src/ \
        apps/tauri-harness/src-tauri/Cargo.toml \
        apps/tauri-harness/src-tauri/Cargo.lock \
        apps/tauri-harness/src-tauri/build.rs \
        apps/tauri-harness/src-tauri/tauri.conf.json \
        apps/tauri-harness/src-tauri/src/ \
        apps/tauri-harness/src-tauri/capabilities/ \
        pnpm-lock.yaml
git commit -m "feat(tauri-harness): scaffold Tauri v2 + React 18 Vite frontend"
```

- [ ] **Step 2: Commit the adapter and App files (if not included above)**

(All new files should be in one or two logical commits — scaffold vs. design-system wiring)

- [ ] **Step 3: Verify git log**

Run: `git log --oneline -5`
Expected: new commit(s) at top of `feat/tauri-harness` branch.

---

## Notes

- `@design-system/design-tokens` exports its CSS at `generated/design-tokens.css` (not `dist/`). The `package.json` `"files"` field includes `generated`, so this path is valid.
- `@design-system/react-v18` is a devDependency in the contracts package but listed under `dependencies` in `react-v18/package.json` as a peerDep. In `tauri-harness`, declare `react` + `react-dom` as regular `dependencies` (Tauri bundles the frontend, no separate runtime install).
- `tsconfig.json` uses `allowImportingTsExtensions: true` + `noEmit: true` for typecheck; the vite build uses `tsc -b` with a build tsconfig that allows emit. Since we don't need composite builds for this app, `tsc -b` will just use the main `tsconfig.json` — but the `build` script spec says `tsc -b && vite build`, so we need the tsconfig to not have `noEmit` for the build phase, OR we accept that `vite build` alone handles transpilation and `tsc -b` only checks types. Vite with `@vitejs/plugin-react` doesn't use tsc for transpilation — it's babel/esbuild. So `tsc -b` in the build script is purely a type gate. With `noEmit: true` in tsconfig.json, `tsc -b` will type-check and exit 0 without emitting. This is fine.
- The `satisfies` constraint on `adapter.ts` — `reactV18ContractAdapter satisfies Record<keyof RequiredComponentContracts, unknown>` — ensures that if new required components are added to the contracts package, this file becomes a compile error, forcing the consumer to wire up the new component.
