# @syntropic137/design-contracts

Framework-neutral component API contracts for the Syntropic137 cross-framework
design system. Every design cell (React, Svelte, or your own) implements these
prop shapes, so an app can swap one component library for another without
changing its own code.

Zero runtime dependencies. Formerly `@syntropic137/contracts` (renamed before the
first publish, see ADR-0010 and `CHANGELOG.md`).

## Install

```bash
pnpm add @syntropic137/design-contracts @syntropic137/design-tokens
```

## Use

```ts
import type {
  ButtonContract,
  RequiredComponentContracts,
  AssertRequiredComponentProps,
} from "@syntropic137/design-contracts";
import { componentContractStatus, requiredContractNames } from "@syntropic137/design-contracts";
```

- `*Contract` types: the props each component accepts (`ButtonContract`,
  `MeterContract`, ...).
- `componentContractStatus`: every known contract and whether it is `required`,
  `planned` or `experimental`.
- `requiredContractNames` and `RequiredComponentContracts`: the set every adapter
  must implement today.

See `docs/component-standard.md` in the repository for the full component standard.
