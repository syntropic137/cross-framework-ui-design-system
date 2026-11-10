// CSS emitter: custom properties in `@layer tokens`. The default theme is a full
// block; every other theme states only what differs from it.

import { cssName, num } from "./format.js";
import type { Color, Dimension, ResolvedTheme, ResolvedToken } from "./types.js";

/** Options beyond the themes: reference-only paths and the design marker (xvzo6.2 C1, C2). */
export type CssOptions = {
  /**
   * Paths of the raw reference palette (reference `color.*`, `gradient.*`). Not
   * contract: emitted as `--<prefix>-ref-<path>`, never under a contract name.
   */
  referencePaths?: ReadonlySet<string>;
  /** Emits `--<prefix>-design: "<design>"` in the default block, so a page can prove it loaded one tokens sheet. */
  design?: string;
};

export type CssTheme = {
  theme: ResolvedTheme;
  /** Selectors that switch this theme on, e.g. `[data-theme="light"]`. */
  selectors: string[];
  /** Also applied under a media query, e.g. the system light preference. */
  media?: { query: string; selector: string };
};

const GENERIC_FAMILIES = new Set([
  "serif",
  "sans-serif",
  "monospace",
  "cursive",
  "fantasy",
  "system-ui",
  "ui-serif",
  "ui-sans-serif",
  "ui-monospace",
  "ui-rounded",
  "-apple-system",
]);

export function cssColor(color: Color): string {
  if (color.alpha === 1) return color.hex;
  const [r, g, b] = color.components.map((c) => Math.round(c * 255));
  return `rgb(${r} ${g} ${b} / ${num(color.alpha, 3)})`;
}

function dimension(d: Dimension): string {
  return `${num(d.value)}${d.unit}`;
}

/** A CSS string literal. Control characters are rejected upstream by the resolver. */
function cssString(value: string): string {
  return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

function fontFamily(families: readonly string[]): string {
  return families.map((f) => (GENERIC_FAMILIES.has(f) ? f : cssString(f))).join(", ");
}

/** One token as one or more `[name, value]` declarations (a typography composite expands). */
export function cssDeclarations(
  prefix: string,
  token: ResolvedToken,
  reference = false,
): [string, string][] {
  const name = cssName(reference ? `${prefix}-ref` : prefix, token.path);
  switch (token.type) {
    case "color":
      return [[name, cssColor(token.value)]];
    case "dimension":
      return [[name, dimension(token.value)]];
    case "duration":
      return [[name, `${num(token.value.ms)}ms`]];
    case "cubicBezier":
      return [[name, `cubic-bezier(${token.value.map((v) => num(v)).join(", ")})`]];
    case "fontFamily":
      return [[name, fontFamily(token.value)]];
    case "fontWeight":
    case "number":
      return [[name, num(token.value)]];
    case "typography": {
      const t = token.value;
      return [
        [`${name}-font-family`, fontFamily(t.fontFamily)],
        [`${name}-font-size`, dimension(t.fontSize)],
        [`${name}-font-weight`, num(t.fontWeight)],
        [`${name}-line-height`, num(t.lineHeight)],
        [`${name}-letter-spacing`, dimension(t.letterSpacing)],
        [
          `${name}-font-feature-settings`,
          t.fontFeatures.length ? t.fontFeatures.map((f) => `"${f}"`).join(", ") : "normal",
        ],
      ];
    }
    case "gradient": {
      const stops = token.value.stops.map(
        (s) => `${cssColor(s.color)} ${num(s.position * 100, 2)}%`,
      );
      return [[name, `linear-gradient(${num(token.value.angle)}deg, ${stops.join(", ")})`]];
    }
  }
}

function declarations(
  prefix: string,
  theme: ResolvedTheme,
  referencePaths: ReadonlySet<string>,
): Map<string, string> {
  return new Map(
    theme.tokens.flatMap((token) => cssDeclarations(prefix, token, referencePaths.has(token.path))),
  );
}

function block(selector: string, decls: Map<string, string>, indent: string): string {
  const body = [...decls].map(([n, v]) => `${indent}  --${n}: ${v};`).join("\n");
  return `${indent}${selector} {\n${body}\n${indent}}`;
}

export function emitCss(
  prefix: string,
  themes: readonly CssTheme[],
  header: string,
  options: CssOptions = {},
): string {
  const [base, ...rest] = themes;
  if (!base) throw new Error("emitCss needs at least one theme");
  const referencePaths = options.referencePaths ?? new Set<string>();
  const baseDecls = declarations(prefix, base.theme, referencePaths);
  const marker: [string, string][] =
    options.design === undefined ? [] : [[`${prefix}-design`, cssString(options.design)]];
  if (marker.length && baseDecls.has(marker[0][0])) {
    throw new Error(`a token is named --${marker[0][0]}, which the design marker owns`);
  }
  const parts = [block(base.selectors.join(",\n  "), new Map([...marker, ...baseDecls]), "  ")];
  for (const theme of rest) {
    const themeDecls = declarations(prefix, theme.theme, referencePaths);
    const diff = new Map([...themeDecls].filter(([n, v]) => baseDecls.get(n) !== v));
    for (const n of baseDecls.keys()) {
      if (!diff.has(n) && !themeDecls.has(n)) {
        throw new Error(`theme ${theme.theme.name} lacks --${n}`);
      }
    }
    parts.push(block(theme.selectors.join(",\n  "), diff, "  "));
    if (theme.media) {
      parts.push(
        `  @media ${theme.media.query} {\n${block(theme.media.selector, diff, "    ")}\n  }`,
      );
    }
  }
  return `${header}\n@layer tokens {\n${parts.join("\n\n")}\n}\n`;
}

/**
 * The alias sheet (xvzo6.2 C2): old names as `var()` of contract names, one
 * minor release only. A typography target becomes a `font` shorthand. Every
 * target must be a contract token (never a reference path); an old name may
 * not shadow a contract name.
 */
export function emitAliases(
  prefix: string,
  aliases: Readonly<Record<string, string>>,
  contract: ResolvedTheme,
  header: string,
): string {
  const byPath = new Map(contract.tokens.map((t) => [t.path, t]));
  const contractNames = new Set(
    contract.tokens.flatMap((t) => cssDeclarations(prefix, t).map(([n]) => n)),
  );
  const lines = Object.entries(aliases).map(([old, path]) => {
    if (!/^[a-z][a-z0-9-]*$/.test(old))
      throw new Error(`alias name "${old}" must be lower-case kebab`);
    if (contractNames.has(old) || old === `${prefix}-design`) {
      throw new Error(`alias --${old} would shadow a contract name`);
    }
    const token = byPath.get(path);
    if (!token) throw new Error(`alias --${old} targets ${path}, which is not a contract token`);
    const v = (suffix = "") => `var(--${cssName(prefix, path)}${suffix})`;
    const value =
      token.type === "typography"
        ? `${v("-font-weight")} ${v("-font-size")}/${v("-line-height")} ${v("-font-family")}`
        : v();
    return `    --${old}: ${value};`;
  });
  return `${header}\n@layer tokens {\n  :root,\n  [data-theme] {\n${lines.join("\n")}\n  }\n}\n`;
}
