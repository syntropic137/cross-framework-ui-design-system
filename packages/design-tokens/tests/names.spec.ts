import { describe, expect, expectTypeOf, it } from "vitest";
import {
  cssVar,
  isTokenName,
  tokenNames,
  tokenNamesByCategory,
  type CssVariableName,
  type TokenName,
  type TokenNameIn,
} from "../src/names.js";
import { baseTokens, buildTokenOutputs, themeDefinitions } from "../src/index.js";

// Consumers (Skyline first) need to reference tokens from TypeScript without
// string typos: a typed name list ships beside the generated CSS. The list must
// match exactly what the CSS defines, or a typed name could point at nothing.
describe("typed token name list", () => {
  it("lists every token the generated CSS defines, and nothing else", () => {
    const css = buildTokenOutputs().css;
    const cssNames = new Set([...css.matchAll(/--(ds-[a-z0-9-]+)\s*:/g)].map((match) => match[1]));

    expect(new Set(tokenNames)).toEqual(cssNames);
  });

  it("has no duplicate names", () => {
    expect(new Set(tokenNames).size).toBe(tokenNames.length);
  });

  it("groups names by category", () => {
    expect(tokenNamesByCategory.color).toContain("ds-color-bg");
    expect(tokenNamesByCategory.radius).toContain("ds-radius-full");
    expect(tokenNamesByCategory.z).toContain("ds-z-modal");
    expect(Object.values(tokenNamesByCategory).flat()).toEqual([...tokenNames]);
  });

  // Themes may only re-value base tokens. A theme-only name would be missing
  // from the typed list and undefined under every other theme.
  it("never lets a theme introduce a token the base set lacks", () => {
    const base = new Set<string>(tokenNames);
    for (const theme of themeDefinitions) {
      for (const values of Object.values(theme.overrides)) {
        for (const name of Object.keys(values ?? {})) {
          expect(base.has(name), `${theme.name} adds unknown token ${name}`).toBe(true);
        }
      }
    }
  });

  it("guards unknown strings with isTokenName", () => {
    expect(isTokenName("ds-color-accent")).toBe(true);
    expect(isTokenName("ds-color-nope")).toBe(false);
    expect(isTokenName("color-accent")).toBe(false);
  });

  it("builds var() references with cssVar", () => {
    expect(cssVar("ds-color-accent")).toBe("var(--ds-color-accent)");
    expect(cssVar("ds-space-2", "8px")).toBe("var(--ds-space-2, 8px)");
  });

  it("types names as a literal union, not string", () => {
    expectTypeOf<"ds-color-bg">().toMatchTypeOf<TokenName>();
    expectTypeOf<"ds-radius-full">().toMatchTypeOf<TokenNameIn<"radius">>();
    expectTypeOf<"--ds-z-toast">().toMatchTypeOf<CssVariableName>();
    expectTypeOf<string>().not.toMatchTypeOf<TokenName>();
    expectTypeOf(cssVar("ds-color-fg")).toEqualTypeOf<"var(--ds-color-fg)">();
    expectTypeOf(cssVar("ds-space-2", "8px")).toEqualTypeOf<"var(--ds-space-2, 8px)">();
    // @ts-expect-error - a misspelt token name must not compile
    cssVar("ds-color-backgroud");
  });

  it("keeps baseTokens keyed by literal names", () => {
    expectTypeOf<keyof typeof baseTokens.space>().toEqualTypeOf<TokenNameIn<"space">>();
  });
});
