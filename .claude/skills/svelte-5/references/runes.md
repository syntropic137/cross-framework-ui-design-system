# Runes reference

What this covers: every Svelte 5 rune with current syntax, semantics, and the
version it landed where recent. Read this when you need the exact behavior of a
specific rune. Sourced from the official `sveltejs/svelte` docs and CHANGELOG
(current to 5.56.x, June 2026).

Runes are compiler keywords with a `$` prefix. You never import them, never assign
them to a variable, and they only work inside `.svelte`, `.svelte.js`, and
`.svelte.ts` files. The compiler rewrites every read/write of a runed variable into
signal access, per file.

## $state

Reactive state, read and written as a plain value (no `.value`, no setter).

```svelte
<script>
  let count = $state(0);
</script>
<button onclick={() => count++}>clicks: {count}</button>
```

Deep reactivity: when `$state` wraps a plain object or array, the result is a deeply
reactive `Proxy`. Mutating a property or calling `array.push(...)` triggers granular
updates (only readers of the changed property re-run). Proxification recurses until
it hits a non-plain value (a class instance or `Object.create(...)` object stops it).

Subtleties:
- The original object is not mutated; the proxy holds its own copy.
- Destructuring snapshots: `let { done } = todo` reads `done` once. Later changes to
  `todo.done` do not update the local. Read through the object instead.
- Class instances are not proxied. Mark fields with `$state` (`done = $state(false)`)
  or assign `$state` to a property as the first statement in the constructor.
- Passing into functions is pass-by-value: pass a getter `() => count`, or pass the
  proxy object and read its properties (proxy reads stay live).

## $state.raw

Opts out of deep reactivity. Raw state cannot be mutated, only reassigned (replace
the whole value). Use it to avoid proxy overhead on large data you never mutate in
place.

```js
let person = $state.raw({ name: 'Heraclitus', age: 49 });
person.age += 1;                       // ignored
person = { name: 'Heraclitus', age: 50 }; // works
```

## $state.snapshot

Returns a static, plain (non-proxy) clone of a deeply reactive value. Use before
handing state to external code that does not expect a `Proxy` (`structuredClone`,
`JSON` edge cases, IndexedDB, charting libraries, `postMessage`).

```js
let counter = $state({ count: 0 });
console.log($state.snapshot(counter)); // { count: 0 }, not Proxy
```

## $state.eager (5.41)

Only relevant with the experimental async feature. Reads a value eagerly so the UI
updates immediately instead of waiting for in-flight async work to settle. Use
sparingly.

## $derived and $derived.by

Computed state, recomputed lazily when dependencies change.

```svelte
<script>
  let count = $state(0);
  let doubled = $derived(count * 2);
  let total = $derived.by(() => {
    let sum = 0;
    for (const n of numbers) sum += n;
    return sum;
  });
</script>
```

Semantics:
- The expression must be side-effect free; the compiler rejects state writes inside
  it.
- Push-pull and lazy: a dependency change marks the derived dirty, but it recomputes
  only when next read.
- Referential-equality short-circuit: if the recomputed value is `===` the previous
  value, downstream updates are skipped. `large = $derived(count > 10)` only updates
  the UI when the boolean flips.
- Dependencies are whatever is read synchronously in the expression or `.by` body.
  Wrap a read in `untrack(...)` to exclude it.
- `$derived(expr)` equals `$derived.by(() => expr)`.

Writable since 5.25: you can temporarily reassign a non-`const` derived; it reverts
on the next dependency change. This is the optimistic-UI pattern and the official
reason you usually do not need an effect to sync state:

```svelte
<script>
  let { post, like } = $props();
  let likes = $derived(post.likes);
  async function onclick() {
    likes += 1;             // optimistic
    try { await like(); } catch { likes -= 1; } // roll back
  }
</script>
```

Destructuring a derived keeps each variable reactive (unlike destructuring `$state`).

## $effect, $effect.pre, $effect.tracking, $effect.root, $effect.pending

`$effect` runs a side effect in response to state changes, after the DOM updates,
batched in a microtask. It runs only in the browser, never during SSR. Return a
teardown function to clean up (it runs before each re-run and on destroy).

```svelte
<script>
  let size = $state(50), color = $state('#ff3e00');
  let canvas;
  $effect(() => {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;     // re-runs when color or size changes
    ctx.fillRect(0, 0, size, size);
  });
</script>
<canvas bind:this={canvas}></canvas>
```

Dependency rules that are easy to get wrong:
- Tracks values read synchronously (including through called functions). Values read
  after `await` or inside `setTimeout` are not tracked.
- Depends only on what it read on its last run, so conditional branches change the
  dependency set.
- Re-runs when an object it read changes, not when an inner property mutates, unless
  it read that property. `$effect(() => { state })` runs once; `$effect(() => { state.value })`
  runs on every `state.value` change.

Variants:
- `$effect.pre` runs before the DOM updates (the replacement for `beforeUpdate`).
  Reference the state you want to react to explicitly so it registers as a dependency.
- `$effect.tracking()` returns whether code runs in a tracking context (effect or
  template). Used to build subscribe-on-demand abstractions.
- `$effect.root(fn)` creates a non-tracked scope that does not auto-clean-up and
  returns a manual `destroy`. Use to own an effect's lifetime outside component init.
- `$effect.pending()` (async feature) returns the count of pending promises in the
  current boundary.

When not to use `$effect`: see `state-management.md`. The short version: it is an
escape hatch for side effects, not a way to compute or synchronize state.

## $props

Receives component inputs.

```svelte
<script lang="ts">
  interface Props {
    adjective?: string;
    onchange?: (n: number) => void;
    children?: import('svelte').Snippet;
  }
  let { adjective = 'happy', onchange, children }: Props = $props();
  let { a, b, ...rest } = $props();   // rest props
  let { super: trouper } = $props();  // rename invalid identifiers
</script>
```

- Prop references update when the parent updates the prop.
- A child may temporarily reassign a prop (ephemeral local state); it reverts on the
  next parent update.
- Fallback values are not turned into reactive proxies.
- Do not mutate props. A plain object mutation does nothing; mutating a `$state`
  proxy you do not own works but warns `ownership_invalid_mutation`. Send data up
  with callbacks or `$bindable`.

`$props.id()` (5.20) returns a unique-per-instance ID stable across SSR and
hydration. Use it for `for`/`aria-labelledby`/`aria-describedby`.

## $bindable

Marks a prop as two-way bindable so data can flow child to parent. Use sparingly.

```svelte
<!-- FancyInput.svelte -->
<script>
  let { value = $bindable(), ...props } = $props();
</script>
<input bind:value {...props} />

<!-- App.svelte -->
<FancyInput bind:value={message} />
```

The parent is not required to bind. Fallback `$bindable('x')` applies only when not
bound; when bound, the parent must supply a non-`undefined` value or a runtime error
is thrown.

## $inspect, $inspect.with, $inspect.trace

Development-only (compiled out of production builds).

- `$inspect(a, b)` logs whenever its arguments change, tracking deeply, with a stack
  trace.
- `$inspect(x).with((type, x) => { ... })` replaces `console.log`; `type` is `"init"`
  or `"update"`.
- `$inspect.trace('label')` (5.14), as the first statement of a function, logs which
  reactive read caused that function to re-run inside an effect or derived.

## $host

Only meaningful when compiling as a custom element (`<svelte:options customElement=...>`).
`$host()` returns the host element so you can dispatch DOM `CustomEvent`s.

## Version landmarks

| Feature | Version |
|---------|---------|
| Function bindings `bind:value={get, set}` | 5.9 |
| `$inspect.trace` | 5.14 |
| `$props.id()` | 5.20 |
| Writable/overridable deriveds | 5.25 |
| `await` in components (`experimental.async`) | 5.36 |
| `createContext` (typed context) | 5.40 |
| `$state.eager` | 5.41 |

## Sources

Official docs `documentation/docs/02-runes/*` and `documentation/docs/98-reference/20-svelte.md`,
plus `packages/svelte/CHANGELOG.md`, from `sveltejs/svelte@main`, June 2026.
