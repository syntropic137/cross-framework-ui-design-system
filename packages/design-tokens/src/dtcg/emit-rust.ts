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
  fontWeight: "u16",
  number: "f32",
  typography: "Typography",
  gradient: "Gradient",
};

const UNIT: Record<Dimension["unit"], string> = {
  px: "Unit::Px",
  rem: "Unit::Rem",
  em: "Unit::Em",
};

/** `color.content.primary` -> `color_content_primary`. */
export function rustField(path: string): string {
  return path.replaceAll(/[.-]/g, "_");
}

/** A Rust float literal: always has a decimal point or exponent. */
function f32(value: number): string {
  const text = num(value, 6);
  return /[.e]/.test(text) ? text : `${text}.0`;
}

function color(c: Color): string {
  const srgb = c.components.map(f32).join(", ");
  const linear = linearComponents(c).map(f32).join(", ");
  return `Color { hex: "${c.hex}", srgb: [${srgb}], linear: [${linear}], alpha: ${f32(c.alpha)} }`;
}

function dimension(d: Dimension): string {
  return `Dimension { value: ${f32(d.value)}, unit: ${UNIT[d.unit]} }`;
}

function families(list: readonly string[]): string {
  return `&[${list.map((f) => JSON.stringify(f)).join(", ")}]`;
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
      return String(Math.round(token.value));
    case "number":
      return f32(token.value);
    case "typography": {
      const t = token.value;
      return `Typography { font_family: ${families(t.fontFamily)}, font_size: ${dimension(t.fontSize)}, font_weight: ${Math.round(t.fontWeight)}, line_height: ${f32(t.lineHeight)}, letter_spacing: ${dimension(t.letterSpacing)} }`;
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

export function emitRust(
  design: string,
  themes: readonly ResolvedTheme[],
  defaultTheme: string,
  header: string,
): string {
  const [first] = themes;
  if (!first) throw new Error("emitRust needs at least one theme");
  const fields = new Map<string, ResolvedToken>();
  for (const token of first.tokens) {
    const field = rustField(token.path);
    const clash = fields.get(field);
    if (clash) throw new Error(`Rust field ${field} is both ${clash.path} and ${token.path}`);
    fields.set(field, token);
  }
  for (const theme of themes) {
    const paths = theme.tokens.map((t) => `${t.path}:${t.type}`).join("\n");
    if (paths !== first.tokens.map((t) => `${t.path}:${t.type}`).join("\n")) {
      throw new Error(
        `theme ${theme.name} does not have the same tokens, types and order as ${first.name}`,
      );
    }
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
    lines.push(`    /// \`${token.path}\`${token.description ? `: ${token.description}` : ""}`);
    lines.push(`    pub ${field}: ${RUST_TYPE[token.type]},`);
  }
  lines.push("}", "");
  for (const theme of themes) {
    lines.push(`/// The \`${theme.name}\` theme.`);
    lines.push(`pub const ${constName(theme.name)}: Theme = Theme {`);
    for (const token of theme.tokens) lines.push(`    ${rustField(token.path)}: ${value(token)},`);
    lines.push("};", "");
  }
  lines.push(`/// The theme a consumer starts in.`);
  lines.push(`pub const DEFAULT: &Theme = &${constName(defaultTheme)};`, "");
  lines.push("/// Every theme by name, in source order.");
  lines.push(
    `pub const THEMES: &[(&str, &Theme)] = &[${themes.map((t) => `("${t.name}", &${constName(t.name)})`).join(", ")}];`,
  );
  lines.push("");
  return lines.join("\n");
}
