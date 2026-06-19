<!--
  DerivedAndEffect.svelte  -  $derived vs $effect done right.
  - $derived for computed values (the default, pure, no loops).
  - $effect ONLY for a real side effect (persisting + a DOM title), with a
    server guard and a teardown function.
  Note how `doubled` and `parity` are $derived, NOT mirrored via $effect.
-->
<script lang="ts">
  let count = $state(0);

  // ✅ computed values  -  use $derived, never an $effect that assigns to $state
  let doubled = $derived(count * 2);
  let parity = $derived(count % 2 === 0 ? "even" : "odd");

  // $derived.by for a multi-statement derivation
  let label = $derived.by(() => {
    if (count === 0) return "zero";
    return count > 0 ? "positive" : "negative";
  });

  // ✅ legitimate side effect: sync to localStorage + document.title.
  // Runs after the DOM updates, only in the browser.
  $effect(() => {
    // read `count` synchronously so it's tracked as a dependency
    const current = count;
    if (typeof document !== "undefined") {
      document.title = `count: ${current}`;
    }
    try {
      localStorage?.setItem("count", String(current));
    } catch {
      /* localStorage unavailable  -  ignore */
    }
  });

  // $effect with teardown: auto-increment on an interval
  let running = $state(false);
  $effect(() => {
    if (!running) return;
    const id = setInterval(() => count++, 1000);
    return () => clearInterval(id); // runs before re-run and on destroy
  });
</script>

<p>{count} ({parity}, {label})  -  doubled is {doubled}</p>
<button onclick={() => count++}>increment</button>
<button onclick={() => (running = !running)}>
  {running ? "stop" : "start"} auto
</button>
