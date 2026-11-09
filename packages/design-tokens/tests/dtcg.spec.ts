import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildDesign,
  checkContrast,
  contrastRatio,
  cssDeclarations,
  emitCss,
  emitRust,
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
      checkContrast([theme], [{ fg: "color.palette.black", bg: "color.palette.black", min: 3 }]),
    ).toEqual([
      {
        theme: "t",
        fg: "color.palette.black",
        bg: "color.palette.black",
        min: 3,
        ratio: 1,
      },
    ]);
    expect(() =>
      checkContrast([theme], [{ fg: "color.palette.nope", bg: "color.palette.white", min: 3 }]),
    ).toThrow(/foreground must be a colour/);
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

  it("keeps the committed Rust module in step with the source (run tokens:rust after a change)", async () => {
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

describe("Codex review pass 1 regressions", () => {
  it("merges a group named like an Object.prototype member", () => {
    const theme = resolveTheme("t", [{ constructor: { $type: "number", a: { $value: 1 } } }]);
    expect(theme.tokens.map((t) => t.path)).toEqual(["constructor.a"]);
  });

  it.each([
    ["$root", { n: { $type: "number", $root: { $value: 1 } } }],
    ["$extends", { n: { $type: "number", $extends: "{m}", a: { $value: 1 } } }],
    ["a $ref token", { n: { $type: "number", a: { $ref: "#/m/b" } } }],
    ["a $ref value", { n: { $type: "number", a: { $value: { $ref: "#/m/b/$value" } } } }],
  ])("rejects %s instead of dropping tokens", (_name, document) => {
    expect(() => resolveTheme("t", [document as never])).toThrow(/not supported/);
  });

  it("gates the colour that ships: components are quantised to the hex", () => {
    const grey = { colorSpace: "srgb", components: [0.465, 0.465, 0.465] };
    const theme = resolveTheme("t", [palette, { c: { $type: "color", grey: { $value: grey } } }]);
    const failures = checkContrast(
      [theme],
      [{ fg: "c.grey", bg: "color.palette.white", min: 4.5 }],
    );
    expect(failures).toHaveLength(1);
    expect(failures[0].ratio).toBeCloseTo(4.4781, 3);
  });

  it("accepts single-stop gradients and aliased positions, clamping positions to 0..1", () => {
    const theme = resolveTheme("t", [
      palette,
      {
        p: { $type: "number", end: { $value: 1.5 } },
        g: {
          $type: "gradient",
          one: { $value: [{ color: "{color.palette.black}", position: 0 }] },
          two: {
            $value: [
              { color: "{color.palette.black}", position: -1 },
              { color: "{color.palette.white}", position: "{p.end}" },
            ],
          },
        },
      },
    ]);
    const two = tokenOf(theme, "g.two");
    expect(two.type === "gradient" && two.value.stops.map((s) => s.position)).toEqual([0, 1]);
    expect(tokenOf(theme, "g.one").type).toBe("gradient");
  });

  it("reads font-weight keywords and keeps fractional weights identical in every output", () => {
    const theme = resolveTheme("t", [
      { w: { $type: "fontWeight", bold: { $value: "bold" }, odd: { $value: 450.5 } } },
    ]);
    expect(tokenOf(theme, "w.bold").value).toBe(700);
    const rust = emitRust("d", [theme], "t", "// h");
    expect(rust).toContain("w_odd: 450.5,");
    expect(cssDeclarations("ds", tokenOf(theme, "w.odd"))).toEqual([["ds-w-odd", "450.5"]]);
    expect(() =>
      resolveTheme("t", [{ w: { $type: "fontWeight", x: { $value: "heavyish" } } }]),
    ).toThrow(/unknown fontWeight/);
  });

  it("escapes quotes and backslashes in CSS and Rust strings, and rejects control characters", () => {
    const theme = resolveTheme("t", [
      {
        f: {
          $type: "fontFamily",
          odd: { $value: ['A"B\\C', "serif"], $description: "two\nlines" },
        },
      },
    ]);
    expect(cssDeclarations("ds", tokenOf(theme, "f.odd"))).toEqual([
      ["ds-f-odd", '"A\\"B\\\\C", serif'],
    ]);
    const rust = emitRust("d", [theme], "t", "// h");
    expect(rust).toContain('f_odd: &["A\\"B\\\\C", "serif"],');
    expect(rust).toContain("/// `f.odd`: two lines");
    expect(() =>
      resolveTheme("t", [{ f: { $type: "fontFamily", x: { $value: "A\u0001" } } }]),
    ).toThrow(/control characters/);
  });

  it("refuses values that overflow after conversion or do not fit a Rust f32", () => {
    expect(() =>
      resolveTheme("t", [{ d: { $type: "duration", x: { $value: { value: 1e308, unit: "s" } } } }]),
    ).toThrow(/overflows/);
    const big = resolveTheme("t", [{ n: { $type: "number", x: { $value: 1e39 } } }]);
    expect(() => emitRust("d", [big], "t", "// h")).toThrow(/does not fit a Rust f32/);
  });

  it.each([
    ["a missing minimum", { fg: "color.palette.black", bg: "color.palette.white" }],
    ["a string minimum", { fg: "color.palette.black", bg: "color.palette.white", min: "4.5:1" }],
  ])("rejects a contrast rule with %s", (_name, rule) => {
    expect(() => checkContrast([resolveTheme("t", [palette])], [rule as never])).toThrow(
      /min must be/,
    );
  });

  it("rejects translucent pairs, which need a backdrop to judge", () => {
    const theme = resolveTheme("t", [
      palette,
      { c: { $type: "color", glass: { $value: { ...color("#000000"), alpha: 0.5 } } } },
    ]);
    expect(() =>
      checkContrast([theme], [{ fg: "c.glass", bg: "color.palette.white", min: 3 }]),
    ).toThrow(/translucent/);
  });

  it("accepts themes that list the same tokens in a different order", () => {
    const a = resolveTheme("a", [{ n: { $type: "number", x: { $value: 1 }, y: { $value: 2 } } }]);
    const b = resolveTheme("b", [{ n: { $type: "number", y: { $value: 4 }, x: { $value: 3 } } }]);
    const rust = emitRust("d", [a, b], "a", "// h");
    expect(rust).toContain("pub const B: Theme = Theme {\n    n_x: 3.0,\n    n_y: 4.0,\n};");
    const c = resolveTheme("c", [{ n: { $type: "number", x: { $value: 1 } } }]);
    expect(() => emitRust("d", [a, c], "a", "// h")).toThrow(/same tokens/);
  });

  it("rejects composite aliases of the wrong type and composite alias cycles", () => {
    expect(() =>
      resolveTheme("t", [
        palette,
        {
          t: {
            $type: "typography",
            x: {
              $value: {
                fontFamily: "{color.palette.black}",
                fontSize: { value: 1, unit: "px" },
                fontWeight: 400,
                lineHeight: 1,
                letterSpacing: { value: 0, unit: "em" },
              },
            },
          },
        },
      ]),
    ).toThrow(/expected a fontFamily alias/);
    expect(() =>
      resolveTheme("t", [
        {
          g: {
            $type: "gradient",
            a: { $value: [{ color: "{g.b}", position: 0 }] },
            b: { $value: "{g.a}" },
          },
        },
      ]),
    ).toThrow(/alias cycle|expected a color alias/);
  });
});

describe("generated Rust compiles", () => {
  it("for a synthetic theme with every type, escapes, odd weights and reordered themes", async () => {
    const { execFileSync } = await import("node:child_process");
    const { mkdtemp, mkdir, writeFile, rm } = await import("node:fs/promises");
    const { tmpdir } = await import("node:os");
    const docs = (fg: string) => [
      palette,
      {
        $description: "synthetic",
        c: {
          $type: "color",
          fg: { $value: `{color.palette.${fg}}`, $description: 'a "quoted"\nline' },
        },
        f: { $type: "fontFamily", odd: { $value: ['A"B\\C', "serif"] } },
        w: { $type: "fontWeight", x: { $value: 450.5 }, k: { $value: "bold" } },
        d: { $type: "dimension", x: { $value: { value: -0.5, unit: "em" } } },
        t: { $type: "duration", x: { $value: { value: 1.5, unit: "s" } } },
        e: { $type: "cubicBezier", x: { $value: [0.2, -1, 0.2, 2] } },
        n: { $type: "number", x: { $value: 3 } },
        g: {
          $type: "gradient",
          one: { $value: [{ color: "{color.palette.black}", position: 0.5 }] },
        },
        y: {
          $type: "typography",
          x: {
            $value: {
              fontFamily: "{f.odd}",
              fontSize: { value: 1, unit: "rem" },
              fontWeight: "{w.x}",
              lineHeight: "{n.x}",
              letterSpacing: "{d.x}",
            },
          },
        },
      },
    ];
    const rust = emitRust(
      "synthetic",
      [resolveTheme("dark-1", docs("white")), resolveTheme("light", docs("black"))],
      "light",
      "// synthetic",
    );
    const dir = await mkdtemp(join(tmpdir(), "dtcg-rust-"));
    try {
      await mkdir(join(dir, "src"));
      const crate = join(PACKAGE, "..", "design-tokens-rs").replaceAll("\\", "/");
      await writeFile(
        join(dir, "Cargo.toml"),
        `[package]\nname = "synthetic"\nversion = "0.0.0"\nedition = "2021"\n[dependencies]\nsyntropic137-design-tokens = { path = "${crate}" }\n[workspace]\n`,
      );
      await writeFile(
        join(dir, "src", "lib.rs"),
        "#![deny(warnings)]\npub use syntropic137_design_tokens::*;\npub mod synthetic;\n",
      );
      await writeFile(join(dir, "src", "synthetic.rs"), rust);
      execFileSync("cargo", ["check", "--quiet", "--offline"], {
        cwd: dir,
        stdio: "pipe",
        env: { ...process.env, CARGO_TARGET_DIR: join(dir, "target") },
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 120_000);
});

describe("DS v1.1 fixes (xvzo6.6)", () => {
  it("judges text on a gradient against its weakest stop: no text colour may sit on brand tide", async () => {
    const { config, documents } = await loadDesign(DREAMSHIP);
    const { themes } = buildDesign(config, documents);
    for (const fg of ["color.palette.white", "color.palette.ink", "color.palette.ivory"]) {
      const failures = checkContrast(themes, [{ fg, bg: "gradient.brand", min: 4.5 }]);
      expect(failures.map((f) => f.theme).sort(), fg).toEqual(["dark", "light"]);
    }
    const white = checkContrast(themes, [
      { fg: "color.palette.white", bg: "gradient.brand", min: 4.5 },
    ]);
    // White on jade, the brightest stop: the critique's 1.61:1.
    expect(white[0].ratio).toBeCloseTo(1.61, 2);
  });

  it("splits borders: subtle is decorative, control and selected reach 3:1 on every surface", async () => {
    const { config, documents } = await loadDesign(DREAMSHIP);
    const { themes } = buildDesign(config, documents);
    const rules = ["control", "selected"].flatMap((b) =>
      ["page", "default", "raised"].map((s) => ({
        fg: `color.border.${b}`,
        bg: `color.surface.${s}`,
        min: 3,
      })),
    );
    expect(checkContrast(themes, rules)).toEqual([]);
    expect(config.contrast.filter((r) => r.fg === "color.border.subtle")).toEqual([]);
  });

  it("retires the kit's deep jade: light success is the 5.05:1 jade-ink", async () => {
    const { config, documents } = await loadDesign(DREAMSHIP);
    const { themes, json } = buildDesign(config, documents);
    expect(themes[0].tokens.some((t) => t.path === "color.palette.deep-jade")).toBe(false);
    expect(json.themes.light["color.status.success"]).toMatchObject({ value: { hex: "#0A7559" } });
  });
});

describe("gradient contrast gate (Codex xvzo6.6 p1)", () => {
  const grey = { colorSpace: "srgb", components: [0x75 / 255, 0x75 / 255, 0x75 / 255] };
  const theme = resolveTheme("t", [
    palette,
    {
      c: { $type: "color", grey: { $value: grey } },
      g: {
        $type: "gradient",
        bw: {
          $value: [
            { color: "{color.palette.black}", position: 0 },
            { color: "{color.palette.white}", position: 1 },
          ],
        },
        solid: { $value: [{ color: "{color.palette.black}", position: 0 }] },
      },
    },
  ]);

  it("fails text whose luminance the gradient crosses, though both stops pass", () => {
    const [failure] = checkContrast([theme], [{ fg: "c.grey", bg: "g.bw", min: 4.5 }]);
    expect(failure.ratio).toBeLessThan(1.05);
  });

  it("rejects a gradient as the foreground, even with one stop", () => {
    expect(() =>
      checkContrast([theme], [{ fg: "g.solid", bg: "color.palette.white", min: 3 }]),
    ).toThrow(/foreground must be a colour/);
  });
});
