# Gotchas: migration and SSR

What this covers: the Svelte 4 to 5 migration map and the SSR/mount/build issues that
make a Svelte app render blank. Read this when porting code or chasing a blank page.
Sourced from the official v5 migration guide and the `svelte` package exports
(current to 5.56.x).

## Svelte 4 to 5 migration map

| Svelte 4 | Svelte 5 | Why |
|----------|----------|-----|
| reactive `let x = 0` | `let x = $state(0)` | plain `let` is no longer reactive |
| `$: doubled = x * 2` | `let doubled = $derived(x * 2)` | computed values are runes |
| `$: { sideEffect() }` | `$effect(() => { sideEffect() })` | side effects are runes (different timing: after DOM, batched) |
| `export let foo` | `let { foo } = $props()` | props come from one rune |
| `$$props` / `$$restProps` | `let { ...rest } = $props()` | rest props via destructuring |
| `on:click={fn}` | `onclick={fn}` | events are plain attributes |
| `on:click\|preventDefault` | call `e.preventDefault()` in the handler | modifiers removed |
| capture phase | `onclickcapture` | suffix the event name |
| `createEventDispatcher()` + `dispatch('x', detail)` | callback prop `onx?.(value)` | pass values directly, no `event.detail` |
| `<slot />` | `{@render children?.()}` | default content is the `children` snippet |
| named `<slot name="x">` | named snippet prop + `{@render x()}` | named slots become snippet props |
| `<slot let:item>` | snippet parameter | slot props become snippet params |
| `beforeUpdate` / `afterUpdate` | `$effect.pre` / `$effect` | per-update hooks removed |
| `new Component({ target })` | `mount(Component, { target })` | components are functions now |
| `spring` / `tweened` stores | `Spring` / `Tween` classes (`svelte/motion`) | class-based motion |
| reactive `Map`/`Set`/`Date` expectation | `SvelteMap`/`SvelteSet`/`SvelteDate` (`svelte/reactivity`) | natives are not reactive |
| `class:foo={cond}` | `class={{ foo: cond }}` | object/array `class` attribute (5.16) |
| `use:action` needing reactive args | `{@attach fn}` (5.29) | actions run once; attachments re-run |

Run the official script first: `npx sv migrate svelte-5`. It rewrites the mechanical
cases and leaves `@migration-task` comments where it cannot, which are required
follow-ups, not noise.

## The blank-page bug (SSR mount in a bare bundler)

Symptom: a Svelte app built by a plain Vite/Vitest setup (not SvelteKit) shows a blank
page, with `lifecycle_function_unavailable` ("`mount(...)` is not available on the
server") in the console.

Cause: the `svelte` package's root export is conditional. The `browser` condition
resolves the client build (`index-client.js`); the `default`/server condition resolves
the server build (`index-server.js`), where `mount` is a throwing stub. A bare bundler
that does not request the `browser` condition pulls the server build, so `mount` throws
and nothing renders.

Fix: set the browser condition in the app's Vite config (and the Vitest config):

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  resolve: { conditions: ['browser'] },
});
```

This bites any app that mounts Svelte. SvelteKit sets the condition for you; in this
repo the Svelte design cells set it in their own vite config as well, so the trap is
mainly a hand-rolled app that forgets it. Diagnose a silent blank page by loading the
built `dist/` in headless Playwright and reading `pageerror`, which surfaces the
thrown error.

## mount versus hydrate

- `mount(Component, { target, props })` renders a component into a DOM element (CSR).
- `hydrate(Component, { target })` attaches to server-rendered HTML.
- `unmount(instance)` tears it down. `render(Component)` from `svelte/server` produces
  SSR HTML.

## In this repo (designs/default/svelte-v5)

- Components are minimal and contract-driven (`Button`, `Badge`, `Toggle`). They accept
  `children?: Snippet | string` and render it with
  `{#if typeof children === "string"}{children}{:else}{@render children?.()}{/if}`.
- The contract adapter uses a `: RequiredComponentAdapter` annotation rather than
  `satisfies`. With `satisfies`, svelte-check's declaration emitter tries to name each
  component's internal `Props` interface in the `.d.ts` and fails. The annotation
  widens entries to `unknown`, so consumers cast at the boundary
  (`ui.button as Component<ButtonProps>`); see `apps/tauri-harness-svelte/src/App.svelte`.
- The harness apps need `resolve.conditions: ['browser']` (the blank-page fix above).
- Theming is runtime: an `$effect` sets `data-theme` on the root element, and every
  `var(--ds-color-*)` re-resolves with no per-component change.

## Sources

`documentation/docs/07-misc/07-v5-migration-guide.md`, the `svelte` package exports,
and `packages/svelte/CHANGELOG.md`, from `sveltejs/svelte@main`, June 2026.
