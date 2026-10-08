# ADR-0010: Publish the foundation as `design-contracts` and `design-tokens`

- Status: Accepted
- Date: 2026-10-07
- Related: ADR-0007 (contract model), ADR-0008 (npm distribution), ADR-0009 (release pipeline)

## Context

The two foundation packages were named `@syntropic137/contracts` and
`@syntropic137/design-tokens`. Neither has been published yet (the registry returns
404 for both), so the names are still free to change.

The first consumer outside this repo is Skyline, the Svelte 5 component library in
the Syntropic137 monorepo. It depends on both packages directly. Next to its own
packages and other `@syntropic137/*` packages, a bare `contracts` name does not say
what it holds: API contracts, smart contracts and data contracts all exist in the
same organisation.

## Decision

- Rename `@syntropic137/contracts` to **`@syntropic137/design-contracts`**, so the two
  foundation packages read as a pair: `design-contracts` (the component API) and
  `design-tokens` (the `--ds-*` token layer).
- Keep `@syntropic137/design-tokens` as is.
- Keep the source directory at `packages/contracts/`. The directory is internal, the
  dashboard detects the monorepo by it, and the historical plans in `docs/` refer to
  it. Only the published name changes.
- Do the rename now, before the first publish, so no published name has to be
  deprecated.

## Consequences

- Every in-repo import, `workspace:^` dependency, tsconfig path alias and
  `pnpm --filter` call moves to the new name in one change.
- Because nothing was ever published under `@syntropic137/contracts`, no npm
  deprecation notice is needed. Consumers that linked the package from a git
  submodule or a workspace path must update their imports (see the migration note
  in `CHANGELOG.md`).
- The first publish (see `docs/publishing-setup.md`) creates the package under the
  new name, and the trusted publisher on npmjs.com is configured for that name.
