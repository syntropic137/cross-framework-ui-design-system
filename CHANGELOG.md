# Changelog

All notable changes to the published `@syntropic137/*` packages. Versions move in
lockstep (see ADR-0009). Newest first.

<!-- releases -->

## Unreleased

### Breaking: `@syntropic137/contracts` is now `@syntropic137/design-contracts`

The component-contract package is renamed before its first publish (ADR-0010).
`@syntropic137/contracts` was never on npm, so only workspace or submodule
consumers are affected. To migrate:

1. In `package.json`, replace `"@syntropic137/contracts"` with
   `"@syntropic137/design-contracts"` (same version range).
2. Replace every import specifier:
   `from "@syntropic137/contracts"` becomes `from "@syntropic137/design-contracts"`.
   A one-liner for a repo:
   `grep -rl "@syntropic137/contracts" src | xargs sed -i 's#@syntropic137/contracts#@syntropic137/design-contracts#g'`
3. Update tsconfig `paths` aliases and any `pnpm --filter @syntropic137/contracts`
   scripts the same way.

The exported API (`RequiredComponentContracts`, `requiredContractNames`,
`componentContractStatus`, every `*Contract` type) is unchanged. The source
directory stays at `packages/contracts/`. `@syntropic137/design-tokens` keeps its
name.

## 0.1.0 - 2026-06-15

- Initial cross-framework design system: `contracts`, `design-tokens`, and the
  `default`/`brutalist` x `react-v18`/`svelte-v5` design cells.
