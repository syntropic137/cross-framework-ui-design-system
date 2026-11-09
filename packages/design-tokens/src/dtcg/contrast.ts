// The contrast gate: a design declares which colour pairs must reach which ratio,
// and generation fails when any theme misses one.

import { contrastRatio } from "./color.js";
import type { Color, Gradient, ResolvedTheme } from "./types.js";

/** Samples per stop-to-stop segment: dense enough to land within 0.5% of any luminance crossing. */
const SEGMENT_SAMPLES = 256;

/**
 * Every colour a gradient paints, sampled: the stops plus points interpolated
 * between them in gamma-encoded sRGB (the CSS default for gradients), so a
 * foreground whose luminance falls between two stops is judged where it fails.
 */
export function gradientSamples(gradient: Gradient): Color[] {
  const stops = [...gradient.stops].sort((a, b) => a.position - b.position);
  const samples = stops.map((s) => s.color);
  for (let i = 0; i + 1 < stops.length; i++) {
    const a = stops[i].color;
    const b = stops[i + 1].color;
    for (let k = 1; k < SEGMENT_SAMPLES; k++) {
      const t = k / SEGMENT_SAMPLES;
      const mix = (x: number, y: number) => x + (y - x) * t;
      samples.push({
        components: [0, 1, 2].map((c) => mix(a.components[c], b.components[c])) as [
          number,
          number,
          number,
        ],
        alpha: mix(a.alpha, b.alpha),
        hex: "",
      });
    }
  }
  return samples;
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
      const bgs = bgColor ? [bgColor] : gradientSamples(bgGradient!);
      if (fg.alpha !== 1 || bgs.some((bg) => bg.alpha !== 1)) {
        throw new Error(
          `contrast rule ${rule.fg} on ${rule.bg}: translucent colours need a backdrop`,
        );
      }
      const ratio = Math.min(...bgs.map((bg) => contrastRatio(fg, bg)));
      if (ratio < rule.min) {
        failures.push({ theme: theme.name, fg: rule.fg, bg: rule.bg, min: rule.min, ratio });
      }
    }
  }
  return failures;
}
