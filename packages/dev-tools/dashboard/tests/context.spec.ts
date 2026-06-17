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
    writeFileSync(join(root, "packages", "contracts", "package.json"), '{"name":"@syntropic137/contracts"}');
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
