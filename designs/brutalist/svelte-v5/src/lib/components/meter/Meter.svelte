<script lang="ts">
  import type { MeterContract } from "@syntropic137/contracts";
  import "./meter.css";

  // Mirrors the default cell exactly. `min`/`max` default to 0/1, matching
  // the native <meter> element; `tone` comes from MeterContract.
  interface Props extends MeterContract {}

  let { value, min = 0, max = 1, label, tone = "accent" }: Props = $props();

  const clamped = $derived(Math.min(max, Math.max(min, value)));
  const percent = $derived(max > min ? ((clamped - min) / (max - min)) * 100 : 0);
</script>

<div
  class="brutal-meter"
  role="meter"
  data-tone={tone}
  aria-valuemin={min}
  aria-valuemax={max}
  aria-valuenow={clamped}
  aria-label={label}
>
  <div class="brutal-meter__fill" style="width: {percent}%"></div>
</div>
