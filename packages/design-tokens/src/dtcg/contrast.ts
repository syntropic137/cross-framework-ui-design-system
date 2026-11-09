// The contrast gate: a design declares which colour pairs must reach which ratio,
// and generation fails when any theme misses one.

import { contrastRatio, relativeLuminance } from "./color.js";
import type { Color, Gradient, ResolvedTheme } from "./types.js";

/**
 * The luminance range a gradient paints, exactly. Stops are fixed up as CSS
 * does (in order; a position below an earlier one is raised to it), equal
 * positions are hard edges (no blend between them), and each blended segment
 * mixes gamma-encoded sRGB (the CSS default). On a segment, luminance is a
 * positively weighted sum of the convex sRGB transfer of linear mixes, so it is
 * convex in t: its maximum is at an end and its minimum is found by ternary
 * search. Returns [min, max] per painted piece.
 */
export function gradientLuminanceRanges(gradient: Gradient): [number, number][] {
  let floor = -Infinity;
  const stops = gradient.stops.map((s) => {
    floor = Math.max(floor, s.position);
    return { color: s.color, position: floor };
  });
  const ranges: [number, number][] = stops.map((s) => {
    const l = relativeLuminance(s.color);
    return [l, l];
  });
  for (let i = 0; i + 1 < stops.length; i++) {
    const [a, b] = [stops[i], stops[i + 1]];
    if (b.position === a.position) continue; // hard edge: nothing painted between
    const at = (t: number) =>
      relativeLuminance({
        components: [0, 1, 2].map(
          (c) => a.color.components[c] + (b.color.components[c] - a.color.components[c]) * t,
        ) as [number, number, number],
        alpha: 1,
        hex: "",
      });
    let lo = 0;
    let hi = 1;
    for (let k = 0; k < 200; k++) {
      const m1 = lo + (hi - lo) / 3;
      const m2 = hi - (hi - lo) / 3;
      if (at(m1) <= at(m2)) hi = m2;
      else lo = m1;
    }
    const ends = [at(0), at(1)];
    ranges.push([Math.min(at((lo + hi) / 2), ...ends), Math.max(...ends)]);
  }
  return ranges;
}

/** Lowest WCAG contrast of a colour against anything in a luminance range. */
function minContrastInRange(fg: Color, [min, max]: [number, number]): number {
  const l = relativeLuminance(fg);
  const nearest = Math.min(max, Math.max(min, l));
  return (Math.max(l, nearest) + 0.05) / (Math.min(l, nearest) + 0.05);
}

export type ContrastRule = { fg: string; bg: string; min: number; why?: string };

export type ContrastFailure = {
  theme: string;
  fg: string;
  bg: string;
  min: number;
  ratio: number;
};

export function checkContrast(
  themes: readonly ResolvedTheme[],
  rules: readonly ContrastRule[],
): ContrastFailure[] {
  for (const rule of rules) {
    if (typeof rule.fg !== "string" || typeof rule.bg !== "string") {
      throw new Error(`contrast rule ${JSON.stringify(rule)}: fg and bg must be token paths`);
    }
    if (
      typeof rule.min !== "number" ||
      !Number.isFinite(rule.min) ||
      rule.min < 1 ||
      rule.min > 21
    ) {
      throw new Error(`contrast rule ${rule.fg} on ${rule.bg}: min must be a number in 1..21`);
    }
  }
  const failures: ContrastFailure[] = [];
  for (const theme of themes) {
    const colors = new Map<string, Color>();
    const gradients = new Map<string, Gradient>();
    for (const token of theme.tokens) {
      if (token.type === "color") colors.set(token.path, token.value);
      if (token.type === "gradient") gradients.set(token.path, token.value);
    }
    for (const rule of rules) {
      // The foreground must be a plain colour: a gradient cannot be a text or border colour.
      const fg = colors.get(rule.fg);
      const bgColor = colors.get(rule.bg);
      const bgGradient = gradients.get(rule.bg);
      if (!fg || (!bgColor && !bgGradient)) {
        throw new Error(
          `contrast rule ${rule.fg} on ${rule.bg}: foreground must be a colour and background a colour or gradient in theme ${theme.name}`,
        );
      }
      const bgs = bgColor ? [bgColor] : bgGradient!.stops.map((stop) => stop.color);
      if (fg.alpha !== 1 || bgs.some((bg) => bg.alpha !== 1)) {
        throw new Error(
          `contrast rule ${rule.fg} on ${rule.bg}: translucent colours need a backdrop`,
        );
      }
      const ratio = bgColor
        ? contrastRatio(fg, bgColor)
        : Math.min(...gradientLuminanceRanges(bgGradient!).map((r) => minContrastInRange(fg, r)));
      if (ratio < rule.min) {
        failures.push({ theme: theme.name, fg: rule.fg, bg: rule.bg, min: rule.min, ratio });
      }
    }
  }
  return failures;
}
