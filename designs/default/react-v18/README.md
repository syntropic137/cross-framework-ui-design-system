# @syntropic137/default-react-v18

React 18 implementation of the design system components powered by CSS custom properties and the shared token pipeline.

## Quick Start

```bash
pnpm install
pnpm --filter @syntropic137/design-tokens tokens:build
pnpm --filter @syntropic137/default-react-v18 storybook
```

The Storybook server regenerates tokens automatically via the package script, so you can also launch from the repo root with:

```bash
pnpm storybook
```

## Available Scripts

| Command | Description |
| --- | --- |
| `pnpm build` | Emits ESM/CJS bundles plus type declarations via Vite + TypeScript. |
| `pnpm test` | Runs Vitest suites covering components and theming behaviour. |
| `pnpm storybook` | Builds tokens then serves Storybook on `http://localhost:6006`. |
| `pnpm storybook:build` | Generates a static Storybook bundle in `storybook-static/`. |
| `pnpm storybook:test` | Regenerates tokens, boots Storybook, and executes Playwright-based story tests. |
| `pnpm lint` / `pnpm typecheck` | Package-scoped linting and TS diagnostics. |

## Consuming the Package

```tsx
import "@syntropic137/default-react-v18/dist/styles.css";
import { ThemeProvider, Button, Card, Input } from "@syntropic137/default-react-v18";

export function App() {
  return (
    <ThemeProvider>
      <Card>
        <h2>Hello</h2>
        <p>This card is themed via CSS variables.</p>
        <div style={{ display: "flex", gap: 12 }}>
          <Button>Primary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
        </div>
        <Input placeholder="Your name" aria-label="Your name" />
      </Card>
    </ThemeProvider>
  );
}
```

- Import `dist/styles.css` (or the individual layer files) to ensure tokens and component styles load in the correct order.
- Override semantic tokens by adding your own CSS variables before the import; components consume semantic names (`--bg`, `--accent`, etc.), so theme overrides do not require code changes.

## Token Pipeline

This package depends on `@syntropic137/design-tokens` for generated assets. During local development the scripts call `tokens:build`, but you can also run it manually:

```bash
pnpm --filter @syntropic137/design-tokens tokens:build
```

Generated outputs live in `packages/design-tokens/generated/` and are imported by `src/design-system/styles.css`.
