<script lang="ts">
  import type { BadgeContract } from "@syntropic137/contracts";
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import "./badge.css";

  // Native attribute pass-through per docs/component-standard.md, matching
  // default-react-v18's Badge (HTMLAttributes + ...rest).
  type Props = Omit<HTMLAttributes<HTMLSpanElement>, "children"> &
    BadgeContract & {
      children?: Snippet | string;
    };

  let {
    variant = "solid",
    tone = "neutral",
    children,
    class: className,
    ...rest
  }: Props = $props();
</script>

<!-- `{...rest}` first: data-* and the brutal-badge classes are invariants. -->
<span
  {...rest}
  data-variant={variant}
  data-tone={tone}
  class={["brutal-badge", `brutal-badge--${variant}`, `brutal-badge--${tone}`, className]}
>
  {#if typeof children === "string"}
    {children}
  {:else}
    {@render children?.()}
  {/if}
</span>
