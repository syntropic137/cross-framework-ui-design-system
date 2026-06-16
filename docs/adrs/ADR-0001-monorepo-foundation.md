# ADR-0001: Monorepo Foundation and Tooling

- Status: Accepted
- Date: 2025-09-26

> **Status update (2026):** The `packages/component-libraries/react-v18` path described here was
> superseded by the design-first matrix layout introduced in ADR-0004 (`designs/<design>/<framework>/`).
> This ADR remains valid for the monorepo tooling decisions (pnpm, shared config, CI).

## Context
We are creating a modular design system that must support multiple React versions, shared design tokens, and reusable tooling. A pnpm-based monorepo improves maintainability for shared configurations, build scripts, and package versioning.

## Decision
- Use pnpm workspaces to manage packages under `packages/`, supporting nested folders such as `packages/component-libraries/react-v18` and shared utilities.
- Maintain shared TypeScript, ESLint, Prettier, and Stylelint configurations at the repository root to guarantee consistent standards across packages.
- Standardize automation scripts (`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm check`) executed from the repository root to delegate tasks to individual packages.
- Add GitHub Actions workflow (`ci.yml`) as the baseline CI entry point that installs dependencies and runs the aggregated `pnpm check` command.

## Consequences
- Shared tooling reduces duplication but requires packages to conform to the root configuration patterns.
- pnpm workspaces expect contributors to use pnpm >= 9.0.0; documentation and onboarding must highlight this requirement.
- Top-level scripts must remain up to date as new packages expose lint/test/typecheck commands, otherwise `pnpm check` could finish without executing meaningful checks.

## Follow-Up
- Populate the workspace with the design token generator and React component packages.
- Add documentation describing how to scaffold new packages (future milestone).
- Evaluate need for additional CI jobs (e.g., release pipelines) once packages are publishable.
