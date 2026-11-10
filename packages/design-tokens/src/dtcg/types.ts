// Resolved DTCG token model (Design Tokens Community Group format, 2025.10).
//
// The source files are DTCG JSON; everything downstream (CSS, resolved JSON,
// typed Rust) is emitted from these resolved values, never from CSS strings.

export type DtcgType =
  | "color"
  | "dimension"
  | "duration"
  | "cubicBezier"
  | "fontFamily"
  | "fontWeight"
  | "number"
  | "typography"
  | "gradient";

export const DTCG_TYPES: readonly DtcgType[] = [
  "color",
  "dimension",
  "duration",
  "cubicBezier",
  "fontFamily",
  "fontWeight",
  "number",
  "typography",
  "gradient",
];

/** An sRGB colour, components 0..1 (DTCG 2025.10 colour object). */
export type Color = { components: [number, number, number]; alpha: number; hex: string };

/** `em` is an extension beyond DTCG's px/rem, used only for type-relative sizes (tracking, key radius). */
export type DimensionUnit = "px" | "rem" | "em";
export type Dimension = { value: number; unit: DimensionUnit };

/** Durations are normalised to milliseconds. */
export type Duration = { ms: number };

export type CubicBezier = [number, number, number, number];

export type Typography = {
  fontFamily: string[];
  fontSize: Dimension;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: Dimension;
  /**
   * OpenType feature tags switched on, e.g. `tnum` for tabular figures. An
   * extension (`$extensions["com.syntropic137.typography"].fontFeatures`):
   * DTCG typography has no such property. Empty when unset.
   */
  fontFeatures: string[];
};

export type GradientStop = { color: Color; position: number };

/** `angle` (degrees, CSS convention: 180 = top to bottom) comes from `$extensions["com.syntropic137.gradient"]`, since DTCG gradients carry no direction. */
export type Gradient = { angle: number; stops: GradientStop[] };

export type TokenValue =
  | { type: "color"; value: Color }
  | { type: "dimension"; value: Dimension }
  | { type: "duration"; value: Duration }
  | { type: "cubicBezier"; value: CubicBezier }
  | { type: "fontFamily"; value: string[] }
  | { type: "fontWeight"; value: number }
  | { type: "number"; value: number }
  | { type: "typography"; value: Typography }
  | { type: "gradient"; value: Gradient };

export type ResolvedToken = TokenValue & {
  /** Dot path, e.g. `color.content.primary`. */
  path: string;
  /** The alias the source gave, e.g. `{color.palette.ivory}`, when the value was one. */
  aliasOf?: string;
  description?: string;
};

/** One theme: every token resolved, in source order. */
export type ResolvedTheme = { name: string; tokens: ResolvedToken[] };

export class DtcgError extends Error {
  constructor(path: string, message: string) {
    super(`${path || "<root>"}: ${message}`);
    this.name = "DtcgError";
  }
}
