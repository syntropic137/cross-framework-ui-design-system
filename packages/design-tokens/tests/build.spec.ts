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
    expect(outputs.css).toContain("[data-theme=\"serif\"]");
    expect(outputs.css).toContain("--ds-font-sans: ui-serif, Georgia");
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
