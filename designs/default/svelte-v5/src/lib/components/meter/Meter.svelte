<script lang="ts">
  import type { MeterContract } from "@syntropic137/contracts";
  import "./meter.css";

  // Meter's contract (packages/contracts/src/components/meter.ts) has no
  // `tone` prop — the contract wins over the brief's reference shape, so no
  // tone/variant axis is exposed here. `min`/`max` default to 0/1, matching
  // the native <meter> element's defaults.
  interface Props extends MeterContract {}

  let { value, min = 0, max = 1, label }: Props = $props();

  const clamped = $derived(Math.min(max, Math.max(min, value)));
  const percent = $derived(max > min ? ((clamped - min) / (max - min)) * 100 : 0);
</script>

<div
  class="meter"
  role="meter"
  aria-valuemin={min}
  aria-valuemax={max}
  aria-valuenow={clamped}
  aria-label={label}
>
  <div class="meter__fill" style="width: {percent}%"></div>
</div>
