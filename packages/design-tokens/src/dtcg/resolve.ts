// DTCG reader: merge layer documents, inherit group `$type`, resolve aliases,
// and validate every value into the typed model. Zero dependencies.

import { hexFromComponents } from "./color.js";
import {
  DTCG_TYPES,
  DtcgError,
  type Color,
  type CubicBezier,
  type Dimension,
  type DimensionUnit,
  type DtcgType,
  type Duration,
  type Gradient,
  type ResolvedTheme,
  type ResolvedToken,
  type TokenValue,
  type Typography,
} from "./types.js";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type JsonObject = { [key: string]: Json };

type RawToken = {
  path: string;
  type?: DtcgType;
  value: Json;
  description?: string;
  extensions?: JsonObject;
};

const NAME = /^[a-z0-9][a-z0-9-]*$/;
const ALIAS = /^\{([a-z0-9-]+(?:\.[a-z0-9-]+)*)\}$/;
const GRADIENT_EXTENSION = "com.syntropic137.gradient";
const TYPOGRAPHY_EXTENSION = "com.syntropic137.typography";
const FEATURE_TAG = /^[a-z0-9]{4}$/;

function isObject(value: Json | undefined): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const has = (object: JsonObject, key: string): boolean => Object.hasOwn(object, key);

/** Group and token properties this reader understands. */
const GROUP_KEYS = new Set(["$type", "$description", "$extensions", "$deprecated"]);
const TOKEN_KEYS = new Set([...GROUP_KEYS, "$value"]);

/**
 * DTCG structure this reader does not implement. Rejected loudly so no token is
 * silently dropped: `$root`, `$extends` and JSON Pointer `$ref`.
 */
function rejectUnsupported(node: JsonObject, path: string, allowed: ReadonlySet<string>): void {
  for (const key of Object.keys(node)) {
    if (key.startsWith("$") && !allowed.has(key)) {
      throw new DtcgError(path, `${key} is not supported by this reader`);
    }
  }
}

/** Deep-merge layer documents. Groups merge; a token path defined twice is an error. */
export function mergeDocuments(documents: readonly Json[]): JsonObject {
  const merged: JsonObject = Object.create(null) as JsonObject;
  const mergeInto = (target: JsonObject, source: JsonObject, path: string): void => {
    rejectUnsupported(source, path, has(source, "$value") ? TOKEN_KEYS : GROUP_KEYS);
    for (const [key, value] of Object.entries(source)) {
      const childPath = path ? `${path}.${key}` : key;
      if (key.startsWith("$")) {
        // A group's own metadata: first one wins for $description, $type must agree.
        if (key === "$type" && has(target, "$type") && target.$type !== value) {
          throw new DtcgError(
            path,
            `$type ${String(value)} conflicts with ${String(target.$type)}`,
          );
        }
        if (!has(target, key)) target[key] = value;
        continue;
      }
      if (!isObject(value)) throw new DtcgError(childPath, "expected a token or group object");
      if (!has(target, key)) {
        if (has(value, "$value")) {
          rejectUnsupported(value, childPath, TOKEN_KEYS);
          target[key] = value;
        } else {
          target[key] = Object.create(null) as JsonObject;
          mergeInto(target[key] as JsonObject, value, childPath);
        }
        continue;
      }
      const existing = target[key];
      if (has(value, "$value") || (isObject(existing) && has(existing, "$value"))) {
        throw new DtcgError(childPath, "token defined in more than one document");
      } else {
        mergeInto(existing as JsonObject, value, childPath);
      }
    }
  };
  for (const document of documents) {
    if (!isObject(document)) throw new DtcgError("", "a token document must be an object");
    mergeInto(merged, document, "");
  }
  return merged;
}

function collect(
  group: JsonObject,
  path: string,
  inherited: DtcgType | undefined,
  out: RawToken[],
): void {
  const groupType = has(group, "$type") ? parseType(group.$type, path) : inherited;
  for (const [key, node] of Object.entries(group)) {
    if (key.startsWith("$")) continue;
    const childPath = path ? `${path}.${key}` : key;
    if (!NAME.test(key)) throw new DtcgError(childPath, `name "${key}" must match ${NAME.source}`);
    if (!isObject(node)) throw new DtcgError(childPath, "expected a token or group object");
    if (has(node, "$value")) {
      const type = has(node, "$type") ? parseType(node.$type, childPath) : groupType;
      out.push({
        path: childPath,
        type,
        value: node.$value as Json,
        description: typeof node.$description === "string" ? node.$description : undefined,
        extensions: isObject(node.$extensions) ? node.$extensions : undefined,
      });
    } else {
      collect(node, childPath, groupType, out);
    }
  }
}

function parseType(value: Json, path: string): DtcgType {
  if (typeof value === "string" && (DTCG_TYPES as readonly string[]).includes(value)) {
    return value as DtcgType;
  }
  throw new DtcgError(path, `unsupported $type ${JSON.stringify(value)}`);
}

/** Resolve one theme from its layer documents (reference, semantic, component, spatial). */
export function resolveTheme(name: string, documents: readonly Json[]): ResolvedTheme {
  const raw: RawToken[] = [];
  collect(mergeDocuments(documents), "", undefined, raw);
  const byPath = new Map(raw.map((token) => [token.path, token]));
  const resolved = new Map<string, ResolvedToken>();
  const inProgress: string[] = [];

  const resolveToken = (path: string, from: string): ResolvedToken => {
    const done = resolved.get(path);
    if (done) return done;
    const token = byPath.get(path);
    if (!token) throw new DtcgError(from, `alias to unknown token {${path}}`);
    if (inProgress.includes(path)) {
      throw new DtcgError(path, `alias cycle: ${[...inProgress, path].join(" -> ")}`);
    }
    inProgress.push(path);
    let result: ResolvedToken;
    const alias = typeof token.value === "string" ? ALIAS.exec(token.value) : null;
    if (alias) {
      const target = resolveToken(alias[1], path);
      if (token.type && token.type !== target.type) {
        throw new DtcgError(path, `$type ${token.type} aliases a ${target.type} token`);
      }
      // An alias may restate typography features; they replace the target's.
      let value = target.value;
      if (token.extensions?.[TYPOGRAPHY_EXTENSION] !== undefined) {
        if (target.type !== "typography") {
          throw new DtcgError(path, "fontFeatures apply only to typography tokens");
        }
        value = { ...(target.value as Typography), fontFeatures: parseFontFeatures(token) };
      }
      result = {
        type: target.type,
        value,
        path,
        aliasOf: token.value as string,
        description: token.description,
      } as ResolvedToken;
    } else {
      if (!token.type) throw new DtcgError(path, "no $type on the token or any parent group");
      result = {
        ...parseValue(token, (p) => resolveToken(p, path)),
        path,
        description: token.description,
      } as ResolvedToken;
    }
    inProgress.pop();
    resolved.set(path, result);
    return result;
  };

  return { name, tokens: raw.map((token) => resolveToken(token.path, token.path)) };
}

type Lookup = (path: string) => ResolvedToken;

type ValueOf = {
  color: Color;
  dimension: Dimension;
  duration: Duration;
  cubicBezier: CubicBezier;
  fontFamily: string[];
  fontWeight: number;
  number: number;
  typography: Typography;
  gradient: Gradient;
};

/** A value that may be a literal or an alias to a token of the given type. */
function sub<T extends DtcgType>(
  value: Json,
  type: T,
  path: string,
  lookup: Lookup,
  literal: (v: Json, p: string) => ValueOf[T],
): ValueOf[T] {
  rejectRef(value, path);
  const alias = typeof value === "string" ? ALIAS.exec(value) : null;
  if (!alias) return literal(value, path);
  const target = lookup(alias[1]);
  if (target.type !== type)
    throw new DtcgError(path, `expected a ${type} alias, got ${target.type}`);
  return target.value as ValueOf[T];
}

function rejectRef(value: Json, path: string): void {
  if (isObject(value) && has(value, "$ref")) {
    throw new DtcgError(path, "$ref (JSON Pointer) references are not supported by this reader");
  }
}

function parseValue(token: RawToken, lookup: Lookup): TokenValue {
  const { path, value } = token;
  rejectRef(value, path);
  switch (token.type) {
    case "color":
      return { type: "color", value: parseColor(value, path) };
    case "dimension":
      return { type: "dimension", value: parseDimension(value, path) };
    case "duration":
      return { type: "duration", value: parseDuration(value, path) };
    case "cubicBezier":
      return { type: "cubicBezier", value: parseCubicBezier(value, path) };
    case "fontFamily":
      return { type: "fontFamily", value: parseFontFamily(value, path) };
    case "fontWeight":
      return { type: "fontWeight", value: parseFontWeight(value, path) };
    case "number":
      return { type: "number", value: parseNumber(value, path) };
    case "typography":
      return { type: "typography", value: parseTypography(token, lookup) };
    case "gradient":
      return { type: "gradient", value: parseGradient(token, lookup) };
    default:
      throw new DtcgError(path, "no $type on the token or any parent group");
  }
}

function finite(value: number, path: string): number {
  if (!Number.isFinite(value)) throw new DtcgError(path, "value overflows after conversion");
  return value;
}

/** Control characters cannot be written safely into CSS or Rust strings. */
function plainString(value: string, path: string): string {
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(value)) {
    throw new DtcgError(path, "control characters are not allowed in names");
  }
  return value;
}

function parseNumber(value: Json, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new DtcgError(path, `expected a number, got ${JSON.stringify(value)}`);
  }
  return value;
}

function parseColor(value: Json, path: string): Color {
  if (!isObject(value) || value.colorSpace !== "srgb") {
    throw new DtcgError(path, "colour must be a DTCG colour object with colorSpace srgb");
  }
  const components = value.components;
  if (
    !Array.isArray(components) ||
    components.length !== 3 ||
    !components.every((c) => typeof c === "number" && c >= 0 && c <= 1)
  ) {
    throw new DtcgError(path, "colour components must be three numbers in 0..1");
  }
  const alpha = value.alpha === undefined ? 1 : parseNumber(value.alpha, `${path}.alpha`);
  if (alpha < 0 || alpha > 1) throw new DtcgError(path, "alpha must be in 0..1");
  const hex = hexFromComponents(components as number[]);
  if (value.hex !== undefined && String(value.hex).toUpperCase() !== hex) {
    throw new DtcgError(path, `hex ${String(value.hex)} disagrees with components (${hex})`);
  }
  // Quantise to 8 bits per channel: CSS, JSON, Rust and the contrast gate all see
  // exactly the colour the hex states, so the gate checks what ships.
  const quantised = (components as number[]).map((c) => Math.round(c * 255) / 255);
  return { components: quantised as [number, number, number], alpha, hex };
}

function parseDimension(value: Json, path: string): Dimension {
  const units: readonly DimensionUnit[] = ["px", "rem", "em"];
  if (!isObject(value) || !units.includes(value.unit as DimensionUnit)) {
    throw new DtcgError(path, `dimension must be { value, unit: ${units.join(" | ")} }`);
  }
  return { value: parseNumber(value.value, path), unit: value.unit as DimensionUnit };
}

function parseDuration(value: Json, path: string): Duration {
  if (!isObject(value) || (value.unit !== "ms" && value.unit !== "s")) {
    throw new DtcgError(path, "duration must be { value, unit: ms | s }");
  }
  const amount = parseNumber(value.value, path);
  if (amount < 0) throw new DtcgError(path, "duration must not be negative");
  return { ms: finite(value.unit === "s" ? amount * 1000 : amount, path) };
}

function parseCubicBezier(value: Json, path: string): CubicBezier {
  if (!Array.isArray(value) || value.length !== 4) {
    throw new DtcgError(path, "cubicBezier must be [x1, y1, x2, y2]");
  }
  const [x1, y1, x2, y2] = value.map((v) => parseNumber(v, path));
  if (x1 < 0 || x1 > 1 || x2 < 0 || x2 > 1)
    throw new DtcgError(path, "cubicBezier x values must be in 0..1");
  return [x1, y1, x2, y2];
}

function parseFontFamily(value: Json, path: string): string[] {
  const families = typeof value === "string" ? [value] : value;
  if (
    !Array.isArray(families) ||
    families.length === 0 ||
    !families.every((f) => typeof f === "string" && f.length > 0)
  ) {
    throw new DtcgError(path, "fontFamily must be a name or a non-empty list of names");
  }
  return (families as string[]).map((f) => plainString(f, path));
}

/** DTCG 2025.10 font-weight keywords. */
const FONT_WEIGHTS: Readonly<Record<string, number>> = {
  thin: 100,
  hairline: 100,
  "extra-light": 200,
  "ultra-light": 200,
  light: 300,
  normal: 400,
  regular: 400,
  book: 400,
  medium: 500,
  "semi-bold": 600,
  "demi-bold": 600,
  bold: 700,
  "extra-bold": 800,
  "ultra-bold": 800,
  black: 900,
  heavy: 900,
  "extra-black": 950,
  "ultra-black": 950,
};

function parseFontWeight(value: Json, path: string): number {
  if (typeof value === "string") {
    const keyword = Object.hasOwn(FONT_WEIGHTS, value) ? FONT_WEIGHTS[value] : undefined;
    if (keyword === undefined) throw new DtcgError(path, `unknown fontWeight keyword "${value}"`);
    return keyword;
  }
  const weight = parseNumber(value, path);
  if (weight < 1 || weight > 1000) throw new DtcgError(path, "fontWeight must be in 1..1000");
  return weight;
}

function parseFontFeatures(token: RawToken): string[] {
  const extension = token.extensions?.[TYPOGRAPHY_EXTENSION];
  if (extension === undefined) return [];
  const features = isObject(extension) ? extension.fontFeatures : undefined;
  if (
    !Array.isArray(features) ||
    !features.every((f) => typeof f === "string" && FEATURE_TAG.test(f)) ||
    new Set(features).size !== features.length
  ) {
    throw new DtcgError(token.path, "fontFeatures must be distinct four-character OpenType tags");
  }
  return features as string[];
}

function parseTypography(token: RawToken, lookup: Lookup): Typography {
  const { path, value } = token;
  if (!isObject(value)) throw new DtcgError(path, "typography must be an object");
  const field = (key: string): Json => {
    if (value[key] === undefined) throw new DtcgError(path, `typography needs ${key}`);
    return value[key];
  };
  return {
    fontFamily: sub(
      field("fontFamily"),
      "fontFamily",
      `${path}.fontFamily`,
      lookup,
      parseFontFamily,
    ),
    fontSize: sub(field("fontSize"), "dimension", `${path}.fontSize`, lookup, parseDimension),
    fontWeight: sub(
      field("fontWeight"),
      "fontWeight",
      `${path}.fontWeight`,
      lookup,
      parseFontWeight,
    ),
    lineHeight: sub(field("lineHeight"), "number", `${path}.lineHeight`, lookup, parseNumber),
    letterSpacing: sub(
      field("letterSpacing"),
      "dimension",
      `${path}.letterSpacing`,
      lookup,
      parseDimension,
    ),
    fontFeatures: parseFontFeatures(token),
  };
}

function parseGradient(token: RawToken, lookup: Lookup): Gradient {
  const { path, value } = token;
  if (!Array.isArray(value) || value.length < 1)
    throw new DtcgError(path, "gradient needs at least one stop");
  const stops = value.map((stop, i) => {
    if (!isObject(stop)) throw new DtcgError(`${path}[${i}]`, "stop must be { color, position }");
    const raw = sub(stop.position, "number", `${path}[${i}].position`, lookup, parseNumber);
    // DTCG: positions outside 0..1 clamp to the nearest bound.
    const position = Math.min(1, Math.max(0, raw));
    return { color: sub(stop.color, "color", `${path}[${i}].color`, lookup, parseColor), position };
  });
  const extension = token.extensions?.[GRADIENT_EXTENSION];
  const angle =
    isObject(extension) && extension.angle !== undefined ? parseNumber(extension.angle, path) : 180;
  return { angle, stops };
}
