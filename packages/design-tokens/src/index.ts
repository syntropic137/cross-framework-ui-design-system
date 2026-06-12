import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { baseTokens, themeDefinitions } from "./token-data.js";
import type { TokenCategories, ThemeDefinition } from "./token-data.js";

export type TokenOutputs = {
  css: string;
  json: {
    tokens: TokenCategories;
    themes: Record<string, TokenCategories>;
  };
};

const CATEGORY_ORDER: (keyof TokenCategories)[] = [
  "color",
  "typography",
  "space",
  "radius",
  "shadow",
  "motion",
  "z"
];

const INDENT = "  ";

export function buildTokenOutputs(): TokenOutputs {
  const css = buildCss(baseTokens, themeDefinitions);
  const themesJson = buildThemesJson(baseTokens, themeDefinitions);

  return {
    css,
    json: {
      tokens: cloneTokens(baseTokens),
      themes: themesJson
    }
  };
}

export async function writeGeneratedFiles(outputDir: string): Promise<void> {
  const outputs = buildTokenOutputs();
  await mkdir(outputDir, { recursive: true });

  const cssPath = join(outputDir, "design-tokens.css");
  const jsonPath = join(outputDir, "design-tokens.json");

  await writeFile(cssPath, `${outputs.css}\n`, "utf8");
  await writeFile(jsonPath, `${JSON.stringify(outputs.json, null, 2)}\n`, "utf8");
}

function buildCss(tokens: TokenCategories, themes: ThemeDefinition[]): string {
  const lines: string[] = ["@layer tokens {"];

  lines.push(formatBlock(":root", flattenTokens(tokens)));

  for (const theme of themes) {
    if (theme.isDefault) {
      continue;
    }

    const override = flattenTokens(theme.overrides);
    if (Object.keys(override).length === 0) {
      continue;
    }

    lines.push("");
    lines.push(formatBlock(theme.selector, override));
  }

  lines.push("}");

  return lines.join("\n");
}

function buildThemesJson(
  tokens: TokenCategories,
  themes: ThemeDefinition[]
): Record<string, TokenCategories> {
  const themeMap: Record<string, TokenCategories> = {};

  for (const theme of themes) {
    themeMap[theme.name] = mergeTokenCategories(tokens, theme.overrides);
  }

  return themeMap;
}

function flattenTokens(categories: Partial<TokenCategories>): Record<string, string> {
  const flattened: Record<string, string> = {};

  for (const category of CATEGORY_ORDER) {
    const values = categories[category];
    if (!values) {
      continue;
    }

    for (const [token, value] of Object.entries(values)) {
      flattened[token] = value;
    }
  }

  return flattened;
}

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

function formatBlock(selector: string, tokens: Record<string, string>): string {
  const entries = Object.entries(tokens);
  if (entries.length === 0) {
    return `${INDENT}${selector} {}`;
  }

  const declarations = entries.map(([name, value]) => `${INDENT.repeat(2)}--${name}: ${value};`);

  return `${INDENT}${selector} {\n${declarations.join("\n")}\n${INDENT}}`;
}

function cloneTokens(tokens: TokenCategories): TokenCategories {
  return JSON.parse(JSON.stringify(tokens));
}

export { baseTokens, themeDefinitions } from "./token-data.js";
