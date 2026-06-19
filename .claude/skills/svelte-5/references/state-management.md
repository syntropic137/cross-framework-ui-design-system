# State management

What this covers: how to manage state well in Svelte 5, centered on the choice
between `$derived` and `$effect`, plus sharing state across components and modules,
context, and stores. Read this when deciding how state should flow. Sourced from
`02-runes/` and `06-runtime/` of the official docs.

## Local state with $state

Plain reactive variables, read and written directly. Objects and arrays become deep
proxies (mutation is reactive). Destructuring takes a non-reactive snapshot, so read
through the object. For values you only ever reassign, `$state.raw` is cheaper.

```svelte
<script>
  let count = $state(0);
  let user = $state({ name: 'Ada', age: 36 });
  user.age++;            // reactive
</script>
```

## $derived versus $effect: the most important distinction

`$derived` means "this value is computed from other state." `$effect` means "run
this side effect when state changes." Reach for `$derived` first: it is pure, lazy,
and has no ordering or stale-value hazards.

```svelte
<script>
  let count = $state(0);
  let doubled = $derived(count * 2);   // computed value
</script>
```

### When not to use $effect

Do not use `$effect` to synchronize one piece of state into another. This is the
single most common Svelte 5 mistake. The docs are explicit that updating state inside
effects "makes code more convoluted and will often lead to never-ending update
cycles."

```svelte
<!-- avoid: stale reads, extra renders, risk of loops -->
<script>
  let count = $state(0);
  let doubled = $state();
  $effect(() => { doubled = count * 2; });
</script>

<!-- prefer -->
<script>
  let count = $state(0);
  let doubled = $derived(count * 2);
</script>
```

For two values that update each other (a "spent"/"left" pair), do not use two
effects writing each other's state; that loops. Use one `$derived` plus a function
binding:

```svelte
<script>
  const total = 100;
  let spent = $state(0);
  let left = $derived(total - spent);
  function updateLeft(v) { spent = total - v; }
</script>
<input type="range" bind:value={spent} max={total} />
<input type="range" bind:value={() => left, updateLeft} max={total} />
```

If you reached for an effect to make a derived reassignable (optimistic UI), stop:
deriveds are writable since 5.25, so just reassign the derived.

Legitimate `$effect` uses: canvas or imperative DOM, focus and scroll management,
third-party library sync, subscriptions with teardown, persisting to `localStorage`,
analytics. Treat it as an escape hatch. If you genuinely must write `$state` inside
an effect and read the same state (causing a loop), wrap the read in `untrack(...)`
from `svelte`, with a comment explaining why.

## Passing state across components

Down through props: `<Child {count} />`. The reference updates when the parent's
value changes. The child may temporarily reassign a prop but must not mutate state it
does not own (`ownership_invalid_mutation`).

Up through callback props (not `createEventDispatcher`): pass functions down and call
them with the value directly.

```svelte
<!-- Parent --> <Stepper onchange={(n) => (value = n)} />

<!-- Stepper.svelte -->
<script>
  let { onchange } = $props();
  let n = $state(0);
  function inc() { n++; onchange?.(n); }
</script>
```

This is the repo's `Toggle.svelte` pattern (`onPressedChange?.(next)`).

Two-way through `$bindable`, only when parent and child should share the same mutable
value:

```svelte
<!-- child --> let { value = $bindable() } = $props();
<!-- parent --> <FancyInput bind:value={message} />
```

## Context (avoid prop-drilling)

`createContext` (5.40) gives a typed `[get, set]` pair with no string keys:

```ts
// context.ts
import { createContext } from 'svelte';
interface User { name: string; }
export const [getUserContext, setUserContext] = createContext<User>();
```

```svelte
<!-- Parent.svelte --> setUserContext({ name: 'world' });
<!-- Child.svelte -->  const user = getUserContext();
```

- Before 5.40, use `setContext(key, value)` / `getContext(key)` from `svelte`.
- The `createContext` getter throws when no ancestor set it.
- Reactive context: store a `$state` object in context and mutate its properties;
  consumers stay reactive. Reassigning the context variable breaks the link, so reset
  by mutating (`counter.count = 0`), not reassigning (`counter = { count: 0 }`).
- Context must be set during component init (synchronously), not in a callback.

## Stores versus runes

Svelte stores (`writable`, `readable`, `derived` from `svelte/store`) still work, but
runes are the Svelte 5 default. `$state` works outside a component (in
`.svelte.js`/`.svelte.ts`), where Svelte 4 forced you into stores. The `$store`
auto-subscription syntax still works for stores; do not confuse it with runes, which
are compiler keywords with no `$`-autosubscribe.

Prefer shared rune state in a `.svelte.js` module over a store for new code. Mind the
cross-module export rule: the compiler's signal rewrite is per file, so you can only
export `$state` that is never reassigned. Export an object you mutate, or accessor
functions.

```js
// counter.svelte.js  (shared state without stores)
export const counter = $state({ count: 0 });
export function increment() { counter.count += 1; }
```

SSR caveat: a module-level `$state` shared across components is fine until you mutate
it during SSR, where server modules are shared and the value can leak to the next
request. For request-scoped state, use context (not shared between requests).

## Deep reactivity and $state.snapshot

`$state` objects and arrays are deep proxies; nested mutation is tracked. An effect
re-runs when the object reference it read changes or when a specific property it read
changes, so reading the bare object will not react to inner mutation. When handing
state to an external API that chokes on proxies, pass `$state.snapshot(value)` for a
plain, non-reactive copy. `$state.raw` opts out of deep reactivity entirely (reassign
to update).

## Sources

`documentation/docs/02-runes/02-$state.md`, `03-$derived.md`, `04-$effect.md`,
`documentation/docs/06-runtime/02-context.md`, and the `svelte` API reference, from
`sveltejs/svelte@main`, June 2026.
