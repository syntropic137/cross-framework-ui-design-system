<!--
  Counter.svelte  -  a stateful component.
  Demonstrates: $state, $props with a callback prop, onclick (not on:click),
  and a typed Props interface.
-->
<script lang="ts">
  interface Props {
    /** initial value */
    start?: number;
    /** step size per click */
    step?: number;
    /** called with the new value after every change */
    onchange?: (value: number) => void;
  }

  let { start = 0, step = 1, onchange }: Props = $props();

  // local reactive state  -  NOT a plain `let`
  let count = $state(start);

  function update(delta: number) {
    count += delta; // direct mutation; no setter
    onchange?.(count); // communicate up via callback prop, not an event
  }
</script>

<div class="counter">
  <button onclick={() => update(-step)} aria-label="decrement">−</button>
  <output>{count}</output>
  <button onclick={() => update(step)} aria-label="increment">+</button>
</div>

<style>
  .counter {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }
  output {
    min-width: 2rem;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }
</style>
