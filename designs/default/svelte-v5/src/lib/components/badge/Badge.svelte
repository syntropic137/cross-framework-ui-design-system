<script lang="ts">
  import type { BadgeContract } from "@syntropic137/contracts";
  import type { Snippet } from "svelte";
  import "./badge.css";

  interface Props extends BadgeContract {
    children?: Snippet | string;
  }

  let {
    variant = "solid",
    tone = "neutral",
    children,
  }: Props = $props();
</script>

<span data-variant={variant} data-tone={tone}>
  {#if typeof children === "string"}
    {children}
  {:else}
    {@render children?.()}
  {/if}
</span>
