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

  it("builds a pnpm dev install command", () => {
    expect(installCommand("pnpm", ["vitest"], true)).toBe("pnpm add -D vitest");
  });

  it("builds an npm dev install command", () => {
    expect(installCommand("npm", ["vitest"], true)).toBe("npm install --save-dev vitest");
  });
});
