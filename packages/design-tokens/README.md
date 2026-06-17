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
   - `generated/tokens.json` – machine-readable snapshot consumed by other packages.
3. Downstream packages import the generated CSS (or JSON) to stay in sync with the canonical tokens.

## Themes

Themes are declared in `themeDefinitions`. Each theme maps to a `data-theme` selector and overrides only the tokens it needs to change. The generator merges overrides with the base token set to ensure every theme is complete.

> NOTE: Keep changes additive where possible so that new tokens default gracefully for existing themes.
