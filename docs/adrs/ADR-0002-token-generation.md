# ADR-0002: Token Generation Pipeline

- Status: Accepted
- Date: 2025-09-26

## Context
We need a single source of truth for design tokens that can emit layered CSS variables and machine-readable data for other packages. The solution must support multiple themes, integrate neatly with vanilla CSS, and give downstream teams confidence that tokens remain in sync.

## Decision
- Maintain canonical tokens in TypeScript (`packages/design-tokens/src/token-data.ts`). The data structure groups tokens by category (color, typography, space, radius, shadow) to keep semantics explicit.
- Use a lightweight generator (`buildTokenOutputs`) to convert the token map plus theme overrides into:
  - `design-tokens.css` – an `@layer tokens` stylesheet with `:root` defaults and additional `[data-theme="x"]` overrides.
  - `tokens.json` – merged tokens per theme for consumption by build tooling and contract tests.
- Provide `writeGeneratedFiles` plus a CLI entry point so other packages (or release workflows) can regenerate outputs deterministically.
- Cover the generator with Vitest unit tests to guard against accidental token drift and ensure each theme exposes a complete set of values.

## Consequences
- Token updates require TypeScript edits followed by running `pnpm --filter @syntropic137/design-tokens tokens:build` to regenerate assets.
- The generator currently supports CSS-based theming; extending to additional platforms (e.g., native) would require extra formatters but the data model already supports it.
- Consumers must import the generated CSS to align with theme variables; documentation explains the workflow.

## Follow-Up
- Integrate the token build step into CI/release automation.
- Expose additional formatters (e.g., SCSS maps) if future platform targets demand them.
- Consider adding visual regression checks once components consume these tokens.
