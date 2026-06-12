# React Component Library Monorepo

A pnpm-powered workspace for building a modular design system with shared tokens, themed React 18 components, and Storybook-driven documentation.

## Design Philosophy

### Quality Over Quantity
We prioritize building fewer, exceptionally well-crafted components over a large collection of mediocre ones. Each component must meet rigorous standards for performance, accessibility, and maintainability before being added to the standard.

### Performance-First Architecture
- **Vanilla React + CSS**: We use pure React and CSS for long-term stability and maximum performance
- **Zero Runtime Dependencies**: Components avoid heavy runtime libraries that impact bundle size
- **Tree-Shakeable**: Only the components you use are included in your final bundle
- **Optimized Rendering**: Components are designed to minimize unnecessary re-renders

### Design System Flexibility
- **Token-Driven Styling**: All visual properties (colors, sizes, spacing, etc.) are controlled by design tokens
- **Easy Customization**: Changing the entire look and feel should be as simple as updating token values
- **Semantic Tokens**: We use meaningful token names (e.g., `--accent`, `--surface`) rather than raw color values
- **CSS Layer Architecture**: Styles are organized in a cascade layer system for predictable specificity

### Expandable Standard
- **Versioned Growth**: We expand the component standard incrementally over time based on actual needs
- **Future-Ready**: All components are built with extensibility in mind
- **Documentation-First**: New components require comprehensive stories, tests, and contract docs before implementation
- **Community-Driven**: Component additions are prioritized based on team feedback and usage patterns

### Long-Term Stability
- **Minimal Dependencies**: We avoid complex build tools and frameworks that may become obsolete
- **Backward Compatibility**: We maintain API stability across minor versions
- **Progressive Enhancement**: Components work without JavaScript when possible
- **Accessibility First**: All components meet WCAG 2.1 AA standards by default

## Repository Layout

```
packages/
  design-tokens/                 # Token definitions, generator, and outputs
  component-libraries/
    react-v18/                   # React 18 component implementation + stories
  dev-tools/
    component-generator/         # CLI tool for generating new components
```

Key highlights:
- **design-tokens** exposes TypeScript token definitions and writes layered CSS/JSON via `pnpm --filter @design-system/design-tokens tokens:build`.
- **react-v18** consumes generated tokens, exports themed components, runs tests with Vitest, and ships Storybook stories/test-runner coverage.
- **component-generator** provides a CLI tool for rapidly generating new components that follow design system standards.

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
| `pnpm --filter @design-system/design-tokens tokens:build` | Emits `generated/design-tokens.css` + `tokens.json`. |
| `pnpm --filter @design-system/react-v18 test` | Runs component and provider unit tests via Vitest. |
| `pnpm generate:component <ComponentName> [options]` | Generates new React components following design system standards. |

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

## Component Generation

Rapidly create new components that follow design system standards:

```bash
# Generate a basic component
pnpm generate:component Badge --type=display --dry-run

# Generate with variants and sizes
pnpm generate:component Button --type=display --variants=variant,size --sizes=sm,md,lg

# Generate form component with props
pnpm generate:component Input --type=form --props=placeholder,required --variants=error

# Interactive mode for guided generation
pnpm generate:component --interactive
```

The generator creates complete component files:
- **React component** with TypeScript interfaces and forwardRef
- **Storybook stories** with variant showcases and examples
- **Test suite** with accessibility and interaction testing
- **CSS styles** with design token integration and variants

See [`packages/dev-tools/component-generator/README.md`](packages/dev-tools/component-generator/README.md) for detailed documentation.

## Future Work

Milestones 5 and 6 of the project plan cover packaging/publishing automation, export tooling, and a reusable QA script. See `PROJECT-PLAN_20250926_design-system.md` for detailed tasks and progress.
