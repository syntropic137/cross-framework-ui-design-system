---
name: svelte-5
description: >-
  Use when writing, reviewing, or debugging Svelte 5 components and `.svelte`
  files: runes ($state, $derived, $effect, $props, $bindable), snippets and
  {@render}, event attributes (onclick), bindings, context, and stores. Trigger
  phrases include "write a Svelte component", "Svelte 5", "runes", "why isn't my
  Svelte reactive", "convert this Svelte 4 to 5", "$state vs $effect", "Svelte
  state management", "snippet", "Svelte blank page". Do NOT use for SvelteKit
  routing, load functions, or server endpoints (that is a SvelteKit concern), and
  do NOT use to maintain legacy Svelte 3/4 syntax (this skill drives code toward
  runes).
---

# Svelte 5

## Overview

Svelte 5 moved reactivity from compiler-implicit constructs (a reactive `let`,
`$:`, `export let`, `on:click`, `<slot>`) to explicit **runes** and **snippets**.
The syntax looks similar to Svelte 4 but the semantics differ, so the dominant
failure mode is Svelte 4 habits leaking into Svelte 5 code that then compiles but
misbehaves. This skill covers writing and reviewing correct Svelte 5: runes-based
state, derivations versus effects, snippets and template syntax, component props
and events, context, and the SSR/build conditions that decide whether a Svelte app
renders at all. It does not cover the SvelteKit routing/data layer.

## Outcomes we are looking for

### Outcome 1: generated Svelte is Svelte 5, not Svelte 4 in disguise

New code expresses reactivity with runes and snippets, not legacy constructs that
the compiler still tolerates in places but that signal stale knowledge.

Evidence signals:
- No `$:`, `export let`, `on:click`, `createEventDispatcher`, or `<slot>` appears
  in newly written components.
- `svelte-check` reports no legacy-syntax or migration warnings.

### Outcome 2: reactive state updates correctly and without loops

Values that are computed from other state recompute on their own; the UI reflects
mutations; nothing spins in an update cycle.

Evidence signals:
- Computed values use `$derived`/`$derived.by`, not a `$state` written from inside
  an `$effect`.
- No `effect_update_depth_exceeded` or never-settling update warnings at runtime.

### Outcome 3: effects are a side-effect escape hatch, not a state mechanism

`$effect` is reserved for genuine side effects (DOM, canvas, subscriptions,
analytics, persistence), each cleaning up after itself.

Evidence signals:
- Every `$effect` does I/O, DOM work, or subscription work rather than assigning
  one reactive value from another.
- Effects that create a resource (interval, listener, observer) return a teardown.

### Outcome 4: components compose through the contract-correct API

Data flows down through props, up through callbacks, and two-way only where
declared; content arrives as snippets; types are declared.

Evidence signals:
- Props come from `$props()`; child-to-parent uses callback props or a `$bindable`
  prop; slotted content uses `children`/snippets and `{@render}`.
- Prop and snippet types are declared with an interface and the `Snippet` type.

### Outcome 5: Svelte apps actually render in the browser

A Svelte app embedded in a webview or built by a bare bundler shows its UI rather
than a blank page from a server-mode `mount`.

Evidence signals:
- Non-SvelteKit Vite/Vitest apps set `resolve.conditions: ['browser']`.
- No `lifecycle_function_unavailable` ("not available on the server") at startup.

## Principles

- Make reactivity explicit. A plain `let x = 0` is inert; wrap state in `$state(0)`
  so reads and writes drive the UI. Runes are compiler keywords, never imported and
  never assigned to a variable.
- Compute, do not synchronize. Reach for `$derived`/`$derived.by` before `$effect`,
  because an effect that writes state causes extra renders, stale reads, and update
  loops. Deriveds are writable since 5.25, so optimistic UI no longer needs an
  effect either.
- Treat `$effect` as an escape hatch for side effects, and return a teardown when it
  creates a resource, because cleanup-on-rerun is the only thing that keeps
  subscriptions and listeners from leaking.
- Move data down with `$props()`, up with callback props, and two-way only through
  `$bindable`, because mutating a prop you do not own either does nothing (plain
  object) or warns (`ownership_invalid_mutation` on a proxy).
- Use snippets and event attributes, not slots and `on:`. `<slot>`/named slots/`let:`
  become `children`/snippets and `{@render}`; `on:click` becomes `onclick`; event
  modifiers move into the handler body, because the legacy surface does not behave
  in runes mode.
- Respect the state proxy. Mutate `$state` objects in place, read through the object
  rather than destructuring (destructuring takes a dead snapshot), and pass
  `$state.snapshot(value)` to any external API that chokes on a `Proxy`.
- Keep runes in `.svelte`, `.svelte.js`, or `.svelte.ts`, and never export a
  reassigned `$state` binding from a module, because the compiler's signal rewrite
  is per file: importers would receive the raw signal, not the value. Export an
  object you mutate, or accessor functions.
- Give every non-SvelteKit Svelte app the `browser` resolve condition, because the
  package's server build replaces `mount` with a throwing stub and the app renders
  blank otherwise.

## Anti-patterns

- An `$effect` that mirrors one value into another (`$effect(() => { doubled = count * 2 })`),
  producing double renders and the occasional never-ending update cycle. The intent
  was a `$derived`.
- `$:` reactive statements or `export let` props sitting in a component the compiler
  runs in runes mode, a tell that the author is still writing Svelte 4.
- `createEventDispatcher` plus `dispatch('change', detail)` where a callback prop
  would pass the value directly with no `event.detail` indirection.
- `<slot>`, named slots, or `let:` bindings left in place instead of `children`,
  named snippet props, and snippet parameters.
- A method handed straight to a handler (`onclick={todo.reset}`) whose `this` quietly
  rebinds to the `<button>`, so the method operates on the wrong object.
- `$state` destructured at the top of a component (`let { x } = obj`) and then read as
  though `x` were still live, when it froze at destructuring time.
- A native `Map`, `Set`, or `Date` used as reactive state, so mutations never reach
  the UI; the reactive versions in `svelte/reactivity` were needed.
- A module that exports a reassigned `$state` binding, leaving importers with the
  signal object (`typeof === 'object'`) instead of the value.
- A bare Vite or Vitest Svelte app with no `browser` resolve condition, rendering a
  blank page and logging `lifecycle_function_unavailable` because the server build
  was bundled.
- `bind:this` read during component init, where it is `undefined` until mount.
- A `use:` action used where the argument is expected to be reactive; actions run
  once and ignore later changes, whereas `{@attach}` (5.29) re-runs.

## Recommended tools and practices (as of 2026-06-16)

### For: generated Svelte is Svelte 5, not Svelte 4 in disguise

- `svelte-check` in the package test/typecheck step. Ladders up by surfacing legacy
  syntax and prop/type mismatches that compile but signal stale knowledge.
  Tradeoffs: needs the Svelte language tooling installed; reports against the
  configured Svelte version, so keep it current.
- The official migration script `npx sv migrate svelte-5` for porting Svelte 4 code.
  Ladders up by mechanically rewriting `export let`, `on:`, and slots so humans do
  not hand-translate. Tradeoffs: it leaves `@migration-task` comments on cases it
  cannot rewrite; treat those as required follow-up, not noise.

### For: reactive state updates correctly and without loops

- Function bindings `bind:value={() => v, (n) => v = n}` (5.9) and writable deriveds
  (5.25) as the replacement for state-syncing effects. Ladders up by giving the two
  common "I reached for an effect" cases a first-class, loop-free form.
  Tradeoffs: function bindings need a getter even for readonly bindings (use `null`).
- `untrack()` from `svelte` as the last resort when a value must be read inside an
  effect without becoming a dependency. Ladders up by breaking a read/write loop
  without restructuring. Tradeoffs: it hides a dependency, so a comment explaining
  why is warranted.

### For: effects are a side-effect escape hatch, not a state mechanism

- `$inspect.trace('label')` (5.14) as the first statement of an effect or derived to
  log which reactive read triggered a re-run. Ladders up by making "why did this run"
  answerable without guesswork. Tradeoffs: development-only (compiled out of
  production), which is the point.

### For: components compose through the contract-correct API

- `createContext<T>()` (5.40) for typed, key-free context over `setContext`/`getContext`
  string keys. Ladders up by removing stringly-typed keys and giving consumers a typed
  getter. Tradeoffs: the getter throws when no ancestor set it, and is 5.40+ only.
- The `Snippet` type from `svelte` and DOM attribute types from `svelte/elements` for
  typing content and wrapper props. Ladders up by making slotted content and
  pass-through props type-checked rather than `any`.
- `svelte/reactivity` (`SvelteMap`, `SvelteSet`, `SvelteDate`, `SvelteURL`) when state
  is a collection. Ladders up by keeping collection mutations reactive, which native
  `Map`/`Set` are not.

### For: Svelte apps actually render in the browser

- `resolve.conditions: ['browser']` in the app's `vite.config.ts` (and the Vitest
  config). Ladders up by selecting Svelte's client build so `mount` works.
  Tradeoffs: applies to apps, not the libraries themselves; SvelteKit handles it for
  you.
- Diagnose a blank built app by loading `dist/` in headless Playwright and reading
  `pageerror`. Ladders up by turning a silent white screen into the actual thrown
  error. Tradeoffs: one extra tool in the loop, worth it for SSR/hydration faults.

## References

- `references/runes.md`: every rune with current syntax, semantics, and version
  notes. Read when you need the exact behavior of a specific rune.
- `references/state-management.md`: `$derived` versus `$effect`, when not to use an
  effect, sharing state across components and modules, context, and stores. Read when
  deciding how state should flow.
- `references/template-syntax.md`: events, snippets, blocks, bindings, attachments,
  and the class/style attributes. Read when writing markup.
- `references/gotchas.md`: the Svelte 4 to 5 migration map and the SSR/mount/browser
  build issues. Read when porting code or chasing a blank page.
- `examples/`: complete `.svelte` files (state, derived versus effect, snippets).
- Official docs: https://svelte.dev/docs/svelte and the v5 migration guide at
  https://svelte.dev/docs/svelte/v5-migration-guide.

## Continual improvement

File drift, gaps, or corrections against this repository at
https://github.com/syntropic137/cross-framework-ui-design-system (open an issue
or capture a bead with `br create`). Svelte ships fast: when a rune or API changes,
update `references/` and the dated section above, leaving the Outcomes intact.
