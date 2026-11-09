// CSS emitter: custom properties in `@layer tokens`. The default theme is a full
// block; every other theme states only what differs from it.

import { cssName, num } from "./format.js";
import type { Color, Dimension, ResolvedTheme, ResolvedToken } from "./types.js";

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
export function cssDeclarations(prefix: string, token: ResolvedToken): [string, string][] {
  const name = cssName(prefix, token.path);
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

function declarations(prefix: string, theme: ResolvedTheme): Map<string, string> {
  return new Map(theme.tokens.flatMap((token) => cssDeclarations(prefix, token)));
}

function block(selector: string, decls: Map<string, string>, indent: string): string {
  const body = [...decls].map(([n, v]) => `${indent}  --${n}: ${v};`).join("\n");
  return `${indent}${selector} {\n${body}\n${indent}}`;
}

export function emitCss(prefix: string, themes: readonly CssTheme[], header: string): string {
  const [base, ...rest] = themes;
  if (!base) throw new Error("emitCss needs at least one theme");
  const baseDecls = declarations(prefix, base.theme);
  const parts = [block(base.selectors.join(",\n  "), baseDecls, "  ")];
  for (const theme of rest) {
    const diff = new Map(
      [...declarations(prefix, theme.theme)].filter(([n, v]) => baseDecls.get(n) !== v),
    );
    for (const n of baseDecls.keys()) {
      if (!diff.has(n) && !declarations(prefix, theme.theme).has(n)) {
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
