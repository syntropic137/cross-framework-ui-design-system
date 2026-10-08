# @syntropic137/design-tokens

A generated source of truth for design tokens and theme layers used across the component libraries.

## Scripts

- `pnpm tokens:build` – compile TypeScript sources and emit CSS/JSON artifacts into `generated/`.
- `pnpm test` – run Vitest unit tests to validate token integrity and output formatting.
- `pnpm lint` – lint the token source and tests with the shared ESLint configuration.
- `pnpm typecheck` – run TypeScript diagnostics without emitting files.

## Usage

1. Update token definitions in `src/token-data.ts`. Keep semantic tokens (`bg`, `fg`, `accent`) separated from raw brand values to simplify theming.
2. Run `pnpm tokens:build` to produce:
   - `generated/design-tokens.css` – layered CSS custom properties with `:root` defaults and themed overrides.
   - `generated/design-tokens.json` – machine-readable snapshot consumed by other packages.
3. Downstream packages import the generated CSS (or JSON) to stay in sync with the canonical tokens.

## Consuming the package

```bash
pnpm add @syntropic137/design-tokens
```

Load the CSS once, at the app root:

```ts
import "@syntropic137/design-tokens/css"; // same file as /generated/design-tokens.css
```

Reference tokens from TypeScript through the typed name list. The `names` subpath is
browser-safe: it carries the token names only, not the Node generator.

```ts
import { cssVar, isTokenName, tokenNames, type TokenName } from "@syntropic137/design-tokens/names";

const accent = cssVar("ds-color-accent"); // "var(--ds-color-accent)", typed as that literal
const gap = cssVar("ds-space-2", "8px"); // "var(--ds-space-2, 8px)"
cssVar("ds-color-backgroud"); // type error: not a token
```

| Export | What it is |
| --- | --- |
| `TokenName` | Union of every token name, e.g. `"ds-color-accent"` |
| `TokenNameIn<"space">` | Names in one category |
| `CssVariableName` | `--${TokenName}` |
| `tokenNames`, `tokenNamesByCategory` | The same names as runtime arrays |
| `isTokenName(value)` | Narrows a string to `TokenName` |
| `cssVar(name, fallback?)` | Builds a `var()` reference |

A test keeps the list identical to the custom properties the CSS defines, and fails
if a theme introduces a name the base set lacks.

### Root font size

The token CSS never sets `font-size` on `:root` or `html`. Consumers keep the browser
default (16px, so `1rem` is 16px) unless they choose otherwise; the size tokens are in
`px` and do not depend on the root. A test guards this.

## Themes

Themes are declared in `themeDefinitions`. Each theme maps to a `data-theme` selector and overrides only the tokens it needs to change. The generator merges overrides with the base token set to ensure every theme is complete.

> NOTE: Keep changes additive where possible so that new tokens default gracefully for existing themes.
