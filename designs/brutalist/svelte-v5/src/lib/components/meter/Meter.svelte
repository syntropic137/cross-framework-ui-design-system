<script lang="ts">
  import type { MeterContract } from "@syntropic137/contracts";
  import type { HTMLAttributes } from "svelte/elements";
  import "./meter.css";

  // Mirrors the default cell exactly.
  // `min`/`max` default to 0/1, matching the native <meter> element.
  // `tone` is part of MeterContract (packages/contracts/src/components/meter.ts)
  // and is the supported way to recolour the fill.
  //
  // The native attribute surface is required by docs/component-standard.md
  // "Native Attribute Pass-Through", and load-bearing here: this renders
  // role="meter", so without it a consumer with a visible heading cannot pass
  // aria-labelledby, and a Meter given no `label` ships an ARIA role with no
  // accessible name at all.
  type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & MeterContract;

  let {
    value,
    min = 0,
    max = 1,
    label,
    tone = "accent",
    class: className,
    // Destructured so the contract's `label` can take precedence without an
    // undefined `label` erasing a consumer-supplied aria-label: the attribute
    // below is written after the spread, and undefined removes an attribute.
    "aria-label": ariaLabel,
    ...rest
  }: Props = $props();

  const clamped = $derived(Math.min(max, Math.max(min, value)));
  const percent = $derived(max > min ? ((clamped - min) / (max - min)) * 100 : 0);
</script>

<!-- `{...rest}` first: role, data-tone and the aria-value* trio are component
     invariants derived from the contract props and must not be overridable. -->
<div
  {...rest}
  class={["brutal-meter", className]}
  role="meter"
  data-tone={tone}
  aria-valuemin={min}
  aria-valuemax={max}
  aria-valuenow={clamped}
  aria-label={label ?? ariaLabel}
>
  <div class="brutal-meter__fill" style="width: {percent}%"></div>
</div>
