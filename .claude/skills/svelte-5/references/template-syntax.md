# Template syntax

What this covers: Svelte 5 markup: events, blocks, snippets, bindings, attachments,
and the class/style attributes, with the version each recent feature landed. Read
this when writing component markup. Sourced from `03-template-syntax/` and
`05-special-elements/` of the official docs (current to 5.56.x).

## Events: onclick, not on:click

Events are plain attributes starting with `on`. There is no `on:` directive in runes
mode.

```svelte
<button onclick={() => count++}>click</button>
<button {onclick}>shorthand</button>
<button {...handlers}>spread</button>
```

- Case-sensitive: `onclick` is the DOM click; `onClick` listens for a custom `Click`.
- Event modifiers are removed. Call `event.preventDefault()` in the handler, or wrap
  the function. Capture phase is the suffix form `onclickcapture`.
- `oninput` fires after `bind:value` updates.
- Component-to-parent communication uses callback props, not `createEventDispatcher`;
  pass values directly (there is no `event.detail`).

## Blocks

```svelte
{#if cond}...{:else if other}...{:else}...{/if}

{#each items as item}...{/each}
{#each items as item, i}...{/each}
{#each items as item (item.id)}...{/each}        <!-- keyed: insert/move/delete -->
{#each items as { id, name }, i (id)}...{/each}  <!-- destructure -->
{#each { length: 8 }, i}...{/each}               <!-- render n times -->
{#each todos as t}...{:else}<p>empty</p>{/each}  <!-- empty fallback -->

{#key value}<Component />{/key}                  <!-- recreate on change -->

{#await promise}pending{:then v}ok{:catch e}fail{/await}
{#await promise then v}...{/await}
```

Use keyed `{#each}` (a stable `(id)`) whenever items are added, removed, or
reordered, so Svelte moves nodes instead of mutating in place.

## Snippets and {@render} (the replacement for slots)

Reusable markup chunks; the Svelte 5 replacement for `<slot>`.

```svelte
{#snippet figure(image)}
  <figure><img src={image.src} alt={image.caption} /></figure>
{/snippet}
{@render figure(images[0])}
```

- Arbitrary parameters with defaults and destructuring; no rest params.
- Lexical scope: a snippet sees siblings and their children.
- Passing to components: snippets are values, so pass them as props, or declare them
  directly inside the component (they become props). Non-snippet content inside a
  component becomes the implicit `children` snippet:

```svelte
<!-- App --> <Button>click me</Button>
<!-- Button.svelte -->
<script>let { children } = $props();</script>
<button>{@render children?.()}</button>
```

- Optional/fallback: `{@render children?.()}`, or `{#if children}{@render children()}{:else}fallback{/if}`.
- Typing: `Snippet` (no params), `Snippet<[T]>` (one param) from `svelte`.
- Exporting snippets from `<script module>` since 5.5.

## Other tags

- `{@html string}` injects raw HTML (sanitize: XSS risk). Scoped styles do not reach
  it; target with `:global`.
- Declaration tags `{const x = ...}` / `{let x = $state(...)}` (5.56) define local
  markup variables and are preferred over the legacy `{@const x = y}`. Both are only
  valid as immediate children of a block, component, or boundary.
- `{@debug a, b}` logs plain variable names (not member expressions) on change.
- `{@attach fn}` (5.29) runs `fn(element)` in an `$effect` on mount and when state it
  reads changes; it may return a cleanup. It is the reactive, composable replacement
  for `use:` actions and also works on components.

## Bindings

```svelte
<input bind:value={value} />
<input bind:value />                 <!-- shorthand -->
<input type="checkbox" bind:checked />
<input type="number" bind:value />   <!-- coerces to number; invalid -> undefined -->
<select bind:value>...</select>      <!-- option value, any type; multiple -> array -->
<details bind:open>...</details>
```

- Function bindings (5.9): `bind:value={() => value, (v) => value = v.toLowerCase()}`
  for validation/transform, and the preferred alternative to state-syncing effects.
  For readonly bindings the getter must be `null`: `bind:clientWidth={null, redraw}`.
- `bind:group` (radios/checkboxes) works only within the same component.
- `bind:this` references a DOM node or component instance, and is `undefined` until
  mount; read it in an effect or handler, never during init.
- Binding to a component prop requires the child to declare it `$bindable()`.
- Dimension bindings (`clientWidth`, `clientHeight`, ...) are readonly, via
  `ResizeObserver`.

## class and style

```svelte
<div class={large ? 'large' : 'small'}>...</div>
<div class={{ active, disabled: !active }}>...</div>     <!-- object: truthy keys -->
<div class={['btn', faded && 'faded']}>...</div>          <!-- array -->
<button {...props} class={['btn', props.class]}>...</button>

<div style:color={myColor}>...</div>
<div style:--columns={n}>...</div>                        <!-- CSS custom property -->
<div style:color|important="red">...</div>
```

The object/array `class` attribute (5.16, typed via `ClassValue` from
`svelte/elements`) is preferred over the legacy `class:` directive. `style:` takes
precedence over the `style` attribute.

## Special elements

- `<svelte:boundary onerror={...}>` (5.3) walls off render/effect errors and provides
  a `pending` snippet (for `await`) and a `failed` snippet `(error, reset)`. It does
  not catch errors in event handlers, `setTimeout`, or async outside render.
- `<svelte:window>`, `<svelte:document>`, `<svelte:body>`, `<svelte:head>` add global
  listeners and bindings (top level only, SSR-safe).
- `<svelte:element this={tag}>` renders an element whose tag is dynamic (only
  `bind:this` is supported).
- `<svelte:options>` sets per-component compiler options (`customElement`, `namespace`,
  `runes`).

## Sources

`documentation/docs/03-template-syntax/*`, `documentation/docs/05-special-elements/*`,
and the v5 migration guide, from `sveltejs/svelte@main`, June 2026.
