# React Component Library Monorepo

A pnpm-powered workspace for building a modular design system with shared tokens, themed React 18 components, and Storybook-driven documentation.

## Repository Layout

```
packages/
  design-tokens/                 # Token definitions, generator, and outputs
  component-libraries/
    react-v18/                   # React 18 component implementation + stories
PROJECT-PLAN_20250926_design-system.md
```

Key highlights:
- **design-tokens** exposes TypeScript token definitions and writes layered CSS/JSON via `pnpm --filter @design-system/design-tokens tokens:build`.
- **react-v18** consumes generated tokens, exports themed components, runs tests with Vitest, and ships Storybook stories/test-runner coverage.

## Prerequisites

- Node.js ≥ 18.18
- pnpm ≥ 9 (workspace uses `packageManager: pnpm@9.1.4`)

Install dependencies once at the root:

```bash
pnpm install
```

## Everyday Commands

| Command | Description |
| --- | --- |
| `pnpm qa` | Runs lint, typecheck, unit tests, and Storybook test-runner end-to-end. |
| `pnpm storybook` | Starts Storybook for the React v18 package after regenerating tokens. |
| `pnpm storybook:build` | Produces a static Storybook build (useful for deployment previews). |
| `pnpm storybook:test` | Builds tokens, launches Storybook, and executes Playwright-powered story tests. |
| `pnpm --filter @design-system/design-tokens tokens:build` | Emits `generated/tokens.css` + `tokens.json`. |
| `pnpm --filter @design-system/react-v18 test` | Runs component and provider unit tests via Vitest. |

> `pnpm qa` is the recommended pre-commit check; Storybook test runner requires Playwright browsers (installed automatically when running QA for the first time).

## Component Library Usage

Inside downstream projects (after publishing):

```tsx
import "@design-system/react-v18/dist/styles.css";
import { ThemeProvider, Button, Card, Input } from "@design-system/react-v18";

export function Example() {
  return (
    <ThemeProvider>
      <Card>
        <h2>Hello</h2>
        <Button>Click me</Button>
      </Card>
    </ThemeProvider>
  );
}
```

Theme switching is handled by the provider, which applies `data-theme` attributes and persists the current theme to `localStorage`.

## Future Work

Milestones 5 and 6 of the project plan cover packaging/publishing automation, export tooling, and a reusable QA script. See `PROJECT-PLAN_20250926_design-system.md` for detailed tasks and progress.
