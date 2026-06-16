# TUI Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `@design-system/dashboard`, a terminal entry point that launches Storybooks, runs repo tasks, scaffolds the app-owned contract swap module, and explains the design-token standard.

**Architecture:** A new `packages/dev-tools/dashboard` package built on `@neuralempowerment/tui` (zero runtime deps). It runs via Node 22 native type-stripping (`pnpm tui`, no build step). All decision logic lives in pure, unit-tested functions (`context`, `menu`, `pm`, `scaffold`, `adapterTemplate`, `commands`); interactive prompts and process spawning are thin shells. The flagship action generates the app-owned swap module that binds a chosen implementation adapter (`reactV18ContractAdapter`) to the contract surface, per the merged contract-enforcement decision.

**Tech Stack:** TypeScript (ESM), Node 22 (`--experimental-strip-types`), `@neuralempowerment/tui`, Vitest. pnpm workspace.

**Spec:** `docs/superpowers/specs/2026-06-16-tui-dashboard-design.md`

---

## File Structure

```
packages/dev-tools/dashboard/
  package.json                 # @design-system/dashboard; scripts: lint/typecheck/test
  tsconfig.json                # extends root; allowImportingTsExtensions + noEmit
  src/
    cli.ts                     # entry: loop(detectContext → buildMainMenu → dispatch)
    context.ts                 # detectContext(startDir): in-repo vs external
    menu.ts                    # buildMainMenu(ctx): MenuItem[]
    lib/
      commands.ts              # storybookCommand / taskCommand (pure command builders)
      pm.ts                    # detectPackageManager / installCommand
      scaffold.ts              # FilePlan, writeFiles (idempotent), fileExists
      adapterTemplate.ts       # renderAdapterModule(opts): string
      run.ts                   # runCommand(cmd,args,cwd): Promise<number> (spawn)
    actions/
      storybook.ts             # pick react/svelte → runCommand
      runTask.ts               # pick task → runCommand
      installContracts.ts      # prompts → adapterTemplate + scaffold + pm
      designTokens.ts          # render token-standard explainer
  tests/
    context.spec.ts
    menu.spec.ts
    commands.spec.ts
    pm.spec.ts
    scaffold.spec.ts
    adapterTemplate.spec.ts
```

**Shared type/interface contracts (defined once, used everywhere):**

```ts
// context.ts
export type RepoContext =
  | { kind: "in-repo"; repoRoot: string }
  | { kind: "external"; cwd: string };

// menu.ts
export interface MenuItem { label: string; value: string; }

// lib/pm.ts
export type PackageManager = "pnpm" | "npm" | "yarn" | "bun";

// lib/scaffold.ts
export interface FilePlan { path: string; contents: string; }
export interface WriteResult { written: string[]; skipped: string[] }

// lib/adapterTemplate.ts
export type ImplLibrary = "react-v18" | "svelte-v5";
export interface AdapterOptions {
  library: ImplLibrary;
  requiredNames: string[];
  plannedNames: string[];
}
```

**Import convention (this package only):** because it runs via `--experimental-strip-types` with no build, intra-package imports use explicit `.ts` extensions (e.g. `import { detectContext } from "./context.ts"`). This is a deliberate, documented divergence from the repo's `.js`-extension build convention, justified by the no-build runtime.

---

## Task 1: Scaffold the package

**Files:**
- Create: `packages/dev-tools/dashboard/package.json`
- Create: `packages/dev-tools/dashboard/tsconfig.json`
- Create: `packages/dev-tools/dashboard/src/cli.ts` (placeholder entry)
- Modify: root `package.json` (add `tui` script)

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "@design-system/dashboard",
  "version": "0.1.0",
  "private": true,
  "description": "Terminal dashboard and entry point for the design system",
  "type": "module",
  "scripts": {
    "lint": "eslint \"src/**/*.ts\" \"tests/**/*.ts\" --max-warnings 0",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "@types/node": "^20.8.0",
    "typescript": "^5.9.2",
    "vitest": "^4.1.8",
    "eslint": "^9.39.4"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "extends": "../../../tsconfig.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2022",
    "lib": ["ES2022"],
    "types": ["node"],
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "verbatimModuleSyntax": false
  },
  "include": ["src/**/*", "tests/**/*"]
}
```

- [ ] **Step 3: Create placeholder `src/cli.ts`**

```ts
async function main(): Promise<void> {
  console.log("dashboard: not implemented yet");
}

await main();
```

- [ ] **Step 4: Add the `@neuralempowerment/tui` dependency (resolves latest version)**

Run: `pnpm --filter @design-system/dashboard add @neuralempowerment/tui`
Expected: adds `@neuralempowerment/tui` to `dependencies` and updates `pnpm-lock.yaml`.

- [ ] **Step 5: Add root `tui` script**

In root `package.json` `scripts`, add after `generate:component`:

```json
"tui": "node --experimental-strip-types --disable-warning=ExperimentalWarning packages/dev-tools/dashboard/src/cli.ts"
```

- [ ] **Step 6: Verify it runs and typechecks**

Run: `pnpm tui`
Expected: prints `dashboard: not implemented yet`
Run: `pnpm --filter @design-system/dashboard typecheck`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add packages/dev-tools/dashboard package.json pnpm-lock.yaml
git commit -m "feat(dashboard): scaffold @design-system/dashboard package"
```

---

## Task 2: `context.ts` — detect in-repo vs external

**Files:**
- Create: `packages/dev-tools/dashboard/src/context.ts`
- Test: `packages/dev-tools/dashboard/tests/context.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { detectContext } from "../src/context.ts";

let root: string;
beforeEach(() => { root = mkdtempSync(join(tmpdir(), "ctx-")); });
afterEach(() => { rmSync(root, { recursive: true, force: true }); });

describe("detectContext", () => {
  it("detects in-repo when pnpm-workspace.yaml + packages/contracts exist up-tree", () => {
    writeFileSync(join(root, "pnpm-workspace.yaml"), "packages:\n  - 'packages/*'\n");
    mkdirSync(join(root, "packages", "contracts"), { recursive: true });
    writeFileSync(join(root, "packages", "contracts", "package.json"), '{"name":"@design-system/contracts"}');
    const nested = join(root, "packages", "dev-tools", "dashboard");
    mkdirSync(nested, { recursive: true });

    const ctx = detectContext(nested);
    expect(ctx).toEqual({ kind: "in-repo", repoRoot: root });
  });

  it("detects external when no marker is found", () => {
    const app = join(root, "some-app");
    mkdirSync(app, { recursive: true });
    const ctx = detectContext(app);
    expect(ctx).toEqual({ kind: "external", cwd: app });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @design-system/dashboard exec vitest run tests/context.spec.ts`
Expected: FAIL — cannot find module `../src/context.ts`.

- [ ] **Step 3: Write minimal implementation**

```ts
import { existsSync } from "node:fs";
import { dirname, join, parse } from "node:path";

export type RepoContext =
  | { kind: "in-repo"; repoRoot: string }
  | { kind: "external"; cwd: string };

function isRepoRoot(dir: string): boolean {
  return (
    existsSync(join(dir, "pnpm-workspace.yaml")) &&
    existsSync(join(dir, "packages", "contracts", "package.json"))
  );
}

export function detectContext(startDir: string): RepoContext {
  let dir = startDir;
  const rootOf = parse(dir).root;
  while (true) {
    if (isRepoRoot(dir)) return { kind: "in-repo", repoRoot: dir };
    if (dir === rootOf) break;
    dir = dirname(dir);
  }
  return { kind: "external", cwd: startDir };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @design-system/dashboard exec vitest run tests/context.spec.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/dev-tools/dashboard/src/context.ts packages/dev-tools/dashboard/tests/context.spec.ts
git commit -m "feat(dashboard): context detection (in-repo vs external)"
```

---

## Task 3: `menu.ts` — context-aware main menu

**Files:**
- Create: `packages/dev-tools/dashboard/src/menu.ts`
- Test: `packages/dev-tools/dashboard/tests/menu.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { buildMainMenu } from "../src/menu.ts";

describe("buildMainMenu", () => {
  it("in-repo menu includes dev + integration actions", () => {
    const items = buildMainMenu({ kind: "in-repo", repoRoot: "/repo" });
    expect(items.map((i) => i.value)).toEqual([
      "storybook", "task", "install-contracts", "tokens", "quit"
    ]);
  });

  it("external menu includes only integration actions", () => {
    const items = buildMainMenu({ kind: "external", cwd: "/app" });
    expect(items.map((i) => i.value)).toEqual([
      "install-contracts", "tokens", "quit"
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @design-system/dashboard exec vitest run tests/menu.spec.ts`
Expected: FAIL — cannot find module `../src/menu.ts`.

- [ ] **Step 3: Write minimal implementation**

```ts
import type { RepoContext } from "./context.ts";

export interface MenuItem { label: string; value: string; }

export function buildMainMenu(ctx: RepoContext): MenuItem[] {
  if (ctx.kind === "in-repo") {
    return [
      { label: "Start a Storybook", value: "storybook" },
      { label: "Run a repo task", value: "task" },
      { label: "Install contracts into an app", value: "install-contracts" },
      { label: "Design tokens standard", value: "tokens" },
      { label: "Quit", value: "quit" }
    ];
  }
  return [
    { label: "Install contracts adapter", value: "install-contracts" },
    { label: "Set up design tokens", value: "tokens" },
    { label: "Quit", value: "quit" }
  ];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @design-system/dashboard exec vitest run tests/menu.spec.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/dev-tools/dashboard/src/menu.ts packages/dev-tools/dashboard/tests/menu.spec.ts
git commit -m "feat(dashboard): context-aware main menu model"
```

---

## Task 4: `lib/commands.ts` — Storybook & task command builders

**Files:**
- Create: `packages/dev-tools/dashboard/src/lib/commands.ts`
- Test: `packages/dev-tools/dashboard/tests/commands.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { storybookCommand, taskCommand } from "../src/lib/commands.ts";

describe("command builders", () => {
  it("builds the react storybook command", () => {
    expect(storybookCommand("react-v18")).toEqual({
      cmd: "pnpm",
      args: ["--filter", "@design-system/react-v18", "storybook"]
    });
  });

  it("builds the svelte storybook command", () => {
    expect(storybookCommand("svelte-v5")).toEqual({
      cmd: "pnpm",
      args: ["--filter", "@design-system/svelte-v5", "storybook"]
    });
  });

  it("builds a repo task command", () => {
    expect(taskCommand("qa")).toEqual({ cmd: "pnpm", args: ["qa"] });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @design-system/dashboard exec vitest run tests/commands.spec.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Write minimal implementation**

```ts
import type { ImplLibrary } from "./adapterTemplate.ts";

export interface Command { cmd: string; args: string[]; }

const STORYBOOK_FILTER: Record<ImplLibrary, string> = {
  "react-v18": "@design-system/react-v18",
  "svelte-v5": "@design-system/svelte-v5"
};

export function storybookCommand(library: ImplLibrary): Command {
  return { cmd: "pnpm", args: ["--filter", STORYBOOK_FILTER[library], "storybook"] };
}

export function taskCommand(task: string): Command {
  return { cmd: "pnpm", args: [task] };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @design-system/dashboard exec vitest run tests/commands.spec.ts`
Expected: PASS (3 tests).

> Note: `commands.ts` imports the `ImplLibrary` type from `adapterTemplate.ts` (created in Task 6). To keep this task self-contained, first create `src/lib/adapterTemplate.ts` containing only the type, then expand it in Task 6:
> ```ts
> export type ImplLibrary = "react-v18" | "svelte-v5";
> ```

- [ ] **Step 5: Commit**

```bash
git add packages/dev-tools/dashboard/src/lib/commands.ts packages/dev-tools/dashboard/src/lib/adapterTemplate.ts packages/dev-tools/dashboard/tests/commands.spec.ts
git commit -m "feat(dashboard): storybook and task command builders"
```

---

## Task 5: `lib/pm.ts` — package-manager detection & install command

**Files:**
- Create: `packages/dev-tools/dashboard/src/lib/pm.ts`
- Test: `packages/dev-tools/dashboard/tests/pm.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { detectPackageManager, installCommand } from "../src/lib/pm.ts";

let dir: string;
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), "pm-")); });
afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

describe("detectPackageManager", () => {
  it("detects pnpm from pnpm-lock.yaml", () => {
    writeFileSync(join(dir, "pnpm-lock.yaml"), "");
    expect(detectPackageManager(dir)).toBe("pnpm");
  });

  it("detects npm from package-lock.json", () => {
    writeFileSync(join(dir, "package-lock.json"), "{}");
    expect(detectPackageManager(dir)).toBe("npm");
  });

  it("defaults to npm when no lockfile is present", () => {
    expect(detectPackageManager(dir)).toBe("npm");
  });
});

describe("installCommand", () => {
  it("builds a pnpm install command", () => {
    expect(installCommand("pnpm", ["@design-system/contracts", "@design-system/react-v18"], false))
      .toBe("pnpm add @design-system/contracts @design-system/react-v18");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @design-system/dashboard exec vitest run tests/pm.spec.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Write minimal implementation**

```ts
import { existsSync } from "node:fs";
import { join } from "node:path";

export type PackageManager = "pnpm" | "npm" | "yarn" | "bun";

export function detectPackageManager(dir: string): PackageManager {
  if (existsSync(join(dir, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(join(dir, "yarn.lock"))) return "yarn";
  if (existsSync(join(dir, "bun.lockb"))) return "bun";
  return "npm";
}

const ADD_VERB: Record<PackageManager, string> = {
  pnpm: "add",
  yarn: "add",
  bun: "add",
  npm: "install"
};

export function installCommand(pm: PackageManager, deps: string[], dev: boolean): string {
  const devFlag = dev ? (pm === "npm" ? " --save-dev" : " -D") : "";
  return `${pm} ${ADD_VERB[pm]}${devFlag} ${deps.join(" ")}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @design-system/dashboard exec vitest run tests/pm.spec.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/dev-tools/dashboard/src/lib/pm.ts packages/dev-tools/dashboard/tests/pm.spec.ts
git commit -m "feat(dashboard): package-manager detection and install command"
```

---

## Task 6: `lib/adapterTemplate.ts` — render the swap module

**Files:**
- Modify: `packages/dev-tools/dashboard/src/lib/adapterTemplate.ts` (expand from the type stub created in Task 4)
- Test: `packages/dev-tools/dashboard/tests/adapterTemplate.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { renderAdapterModule } from "../src/lib/adapterTemplate.ts";

describe("renderAdapterModule", () => {
  const out = renderAdapterModule({
    library: "react-v18",
    requiredNames: ["badge", "button", "toggle"],
    plannedNames: ["select", "checkbox"]
  });

  it("imports the chosen library's adapter and the contract manifest", () => {
    expect(out).toContain('import { reactV18ContractAdapter } from "@design-system/react-v18";');
    expect(out).toContain('import type { RequiredComponentContracts } from "@design-system/contracts";');
  });

  it("exports a `ui` const constrained by the contract surface", () => {
    expect(out).toContain(
      "export const ui = reactV18ContractAdapter satisfies Record<"
    );
    expect(out).toContain("keyof RequiredComponentContracts");
  });

  it("includes the one-line swap hint for the other library", () => {
    expect(out).toContain('// import { svelteV5ContractAdapter } from "@design-system/svelte-v5";');
  });

  it("lists planned components as TODO binding points", () => {
    expect(out).toContain("TODO (planned, not yet required): select, checkbox");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @design-system/dashboard exec vitest run tests/adapterTemplate.spec.ts`
Expected: FAIL — `renderAdapterModule` is not exported.

- [ ] **Step 3: Write the implementation (replace the file's contents)**

```ts
export type ImplLibrary = "react-v18" | "svelte-v5";

export interface AdapterOptions {
  library: ImplLibrary;
  requiredNames: string[];
  plannedNames: string[];
}

interface LibMeta { pkg: string; adapter: string; }

const LIBS: Record<ImplLibrary, LibMeta> = {
  "react-v18": { pkg: "@design-system/react-v18", adapter: "reactV18ContractAdapter" },
  "svelte-v5": { pkg: "@design-system/svelte-v5", adapter: "svelteV5ContractAdapter" }
};

export function renderAdapterModule(opts: AdapterOptions): string {
  const chosen = LIBS[opts.library];
  const other = opts.library === "react-v18" ? LIBS["svelte-v5"] : LIBS["react-v18"];
  const plannedLine = opts.plannedNames.length
    ? `// TODO (planned, not yet required): ${opts.plannedNames.join(", ")}\n`
    : "";

  return `// Generated by @design-system/dashboard. The single swap point for this app's UI.
// Required components: ${opts.requiredNames.join(", ")}
${plannedLine}import type { RequiredComponentContracts } from "@design-system/contracts";
import { ${chosen.adapter} } from "${chosen.pkg}";
// Swap implementations by changing this one import:
// import { ${other.adapter} } from "${other.pkg}";

export const ui = ${chosen.adapter} satisfies Record<
  keyof RequiredComponentContracts,
  unknown
>;
`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @design-system/dashboard exec vitest run tests/adapterTemplate.spec.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/dev-tools/dashboard/src/lib/adapterTemplate.ts packages/dev-tools/dashboard/tests/adapterTemplate.spec.ts
git commit -m "feat(dashboard): render the app-owned contract swap module"
```

---

## Task 7: `lib/scaffold.ts` — idempotent file writing

**Files:**
- Create: `packages/dev-tools/dashboard/src/lib/scaffold.ts`
- Test: `packages/dev-tools/dashboard/tests/scaffold.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeFiles } from "../src/lib/scaffold.ts";

let dir: string;
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), "scaffold-")); });
afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

describe("writeFiles", () => {
  it("creates nested files and reports them written", () => {
    const target = join(dir, "src/ui/adapter.ts");
    const res = writeFiles([{ path: target, contents: "export const ui = {};\n" }], { overwrite: false });
    expect(res.written).toEqual([target]);
    expect(readFileSync(target, "utf8")).toBe("export const ui = {};\n");
  });

  it("skips an existing file when overwrite is false", () => {
    const target = join(dir, "a.ts");
    writeFiles([{ path: target, contents: "first\n" }], { overwrite: false });
    const res = writeFiles([{ path: target, contents: "second\n" }], { overwrite: false });
    expect(res.skipped).toEqual([target]);
    expect(readFileSync(target, "utf8")).toBe("first\n");
  });

  it("overwrites when overwrite is true", () => {
    const target = join(dir, "a.ts");
    writeFiles([{ path: target, contents: "first\n" }], { overwrite: false });
    const res = writeFiles([{ path: target, contents: "second\n" }], { overwrite: true });
    expect(res.written).toEqual([target]);
    expect(readFileSync(target, "utf8")).toBe("second\n");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @design-system/dashboard exec vitest run tests/scaffold.spec.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Write minimal implementation**

```ts
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export interface FilePlan { path: string; contents: string; }
export interface WriteResult { written: string[]; skipped: string[]; }

export function writeFiles(plans: FilePlan[], opts: { overwrite: boolean }): WriteResult {
  const written: string[] = [];
  const skipped: string[] = [];
  for (const plan of plans) {
    if (existsSync(plan.path) && !opts.overwrite) {
      skipped.push(plan.path);
      continue;
    }
    mkdirSync(dirname(plan.path), { recursive: true });
    writeFileSync(plan.path, plan.contents);
    written.push(plan.path);
  }
  return { written, skipped };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @design-system/dashboard exec vitest run tests/scaffold.spec.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/dev-tools/dashboard/src/lib/scaffold.ts packages/dev-tools/dashboard/tests/scaffold.spec.ts
git commit -m "feat(dashboard): idempotent file scaffolding"
```

---

## Task 8: `lib/run.ts` — spawn child processes

**Files:**
- Create: `packages/dev-tools/dashboard/src/lib/run.ts`

This is a thin shell over `node:child_process`; it is exercised manually (Task 12) rather than unit-tested, because its only behavior is delegating to a real process.

- [ ] **Step 1: Write the implementation**

```ts
import { spawn } from "node:child_process";

/** Spawn a command with inherited stdio; resolve with its exit code. */
export function runCommand(cmd: string, args: string[], cwd: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: "inherit", shell: false });
    child.on("error", reject);
    child.on("close", (code) => resolve(code ?? 0));
  });
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @design-system/dashboard typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/dev-tools/dashboard/src/lib/run.ts
git commit -m "feat(dashboard): child-process runner"
```

---

## Task 9: Action shells — storybook, runTask

**Files:**
- Create: `packages/dev-tools/dashboard/src/actions/storybook.ts`
- Create: `packages/dev-tools/dashboard/src/actions/runTask.ts`

These compose the tested pure builders (`commands.ts`) with `tui` prompts and `run.ts`. Logic is delegated; they stay thin.

- [ ] **Step 1: Write `actions/storybook.ts`**

```ts
import { select } from "@neuralempowerment/tui";
import type { RepoContext } from "../context.ts";
import { storybookCommand } from "../lib/commands.ts";
import { runCommand } from "../lib/run.ts";
import type { ImplLibrary } from "../lib/adapterTemplate.ts";

export async function startStorybook(ctx: Extract<RepoContext, { kind: "in-repo" }>): Promise<void> {
  const library = await select<ImplLibrary>(
    [
      { label: "React 18", value: "react-v18" },
      { label: "Svelte 5", value: "svelte-v5" }
    ],
    { title: "Which Storybook?" }
  );
  const { cmd, args } = storybookCommand(library);
  await runCommand(cmd, args, ctx.repoRoot);
}
```

- [ ] **Step 2: Write `actions/runTask.ts`**

```ts
import { select } from "@neuralempowerment/tui";
import type { RepoContext } from "../context.ts";
import { taskCommand } from "../lib/commands.ts";
import { runCommand } from "../lib/run.ts";

export async function runRepoTask(ctx: Extract<RepoContext, { kind: "in-repo" }>): Promise<void> {
  const task = await select<string>(
    [
      { label: "qa (full gate)", value: "qa" },
      { label: "build", value: "build" },
      { label: "test", value: "test" },
      { label: "lint", value: "lint" },
      { label: "typecheck", value: "typecheck" }
    ],
    { title: "Which task?" }
  );
  const { cmd, args } = taskCommand(task);
  await runCommand(cmd, args, ctx.repoRoot);
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @design-system/dashboard typecheck`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add packages/dev-tools/dashboard/src/actions/storybook.ts packages/dev-tools/dashboard/src/actions/runTask.ts
git commit -m "feat(dashboard): storybook and run-task actions"
```

---

## Task 10: `actions/installContracts.ts` — the flagship action

**Files:**
- Create: `packages/dev-tools/dashboard/src/actions/installContracts.ts`

Reads the contract manifest from the target's installed `@design-system/contracts` if present, otherwise falls back to the known required set (`badge`, `button`, `toggle`). Prints the install command (does not auto-run unless confirmed). Writes the swap module idempotently.

- [ ] **Step 1: Write the implementation**

```ts
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { select, prompt, confirm, success, fail, bold } from "@neuralempowerment/tui";
import type { RepoContext } from "../context.ts";
import type { ImplLibrary } from "../lib/adapterTemplate.ts";
import { renderAdapterModule } from "../lib/adapterTemplate.ts";
import { writeFiles } from "../lib/scaffold.ts";
import { detectPackageManager, installCommand } from "../lib/pm.ts";

const FALLBACK_REQUIRED = ["badge", "button", "toggle"];

/** Required + planned contract names, read from the target app's contracts package if installed. */
function readContractNames(targetDir: string): { required: string[]; planned: string[] } {
  try {
    const require = createRequire(join(targetDir, "noop.js"));
    const mod = require("@design-system/contracts") as {
      requiredContractNames?: readonly string[];
      componentContractStatus?: Record<string, string>;
    };
    const required = [...(mod.requiredContractNames ?? FALLBACK_REQUIRED)];
    const planned = Object.entries(mod.componentContractStatus ?? {})
      .filter(([, status]) => status === "planned")
      .map(([name]) => name);
    return { required, planned };
  } catch {
    return { required: [...FALLBACK_REQUIRED], planned: [] };
  }
}

export async function installContracts(ctx: RepoContext): Promise<void> {
  const defaultDir = ctx.kind === "external" ? ctx.cwd : process.cwd();
  const targetDir = resolve(await prompt(`Target app directory [${defaultDir}]: `) || defaultDir);

  const library = await select<ImplLibrary>(
    [{ label: "React 18 (reactV18ContractAdapter)", value: "react-v18" }],
    { title: "Implementation library" }
  );

  const adapterRel = (await prompt("Adapter module path [src/ui/adapter.ts]: ")) || "src/ui/adapter.ts";
  const adapterPath = join(targetDir, adapterRel);

  const { required, planned } = readContractNames(targetDir);
  const contents = renderAdapterModule({ library, requiredNames: required, plannedNames: planned });

  // Show the install command (do not auto-run unless confirmed).
  const pm = detectPackageManager(targetDir);
  const deps = ["@design-system/contracts", `@design-system/${library}`, "@design-system/design-tokens"];
  console.log(bold("\nAdd these dependencies to your app:"));
  console.log("  " + installCommand(pm, deps, false) + "\n");

  console.log(bold("Will write:"));
  console.log("  " + adapterPath + "\n");

  if (!(await confirm("Write the adapter module now?"))) {
    fail("Aborted; nothing written.");
    return;
  }

  const result = writeFiles([{ path: adapterPath, contents }], { overwrite: false });
  if (result.skipped.length) {
    if (await confirm(`${adapterRel} exists. Overwrite?`)) {
      writeFiles([{ path: adapterPath, contents }], { overwrite: true });
      success(`Updated ${adapterRel}`);
    } else {
      fail(`Kept existing ${adapterRel}`);
    }
  } else {
    success(`Created ${adapterRel}`);
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @design-system/dashboard typecheck`
Expected: no errors. If `@neuralempowerment/tui`'s `prompt`/`success`/`fail` signatures differ from those used here, adjust the calls to match the package's published `.d.ts` (the import names are correct; only argument shapes may need tweaking).

- [ ] **Step 3: Commit**

```bash
git add packages/dev-tools/dashboard/src/actions/installContracts.ts
git commit -m "feat(dashboard): install-contracts swap-module scaffold"
```

---

## Task 11: `actions/designTokens.ts` — token-standard explainer

**Files:**
- Create: `packages/dev-tools/dashboard/src/actions/designTokens.ts`

Renders a concise explainer. In-repo, it reads the generated token CSS to list real `--ds-*` names; external, it prints the import snippet.

- [ ] **Step 1: Write the implementation**

```ts
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { bold, dim } from "@neuralempowerment/tui";
import type { RepoContext } from "../context.ts";

function readTokenNames(repoRoot: string): string[] {
  const css = join(repoRoot, "packages/design-tokens/generated/design-tokens.css");
  if (!existsSync(css)) return [];
  const text = readFileSync(css, "utf8");
  const names = new Set<string>();
  for (const m of text.matchAll(/--ds-[a-z0-9-]+/g)) names.add(m[0]);
  return [...names].sort().slice(0, 20);
}

export function showDesignTokens(ctx: RepoContext): void {
  console.log(bold("\nDesign tokens — the cross-UI standard\n"));
  console.log("Tokens are the visual source of truth. Components consume semantic");
  console.log("`--ds-*` custom properties; never hardcode colors or px. Size in rem.\n");
  console.log(bold("Consume the layered CSS:"));
  console.log('  import "@design-system/design-tokens/generated/design-tokens.css";\n');
  console.log(bold("Theme swapping:"));
  console.log("  Set data-theme on a root element; tokens re-resolve. Light/dark and beyond.\n");

  if (ctx.kind === "in-repo") {
    const names = readTokenNames(ctx.repoRoot);
    if (names.length) {
      console.log(bold("Sample tokens:"));
      console.log(dim("  " + names.join("  ")) + "\n");
    }
  }
  console.log(dim("See docs/component-standard.md for the full token-to-component map.\n"));
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @design-system/dashboard typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/dev-tools/dashboard/src/actions/designTokens.ts
git commit -m "feat(dashboard): design-tokens explainer action"
```

---

## Task 12: `cli.ts` — wire the menu loop, then verify end-to-end

**Files:**
- Modify: `packages/dev-tools/dashboard/src/cli.ts`

- [ ] **Step 1: Replace `cli.ts` with the loop**

```ts
import { select, bold } from "@neuralempowerment/tui";
import { detectContext } from "./context.ts";
import { buildMainMenu } from "./menu.ts";
import { startStorybook } from "./actions/storybook.ts";
import { runRepoTask } from "./actions/runTask.ts";
import { installContracts } from "./actions/installContracts.ts";
import { showDesignTokens } from "./actions/designTokens.ts";

async function main(): Promise<void> {
  const ctx = detectContext(process.cwd());
  console.log(bold(`\nDesign System Dashboard — ${ctx.kind}\n`));

  while (true) {
    const choice = await select(buildMainMenu(ctx).map((i) => ({ label: i.label, value: i.value })), {
      title: "What would you like to do?"
    });

    try {
      if (choice === "quit") break;
      if (choice === "storybook" && ctx.kind === "in-repo") await startStorybook(ctx);
      else if (choice === "task" && ctx.kind === "in-repo") await runRepoTask(ctx);
      else if (choice === "install-contracts") await installContracts(ctx);
      else if (choice === "tokens") showDesignTokens(ctx);
    } catch (err) {
      console.error(`\nAction failed: ${(err as Error).message}\n`);
    }
  }
}

await main();
```

- [ ] **Step 2: Typecheck + full package test**

Run: `pnpm --filter @design-system/dashboard typecheck`
Expected: no errors.
Run: `pnpm --filter @design-system/dashboard test`
Expected: all unit suites pass (context, menu, commands, pm, adapterTemplate, scaffold).

- [ ] **Step 3: Manual smoke test (in-repo)**

Run: `pnpm tui`
Expected: shows `Design System Dashboard — in-repo`, the 5-item menu renders; selecting "Design tokens standard" prints the explainer with real `--ds-*` names; "Quit" exits cleanly.

- [ ] **Step 4: Manual smoke test (install-contracts dry path)**

Run `pnpm tui`, choose "Install contracts into an app", point it at a temp dir, accept defaults, and confirm — verify `src/ui/adapter.ts` is created containing `reactV18ContractAdapter` and the `satisfies Record<keyof RequiredComponentContracts, unknown>` line.

- [ ] **Step 5: Commit**

```bash
git add packages/dev-tools/dashboard/src/cli.ts
git commit -m "feat(dashboard): wire context-aware menu loop"
```

---

## Task 13: Full gate + README

**Files:**
- Create: `packages/dev-tools/dashboard/README.md`

- [ ] **Step 1: Write a short README** documenting `pnpm tui`, the context-aware menus, the install-contracts swap module, and the `.ts`-import/no-build note.

- [ ] **Step 2: Run the full monorepo gate**

Run: `pnpm qa`
Expected: PASS — the new package's lint/typecheck/test run via `pnpm -r`; existing packages unaffected. (If the first run hits the known Storybook Vite re-optimization flake, re-run `pnpm storybook:test`, then `pnpm qa` again — documented in the contract-enforcement handoff.)

- [ ] **Step 3: Commit**

```bash
git add packages/dev-tools/dashboard/README.md
git commit -m "docs(dashboard): usage README"
```

---

## Self-Review

- **Spec coverage:** package placement + runtime (Task 1) ✓; context-aware menu (Tasks 2,3,12) ✓; storybook launchers (Tasks 4,9) ✓; run-task (Tasks 4,9) ✓; install-contracts swap module against real exports + print-don't-auto-run + idempotent (Tasks 5,6,7,10) ✓; token explainer with real `--ds-*` (Task 11) ✓; testing on pure units (Tasks 2–7) ✓; graceful degradation — only React offered until `rcl-q64.2` (Task 10 select list) ✓; build-boundary (generated module imports package names, never `src`) ✓.
- **Placeholder scan:** no TBD/TODO-as-requirement; the only "TODO" is intentional generated output in the adapter template.
- **Type consistency:** `RepoContext`, `MenuItem`, `ImplLibrary`, `Command`, `PackageManager`, `FilePlan`/`WriteResult`, `AdapterOptions` are defined once and reused; `ImplLibrary` stub is created in Task 4 and expanded in Task 6 (noted explicitly).
- **Known follow-up:** `@neuralempowerment/tui`'s exact `prompt`/`success`/`fail` argument shapes are confirmed against the installed `.d.ts` during Task 10 typecheck (import names are correct).
