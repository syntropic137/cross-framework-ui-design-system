import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildDesign,
  checkContrast,
  contrastRatio,
  cssDeclarations,
  emitCss,
  loadDesign,
  resolveTheme,
  type ResolvedTheme,
} from "../src/dtcg/index.js";

const PACKAGE = process.cwd().endsWith("design-tokens")
  ? process.cwd()
  : join(process.cwd(), "packages", "design-tokens");
const DREAMSHIP = join(PACKAGE, "dtcg", "dreamship");

const color = (hex: string) => ({
  colorSpace: "srgb",
  components: [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255),
  hex,
});

const palette = {
  color: {
    $type: "color",
    palette: { black: { $value: color("#000000") }, white: { $value: color("#FFFFFF") } },
  },
};

const tokenOf = (theme: ResolvedTheme, path: string) => {
  const token = theme.tokens.find((t) => t.path === path);
  if (!token) throw new Error(`no ${path}`);
  return token;
};

describe("DTCG resolver", () => {
  it("inherits $type from the nearest group and resolves alias chains across documents", () => {
    const theme = resolveTheme("t", [
      palette,
      { color: { content: { primary: { $value: "{color.palette.white}" } } } },
      { component: { label: { $type: "color", $value: "{color.content.primary}" } } },
    ]);
    const label = tokenOf(theme, "component.label");
    expect(label.type).toBe("color");
    expect(label.aliasOf).toBe("{color.content.primary}");
    expect(label.type === "color" && label.value.hex).toBe("#FFFFFF");
  });

  it.each([
    [
      "an alias cycle",
      [{ n: { $type: "number", a: { $value: "{n.b}" }, b: { $value: "{n.a}" } } }],
      /alias cycle/,
    ],
    ["an unknown alias", [{ n: { $type: "number", a: { $value: "{n.zzz}" } } }], /unknown token/],
    [
      "a type mismatch",
      [palette, { d: { $type: "dimension", a: { $value: "{color.palette.white}" } } }],
      /aliases a color/,
    ],
    ["a token defined twice", [palette, palette], /more than one document/],
    [
      "a hex that disagrees with components",
      [{ c: { $type: "color", a: { $value: { ...color("#000000"), hex: "#FFFFFF" } } } }],
      /disagrees/,
    ],
    ["an invalid name", [{ n: { $type: "number", Bad: { $value: 1 } } }], /must match/],
    ["a token with no type", [{ n: { a: { $value: 1 } } }], /no \$type/],
    ["an unsupported type", [{ n: { $type: "border", a: { $value: 1 } } }], /unsupported \$type/],
  ])("rejects %s", (_name, documents, error) => {
    expect(() => resolveTheme("t", documents as never)).toThrow(error);
  });

  it("resolves composite sub-values through aliases", () => {
    const theme = resolveTheme("t", [
      palette,
      {
        font: { $type: "fontFamily", sans: { $value: ["Geist", "sans-serif"] } },
        g: {
          $type: "gradient",
          a: {
            $value: [
              { color: "{color.palette.black}", position: 0 },
              { color: "{color.palette.white}", position: 1 },
            ],
            $extensions: { "com.syntropic137.gradient": { angle: 90 } },
          },
        },
        t: {
          $type: "typography",
          body: {
            $value: {
              fontFamily: "{font.sans}",
              fontSize: { value: 15, unit: "px" },
              fontWeight: 400,
              lineHeight: 1.6,
              letterSpacing: { value: 0, unit: "em" },
            },
          },
        },
      },
    ]);
    const body = tokenOf(theme, "t.body");
    expect(body.type === "typography" && body.value.fontFamily).toEqual(["Geist", "sans-serif"]);
    const gradient = tokenOf(theme, "g.a");
    expect(cssDeclarations("ds", gradient)).toEqual([
      ["ds-g-a", "linear-gradient(90deg, #000000 0%, #FFFFFF 100%)"],
    ]);
    expect(cssDeclarations("ds", body).map(([n]) => n)).toEqual([
      "ds-t-body-font-family",
      "ds-t-body-font-size",
      "ds-t-body-font-weight",
      "ds-t-body-line-height",
      "ds-t-body-letter-spacing",
    ]);
  });
});

describe("contrast gate", () => {
  it("computes WCAG ratios (black on white = 21:1)", () => {
    const theme = resolveTheme("t", [palette]);
    const [black, white] = theme.tokens.map((t) => (t.type === "color" ? t.value : null));
    expect(contrastRatio(black!, white!)).toBeCloseTo(21, 5);
  });

  it("reports every pair below its minimum, per theme", () => {
    const theme = resolveTheme("t", [palette]);
    expect(
      checkContrast([theme], [{ fg: "color.palette.black", bg: "color.palette.white", min: 22 }]),
    ).toEqual([
      {
        theme: "t",
        fg: "color.palette.black",
        bg: "color.palette.white",
        min: 22,
        ratio: expect.closeTo(21, 5),
      },
    ]);
    expect(() =>
      checkContrast([theme], [{ fg: "color.palette.nope", bg: "color.palette.white", min: 3 }]),
    ).toThrow(/no such colour/);
  });
});

describe("CSS emitter", () => {
  it("writes the default theme in full and other themes as differences, with an optional media query", () => {
    const dark = resolveTheme("dark", [
      palette,
      { color: { fg: { $value: "{color.palette.white}" } } },
    ]);
    const light = resolveTheme("light", [
      palette,
      { color: { fg: { $value: "{color.palette.black}" } } },
    ]);
    const css = emitCss(
      "ds",
      [
        { theme: dark, selectors: [":root"] },
        {
          theme: light,
          selectors: ['[data-theme="light"]'],
          media: { query: "(prefers-color-scheme: light)", selector: ":root:not([data-theme])" },
        },
      ],
      "/* h */",
    );
    expect(css).toBe(
      [
        "/* h */",
        "@layer tokens {",
        "  :root {",
        "    --ds-color-palette-black: #000000;",
        "    --ds-color-palette-white: #FFFFFF;",
        "    --ds-color-fg: #FFFFFF;",
        "  }",
        "",
        '  [data-theme="light"] {',
        "    --ds-color-fg: #000000;",
        "  }",
        "",
        "  @media (prefers-color-scheme: light) {",
        "    :root:not([data-theme]) {",
        "      --ds-color-fg: #000000;",
        "    }",
        "  }",
        "}",
        "",
      ].join("\n"),
    );
  });
});

describe("the DreamShip design", () => {
  it("builds every output from one source, and its themes pass the contrast policy", async () => {
    const { config, documents } = await loadDesign(DREAMSHIP);
    const outputs = buildDesign(config, documents);
    expect(outputs.themes.map((t) => t.name)).toEqual(["dark", "light"]);
    expect(outputs.css).not.toMatch(/var\(|NaN|undefined/);
    expect(outputs.css).toContain("--ds-color-content-primary: #ECE6DB;");
    expect(outputs.json.themes.dark["color.surface.page"]).toMatchObject({
      type: "color",
      aliasOf: "{color.palette.night}",
      value: { hex: "#06090C", alpha: 1 },
    });
  });

  it("keeps the committed Rust module in step with the source (run tokens:build after a change)", async () => {
    const { config, documents } = await loadDesign(DREAMSHIP);
    const committed = await readFile(
      join(PACKAGE, "..", "design-tokens-rs", "src", "dreamship.rs"),
      "utf8",
    );
    expect(committed).toBe(buildDesign(config, documents).rust);
  });

  it("one source change reaches CSS, resolved JSON and Rust with no hand edits", async () => {
    const { config, documents } = await loadDesign(DREAMSHIP);
    const reference = structuredClone(documents.get("reference.tokens.json")) as {
      color: { palette: { ivory: { $value: unknown } } };
    };
    reference.color.palette.ivory.$value = color("#FFFFFF");
    const swapped = buildDesign(
      config,
      new Map([...documents, ["reference.tokens.json", reference]]),
    );
    expect(swapped.css).toContain("--ds-color-content-primary: #FFFFFF;");
    expect(swapped.json.themes.dark["color.content.primary"]).toMatchObject({
      value: { hex: "#FFFFFF" },
    });
    expect(swapped.rust).toContain('color_content_primary: Color { hex: "#FFFFFF"');
  });

  it("fails generation when a theme drops below the contrast policy", async () => {
    const { config, documents } = await loadDesign(DREAMSHIP);
    const dark = structuredClone(documents.get("semantic/dark.tokens.json")) as {
      color: { content: { secondary: { $value: string } } };
    };
    dark.color.content.secondary.$value = "{color.palette.night-rule}";
    expect(() =>
      buildDesign(config, new Map([...documents, ["semantic/dark.tokens.json", dark]])),
    ).toThrow(/dark: color.content.secondary on color.surface.page = 1\.\d\d:1, needs 4.5:1/);
  });
});
