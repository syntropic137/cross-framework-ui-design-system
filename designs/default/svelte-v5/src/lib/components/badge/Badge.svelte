<script lang="ts">
  import type { BadgeContract } from "@syntropic137/contracts";
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import "./badge.css";

  // Native attribute pass-through per docs/component-standard.md, matching
  // default-react-v18's Badge (HTMLAttributes + ...rest). Badge owns no class
  // of its own here — the stylesheet targets span[data-variant] — so `class`
  // rides through `rest` untouched and keeps its ClassValue semantics.
  type Props = Omit<HTMLAttributes<HTMLSpanElement>, "children"> &
    BadgeContract & {
      children?: Snippet | string;
    };

  let {
    variant = "solid",
    tone = "neutral",
    children,
    ...rest
  }: Props = $props();
</script>

<!-- `{...rest}` first: data-variant and data-tone are component invariants. -->
<span {...rest} data-variant={variant} data-tone={tone}>
  {#if typeof children === "string"}
    {children}
  {:else}
    {@render children?.()}
  {/if}
</span>
