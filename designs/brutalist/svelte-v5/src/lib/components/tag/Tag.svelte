<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import "./tag.css";

  // Tag has no framework-neutral contract yet (same status as Card). Mirrors
  // the default cell's prop shape exactly: a label chip with a two-value tone
  // axis, defaulting to "neutral".
  //
  // Native attribute pass-through per docs/component-standard.md, so a Tag can
  // carry an id, data-* hooks or a consumer class without being hand-rolled.
  type Props = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
    label: string;
    tone?: "neutral" | "accent";
  };

  let { label, tone = "neutral", class: className, ...rest }: Props = $props();
</script>

<!-- `{...rest}` first: data-tone is a component invariant. -->
<span {...rest} class={["brutal-tag", className]} data-tone={tone}>{label}</span>
