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

### Native Attribute Pass-Through

Components that render a single host element **must** accept that element's full native attribute surface in addition to their contract props, and spread it onto the host. This applies to non-interactive components too (`Card`, `Meter`, `Tag`), not only focusable controls:

- React: `ButtonHTMLAttributes<HTMLButtonElement> & ButtonContract`, spreading `...rest`.
- Svelte: `Omit<HTMLButtonAttributes, "children" | "type" | "disabled"> & ButtonContract`, spreading `{...rest}`.

This is additive under the rule above, and it is not optional: without it an icon-only control cannot carry an `aria-label`, and `role` / `tabindex` / `aria-selected` / `aria-controls` / `aria-expanded` / `aria-pressed` cannot be expressed — which forces consumers to hand-roll a bare element and lose the design entirely.

A component that renders an ARIA `role` must be nameable by the consumer, which makes pass-through an accessibility requirement rather than a convenience. `Meter` renders `role="meter"`: given no `label` and no way to accept `aria-labelledby`, it would ship a role with no accessible name.

Where a contract prop and a native attribute set the *same* attribute, the contract prop wins when set but must not erase the native one when unset — `Meter` resolves `aria-label={label ?? ariaLabel}` for exactly this reason, since an attribute written after the spread with an `undefined` value removes it.

That precedence is per-attribute, **not** over the accessible name as a whole. `aria-labelledby` outranks `aria-label` in ARIA's name computation, so a consumer passing `aria-labelledby` names the element from the referenced node even when `label` is also set. This is intended — pointing at a visible heading is a deliberate, more specific act than passing a string — but it means `label` is the default name, not a guaranteed one. Do not set both and expect `label` to appear.

Attributes the component itself owns (`data-variant`, `data-size`, `data-state`, `aria-pressed` on `Toggle`, `disabled`/`aria-busy` derived from `loading`) are invariants. In Svelte, spread `{...rest}` **first** so those attributes win; a consumer must not be able to desynchronise a component from its own state.

The consumer's event handlers are **not** invariants. A component that owns a handler for an event must pull the consumer's handler out of `rest` and invoke it, rather than letting its own attribute overwrite the spread one. `Toggle` does this for `onclick` / `onClick`: the spread makes the prop type-accepted, so silently dropping it would fail at runtime while type-checking cleanly.

`class` is typed `ClassValue` (`string | ClassArray | ClassDictionary`) in Svelte and may legitimately be passed as an object or array. Merge it with the array form — `class={["card", className]}`, which Svelte resolves with clsx semantics — never by string interpolation, which renders the non-string forms as `[object Object]`.

### Known parity divergences

These are real differences between adapters. They are documented rather than fixed because closing them would change already-shipped behaviour; treat them as constraints when writing swap-safe app code.

- **Keyboard activation of `Toggle`.** The Svelte cells rely on the `<button>`'s native keyboard-generated click, so Enter/Space runs the full click path and a consumer `onclick` fires. `default-react-v18` calls `preventDefault()` in its own `onKeyDown` and emits the change directly, so its consumer `onClick` does **not** fire for keyboard activation. Side effects belong in `onPressedChange`, which behaves identically on both.
- **`Card` interactive state.** React marks it with the class `card--interactive`; the Svelte cells use `data-state="interactive"`, per the cell convention. Consumer CSS targeting one will not match the other.
- **`Card` is Svelte-only in the brutalist design.** `brutalist/svelte-v5` exports `Card`; `brutalist/react-v18` has no `Card`, so that import does not survive a swap.

## Planned Contracts

The following contract files exist but are not required in the current release surface:

`accordion`, `alert-dialog`, `aspect-ratio`, `avatar`, `calendar`, `checkbox`, `collapsible`, `combobox`, `command`, `context-menu`, `date-field`, `date-picker`, `date-range-field`, `date-range-picker`, `dialog`, `dropdown-menu`, `label`, `link-preview`, `menu`, `menubar`, `meter`, `navigation-menu`, `pagination`, `pin-input`, `popover`, `progress`, `radio-group`, `range-calendar`, `rating-group`, `scroll-area`, `select`, `separator`, `slider`, `switch`, `tabs`, `time-field`, `time-range-field`, `toggle-group`, `toolbar`, `tooltip`.

`meter` now has a `default-svelte-v5` implementation (`designs/default/svelte-v5/src/lib/components/meter/Meter.svelte`), built against `MeterContract` (`value`, `min`, `max`, `label`, `tone`). `tone` (`ComponentTone`, default `"accent"`) is rendered as `data-tone` and selects the fill colour, so consumers recolour a meter through the public API instead of overriding `.meter__fill` — a private class whose name is not part of any contract. It stays `planned` — and out of `svelteV5ContractAdapter` / `RequiredComponentContracts` — until every supported adapter (including `default-react-v18`) implements it per the promotion steps above.

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

`Card` also has a `default-svelte-v5` implementation (`designs/default/svelte-v5/src/lib/components/card/Card.svelte`), ported from `default-react-v18`'s `Card`: same `interactive` boolean, no variant/tone, and the same native attribute pass-through with the consumer's `class` merged rather than dropped. Like its React counterpart, it is exported directly from the package's `index.ts` and is **not** part of `svelteV5ContractAdapter`, since it has no contract in `packages/contracts/src`.

The port is not attribute-identical, and `Card` is Svelte-only in the brutalist design — see "Known parity divergences" above. Target the `card` class or a passed-in class rather than the interactive-state marker if a style override has to survive a swap.

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
- Reference tokens **without** `var()` fallbacks. A fallback makes a missing token render acceptably instead of failing, so the component quietly ships the fallback's shape and nothing surfaces the gap — `--ds-radius-full` behind a fallback would turn `Tag`'s pill into an ordinary rounded rectangle with no signal that the token had gone missing.
- `--ds-color-surface` is **Card's** background. A control that paints a resting or hover fill with it is invisible on a card, which is the common case; use `--ds-color-surface-raised` for a thing-on-a-card. The scale is `bg` = page, `surface` = card, `surface-raised` = thing-on-a-card, `overlay` = scrim.
- A component with no background of its own (a ghost button) must express hover as a translucent ink wash — `color-mix(in oklab, var(--ds-color-fg) 8%, transparent)` — not a named surface, so it stays visible over any container.
- `--ds-color-brand`, `-600` and `-700` are raw ramp steps and are theme-invariant. Do not pair them with `--ds-color-accent-contrast`, which is theme-aware and flips to near-black in dark theme; use `--ds-color-brand-600-contrast` / `--ds-color-brand-700-contrast`. For hover states use the semantic `--ds-color-accent-hover`, never a ramp step: `brand-600` is darker than the dark theme's accent, so hovering to it runs backwards.
- Every interactive component needs its own `:focus-visible` rule (`outline: var(--ds-focus-ring); outline-offset: 2px`). `default-react-v18` has a global one in `base.css`; the Svelte cells ship no base stylesheet, so the rule must live on the component.
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
