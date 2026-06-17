# Component Standard

Tracks the canonical, framework-neutral component contract surface for the design system. The source of truth is `@syntropic137/contracts`; this document explains the standard, release status, and implementation expectations.

## Versioning

- **Standard version:** `v0.1.0`
- Patch changes document or clarify existing contracts.
- Minor changes add optional props, planned contracts, or new non-breaking required contracts.
- Major changes rename/remove contracts, required props, variants, or required component keys.

## Source Of Truth

`packages/contracts/src/` is canonical:

- `components/*.ts` defines framework-neutral data prop contracts.
- `shared.ts` defines shared union types such as size, tone, orientation, side, and align.
- `component-status.ts` defines whether each contract is `required`, `planned`, or `experimental`.
- `RequiredComponentContracts` and `AssertRequiredComponentProps` define the compile-time adapter conformance check.

Docs, stories, and implementation prop types must follow the contracts, not the other way around. When implementation behavior needs a different public API, update the contract deliberately first.

## Contract Status

| Status         | Meaning                                                               | Release behavior                                  |
| -------------- | --------------------------------------------------------------------- | ------------------------------------------------- |
| `required`     | Must be implemented by supported adapters for the current standard.   | Missing implementations fail adapter type checks. |
| `planned`      | Contract exists, but adapters may lag during incremental development. | Not required for release gates yet.               |
| `experimental` | API is being explored and may change.                                 | Not required and should not be treated as stable. |

## Required Components

These components are required in the current adapter surface.

| Component | Contract         | Required Props | Optional Props                                                                                                                                | Token Dependencies                                                                                                 |
| --------- | ---------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `Badge`   | `BadgeContract`  | none           | `variant` (`solid`\|`outline`\|`soft`), `tone` (`neutral`\|`success`\|`warning`\|`danger`\|`accent`)                                          | `--ds-color-bg`, `--ds-color-fg`, `--ds-color-border`, radius tokens                                               |
| `Button`  | `ButtonContract` | none           | `variant` (`primary`\|`secondary`\|`ghost`\|`danger`), `size` (`sm`\|`md`\|`lg`), `disabled`, `loading`, `type` (`button`\|`submit`\|`reset`) | `--ds-color-accent`, `--ds-color-accent-contrast`, `--ds-color-border`, `--ds-color-surface`, radius/shadow tokens |
| `Toggle`  | `ToggleContract` | none           | `pressed`, `defaultPressed`, `onPressedChange`, `disabled`                                                                                    | `--ds-color-accent`, `--ds-color-accent-contrast`, `--ds-color-surface`, `--ds-color-border`, focus tokens         |

Framework packages may add framework-native composition props such as React `children`, refs, event handlers, or Svelte snippets, but those additions must be additive. Required contract props must remain accepted by the implementation.

## Planned Contracts

The following contract files exist but are not required in the current release surface:

`accordion`, `alert-dialog`, `aspect-ratio`, `avatar`, `calendar`, `checkbox`, `collapsible`, `combobox`, `command`, `context-menu`, `date-field`, `date-picker`, `date-range-field`, `date-range-picker`, `dialog`, `dropdown-menu`, `label`, `link-preview`, `menu`, `menubar`, `meter`, `navigation-menu`, `pagination`, `pin-input`, `popover`, `progress`, `radio-group`, `range-calendar`, `rating-group`, `scroll-area`, `select`, `separator`, `slider`, `switch`, `tabs`, `time-field`, `time-range-field`, `toggle-group`, `toolbar`, `tooltip`.

Moving a planned contract to required requires:

1. Updating `componentContractStatus`.
2. Adding the contract to `RequiredComponentContracts`.
3. Implementing it in each supported adapter.
4. Adding tests/stories for each implementation.
5. Running `pnpm qa`.

## Implementation Extras

Some current React components are useful implementation exports but are not part of the framework-neutral required contract surface yet:

- `ThemeProvider`
- `Input`
- `Card`
- `Modal`
- `Confetti`

Keep these documented as implementation extras until they either receive contracts or are intentionally removed from the public standard.

## Adapter Compliance

Each implementation package owns its own adapter export. There is no separate higher-level app-facing adapter package.

Example:

```ts
export const reactV18ContractAdapter = {
  badge: Badge,
  button: Button,
  toggle: Toggle,
} satisfies RequiredComponentAdapter;

export type ReactV18ContractConformance = AssertRequiredComponentProps<ReactV18AdapterProps>;
```

Applications that want one swap point should use a local app module and change one import line from one implementation package to another. The design system enforces that each implementation package satisfies the required contract surface.

## Styling Rules

- Use generated design tokens from `@syntropic137/design-tokens`.
- Token references use the `--ds-*` naming scheme.
- Raw brand colors belong in token definitions, not component CSS.
- Components use CSS cascade layers for predictable specificity.
- Framework implementation styles may be co-located with components, but packages should still expose a single public stylesheet for consumers.

## Compliance Checklist

Before a component becomes required:

1. Contract exists in `packages/contracts/src/components`.
2. Contract status is `required`.
3. Contract is included in `RequiredComponentContracts`.
4. Each supported adapter exports an implementation under the required key.
5. Implementation prop types extend or otherwise satisfy the contract.
6. Tests cover the contract props.
7. Stories expose the contract props.
8. `pnpm qa` passes.
