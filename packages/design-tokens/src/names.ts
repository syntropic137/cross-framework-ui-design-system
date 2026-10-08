// Typed token names, shipped beside the generated CSS.
//
// Browser-safe: this module imports only the token data (no node: built-ins),
// so apps can load it through the `@syntropic137/design-tokens/names` subpath
// without pulling in the generator.

import { baseTokens } from "./token-data.js";

type BaseTokens = typeof baseTokens;

/** A token category: `color`, `typography`, `space`, `radius`, `shadow`, `motion` or `z`. */
export type TokenCategory = keyof BaseTokens;

/** Token names in one category, e.g. `TokenNameIn<"space">` is `"ds-space-1" | ...`. */
export type TokenNameIn<C extends TokenCategory> = Extract<keyof BaseTokens[C], string>;

/** Every token name the generated CSS defines, without the leading `--`. */
export type TokenName = { [C in TokenCategory]: TokenNameIn<C> }[TokenCategory];

/** A token as a CSS custom property name, e.g. `--ds-color-accent`. */
export type CssVariableName = `--${TokenName}`;

/** Every token name, grouped by category, in the order the CSS emits them. */
export const tokenNamesByCategory = Object.freeze(
  Object.fromEntries(
    Object.entries(baseTokens).map(([category, values]) => [
      category,
      Object.freeze(Object.keys(values)),
    ]),
  ),
) as { readonly [C in TokenCategory]: readonly TokenNameIn<C>[] };

/** Every token name, flat. */
export const tokenNames: readonly TokenName[] = Object.freeze(
  Object.values(tokenNamesByCategory).flat() as TokenName[],
);

const nameSet: ReadonlySet<string> = new Set(tokenNames);

/** Narrow an arbitrary string to a known token name. */
export function isTokenName(value: string): value is TokenName {
  return nameSet.has(value);
}

/** The `var()` string `cssVar` returns for a name and an optional fallback. */
export type CssVarReference<
  N extends TokenName,
  F extends string | undefined = undefined,
> = F extends string ? `var(--${N}, ${F})` : `var(--${N})`;

/** `var(--name)`, or `var(--name, fallback)` when a fallback is given. */
export function cssVar<N extends TokenName, F extends string | undefined = undefined>(
  name: N,
  fallback?: F,
): CssVarReference<N, F> {
  const reference = fallback === undefined ? `var(--${name})` : `var(--${name}, ${fallback})`;
  return reference as CssVarReference<N, F>;
}
