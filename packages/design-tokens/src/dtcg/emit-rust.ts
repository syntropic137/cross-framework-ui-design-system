// Typed Rust emitter: one `Theme` struct with a field per token and one const
// per theme, every value resolved at generation time. The renderer reads typed
// values and never parses CSS. Types live in the hand-written crate root.

import { linearComponents } from "./color.js";
import { num } from "./format.js";
import type { Color, Dimension, ResolvedTheme, ResolvedToken } from "./types.js";

const RUST_TYPE: Record<ResolvedToken["type"], string> = {
  color: "Color",
  dimension: "Dimension",
  duration: "Duration",
  cubicBezier: "CubicBezier",
  fontFamily: "&'static [&'static str]",
  fontWeight: "f32",
  number: "f32",
  typography: "Typography",
  gradient: "Gradient",
};

const UNIT: Record<Dimension["unit"], string> = {
  px: "Unit::Px",
  rem: "Unit::Rem",
  em: "Unit::Em",
};

const F32_MAX = 3.4028234663852886e38;

/** `color.content.primary` -> `color_content_primary`. */
export function rustField(path: string): string {
  return path.replaceAll(/[.-]/g, "_");
}

/** A Rust f32 literal: always has a decimal point or exponent; refuses what f32 cannot hold. */
function f32(value: number): string {
  if (!Number.isFinite(value) || Math.abs(value) > F32_MAX) {
    throw new Error(`${value} does not fit a Rust f32`);
  }
  const text = num(value, 6);
  return /[.e]/.test(text) ? text : `${text}.0`;
}

/** A Rust string literal. Control characters are rejected upstream by the resolver. */
export function rustString(value: string): string {
  return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

/** Doc-comment text: one line, no control characters. */
function docLine(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replaceAll(/[\u0000-\u001f\u007f]+/g, " ").trim();
}

function color(c: Color): string {
  const srgb = c.components.map(f32).join(", ");
  const linear = linearComponents(c).map(f32).join(", ");
  return `Color { hex: ${rustString(c.hex)}, srgb: [${srgb}], linear: [${linear}], alpha: ${f32(c.alpha)} }`;
}

function dimension(d: Dimension): string {
  return `Dimension { value: ${f32(d.value)}, unit: ${UNIT[d.unit]} }`;
}

function families(list: readonly string[]): string {
  return `&[${list.map(rustString).join(", ")}]`;
}

function value(token: ResolvedToken): string {
  switch (token.type) {
    case "color":
      return color(token.value);
    case "dimension":
      return dimension(token.value);
    case "duration":
      return `Duration { ms: ${f32(token.value.ms)} }`;
    case "cubicBezier":
      return `[${token.value.map(f32).join(", ")}]`;
    case "fontFamily":
      return families(token.value);
    case "fontWeight":
    case "number":
      return f32(token.value);
    case "typography": {
      const t = token.value;
      return `Typography { font_family: ${families(t.fontFamily)}, font_size: ${dimension(t.fontSize)}, font_weight: ${f32(t.fontWeight)}, line_height: ${f32(t.lineHeight)}, letter_spacing: ${dimension(t.letterSpacing)} }`;
    }
    case "gradient": {
      const stops = token.value.stops.map(
        (s) => `GradientStop { color: ${color(s.color)}, position: ${f32(s.position)} }`,
      );
      return `Gradient { angle_deg: ${f32(token.value.angle)}, stops: &[${stops.join(", ")}] }`;
    }
  }
}

function constName(theme: string): string {
  return theme.toUpperCase().replaceAll("-", "_");
}

/** Themes must agree on paths and types; every theme is put in the first theme's order. */
function alignThemes(themes: readonly ResolvedTheme[]): ResolvedTheme[] {
  const [first] = themes;
  if (!first) throw new Error("emitRust needs at least one theme");
  return themes.map((theme) => {
    const byPath = new Map(theme.tokens.map((t) => [t.path, t]));
    if (byPath.size !== first.tokens.length) {
      throw new Error(`theme ${theme.name} does not have the same tokens as ${first.name}`);
    }
    const tokens = first.tokens.map((f) => {
      const t = byPath.get(f.path);
      if (!t || t.type !== f.type) {
        throw new Error(`theme ${theme.name}: ${f.path} is missing or not a ${f.type}`);
      }
      return t;
    });
    return { name: theme.name, tokens };
  });
}

export function emitRust(
  design: string,
  themes: readonly ResolvedTheme[],
  defaultTheme: string,
  header: string,
): string {
  const aligned = alignThemes(themes);
  const fields = new Map<string, ResolvedToken>();
  for (const token of aligned[0].tokens) {
    const field = rustField(token.path);
    const clash = fields.get(field);
    if (clash) throw new Error(`Rust field ${field} is both ${clash.path} and ${token.path}`);
    fields.set(field, token);
  }
  const lines = [
    header,
    `//! ${design} design tokens, every theme resolved at generation time.`,
    "",
    "#[allow(unused_imports)]",
    "use crate::{Color, CubicBezier, Dimension, Duration, Gradient, GradientStop, Typography, Unit};",
    "",
    "/// Every token of one theme. Field = DTCG path with `.` and `-` as `_`.",
    "#[derive(Debug, Clone, Copy, PartialEq)]",
    "pub struct Theme {",
  ];
  for (const [field, token] of fields) {
    const description = token.description ? `: ${docLine(token.description)}` : "";
    lines.push(`    /// \`${token.path}\`${description}`);
    lines.push(`    pub ${field}: ${RUST_TYPE[token.type]},`);
  }
  lines.push("}", "");
  for (const theme of aligned) {
    lines.push(`/// The \`${theme.name}\` theme.`);
    lines.push(`pub const ${constName(theme.name)}: Theme = Theme {`);
    for (const token of theme.tokens) lines.push(`    ${rustField(token.path)}: ${value(token)},`);
    lines.push("};", "");
  }
  if (!aligned.some((t) => t.name === defaultTheme)) {
    throw new Error(`default theme ${defaultTheme} is not one of the themes`);
  }
  lines.push(`/// The theme a consumer starts in.`);
  lines.push(`pub const DEFAULT: &Theme = &${constName(defaultTheme)};`, "");
  lines.push("/// Every theme by name, in source order.");
  lines.push(
    `pub const THEMES: &[(&str, &Theme)] = &[${aligned.map((t) => `(${rustString(t.name)}, &${constName(t.name)})`).join(", ")}];`,
  );
  lines.push("");
  return lines.join("\n");
}
