// sRGB colour math: transfer function and WCAG 2.x contrast.

import type { Color } from "./types.js";

/** sRGB electro-optical transfer: encoded 0..1 to linear light 0..1. */
export function srgbToLinear(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

export function linearComponents(color: Color): [number, number, number] {
  const [r, g, b] = color.components;
  return [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)];
}

/** WCAG relative luminance. */
export function relativeLuminance(color: Color): number {
  const [r, g, b] = linearComponents(color);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two opaque colours, 1..21. */
export function contrastRatio(a: Color, b: Color): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export function hexFromComponents(components: readonly number[]): string {
  return `#${components
    .map((c) =>
      Math.round(c * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")
    .toUpperCase()}`;
}
