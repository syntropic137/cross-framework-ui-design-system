// Number and name formatting shared by the emitters.

/** Shortest stable decimal: at most `digits` places, no float noise, no trailing zeros. */
export function num(value: number, digits = 4): string {
  const fixed = Number(value.toFixed(digits));
  return Object.is(fixed, -0) ? "0" : String(fixed);
}

/** `color.content.primary` -> `ds-color-content-primary`. Provisional until the contract (xvzo6.2). */
export function cssName(prefix: string, path: string): string {
  return `${prefix}-${path.replaceAll(".", "-")}`;
}
