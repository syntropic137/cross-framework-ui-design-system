// Resolved JSON: every value already computed for a renderer (linear-light
// colour, numeric dimensions, millisecond durations). No CSS syntax inside.

import { linearComponents } from "./color.js";
import { num } from "./format.js";
import type { Color, ResolvedTheme, ResolvedToken } from "./types.js";

export const RESOLVED_FORMAT = "syntropic137.resolved-tokens";
export const RESOLVED_FORMAT_VERSION = 1;

function color(c: Color) {
  return {
    hex: c.hex,
    srgb: c.components.map((v) => Number(num(v, 6))),
    linear: linearComponents(c).map((v) => Number(num(v, 6))),
    alpha: c.alpha,
  };
}

function value(token: ResolvedToken): unknown {
  switch (token.type) {
    case "color":
      return color(token.value);
    case "gradient":
      return {
        angle: token.value.angle,
        stops: token.value.stops.map((s) => ({ color: color(s.color), position: s.position })),
      };
    default:
      return token.value;
  }
}

export function emitResolvedJson(
  design: string,
  themes: readonly ResolvedTheme[],
  defaultTheme: string,
) {
  return {
    format: RESOLVED_FORMAT,
    formatVersion: RESOLVED_FORMAT_VERSION,
    design,
    defaultTheme,
    themes: Object.fromEntries(
      themes.map((theme) => [
        theme.name,
        Object.fromEntries(
          theme.tokens.map((token) => [
            token.path,
            {
              type: token.type,
              value: value(token),
              ...(token.aliasOf ? { aliasOf: token.aliasOf } : {}),
            },
          ]),
        ),
      ]),
    ),
  };
}
