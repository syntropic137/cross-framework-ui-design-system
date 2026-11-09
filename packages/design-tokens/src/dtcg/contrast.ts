// The contrast gate: a design declares which colour pairs must reach which ratio,
// and generation fails when any theme misses one.

import { contrastRatio } from "./color.js";
import type { Color, ResolvedTheme } from "./types.js";

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
    for (const token of theme.tokens) {
      if (token.type === "color") colors.set(token.path, token.value);
    }
    for (const rule of rules) {
      const fg = colors.get(rule.fg);
      const bg = colors.get(rule.bg);
      if (!fg || !bg) {
        throw new Error(
          `contrast rule ${rule.fg} on ${rule.bg}: no such colour in theme ${theme.name}`,
        );
      }
      if (fg.alpha !== 1 || bg.alpha !== 1) {
        throw new Error(
          `contrast rule ${rule.fg} on ${rule.bg}: translucent colours need a backdrop`,
        );
      }
      const ratio = contrastRatio(fg, bg);
      if (ratio < rule.min) {
        failures.push({ theme: theme.name, fg: rule.fg, bg: rule.bg, min: rule.min, ratio });
      }
    }
  }
  return failures;
}
