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

function isObject(value: Json | undefined): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Deep-merge layer documents. Groups merge; a token path defined twice is an error. */
export function mergeDocuments(documents: readonly Json[]): JsonObject {
  const merged: JsonObject = {};
  const mergeInto = (target: JsonObject, source: JsonObject, path: string): void => {
    for (const [key, value] of Object.entries(source)) {
      const childPath = path ? `${path}.${key}` : key;
      if (key.startsWith("$")) {
        // A group's own metadata: first one wins for $description, $type must agree.
        if (key === "$type" && target.$type !== undefined && target.$type !== value) {
          throw new DtcgError(
            path,
            `$type ${String(value)} conflicts with ${String(target.$type)}`,
          );
        }
        if (target[key] === undefined) target[key] = value;
        continue;
      }
      if (!isObject(value)) throw new DtcgError(childPath, "expected a token or group object");
      const existing = target[key];
      if (existing === undefined) {
        target[key] = "$value" in value ? value : {};
        if (!("$value" in value)) mergeInto(target[key] as JsonObject, value, childPath);
      } else if ("$value" in value || (isObject(existing) && "$value" in existing)) {
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
  const groupType = group.$type === undefined ? inherited : parseType(group.$type, path);
  for (const [key, node] of Object.entries(group)) {
    if (key.startsWith("$")) continue;
    const childPath = path ? `${path}.${key}` : key;
    if (!NAME.test(key)) throw new DtcgError(childPath, `name "${key}" must match ${NAME.source}`);
    if (!isObject(node)) throw new DtcgError(childPath, "expected a token or group object");
    if ("$value" in node) {
      const type = node.$type === undefined ? groupType : parseType(node.$type, childPath);
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
      result = {
        type: target.type,
        value: target.value,
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
  const alias = typeof value === "string" ? ALIAS.exec(value) : null;
  if (!alias) return literal(value, path);
  const target = lookup(alias[1]);
  if (target.type !== type)
    throw new DtcgError(path, `expected a ${type} alias, got ${target.type}`);
  return target.value as ValueOf[T];
}

function parseValue(token: RawToken, lookup: Lookup): TokenValue {
  const { path, value } = token;
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
      return { type: "typography", value: parseTypography(value, path, lookup) };
    case "gradient":
      return { type: "gradient", value: parseGradient(token, lookup) };
    default:
      throw new DtcgError(path, "no $type on the token or any parent group");
  }
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
  return { components: components as [number, number, number], alpha, hex };
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
  return { ms: value.unit === "s" ? amount * 1000 : amount };
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
  return families as string[];
}

function parseFontWeight(value: Json, path: string): number {
  const weight = parseNumber(value, path);
  if (weight < 1 || weight > 1000) throw new DtcgError(path, "fontWeight must be in 1..1000");
  return weight;
}

function parseTypography(value: Json, path: string, lookup: Lookup): Typography {
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
  };
}

function parseGradient(token: RawToken, lookup: Lookup): Gradient {
  const { path, value } = token;
  if (!Array.isArray(value) || value.length < 2)
    throw new DtcgError(path, "gradient needs at least two stops");
  const stops = value.map((stop, i) => {
    if (!isObject(stop)) throw new DtcgError(`${path}[${i}]`, "stop must be { color, position }");
    const position = parseNumber(stop.position, `${path}[${i}].position`);
    if (position < 0 || position > 1)
      throw new DtcgError(`${path}[${i}]`, "position must be in 0..1");
    return { color: sub(stop.color, "color", `${path}[${i}].color`, lookup, parseColor), position };
  });
  const extension = token.extensions?.[GRADIENT_EXTENSION];
  const angle =
    isObject(extension) && extension.angle !== undefined ? parseNumber(extension.angle, path) : 180;
  return { angle, stops };
}
