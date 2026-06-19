<script lang="ts">
  import type { ButtonContract } from "@syntropic137/contracts";
  import type { Snippet } from "svelte";
  import "./button.css";

  interface Props extends ButtonContract {
    children?: Snippet | string;
    onclick?: (e: MouseEvent) => void;
  }

  let {
    variant = "primary",
    size = "md",
    disabled = false,
    loading = false,
    type = "button",
    children,
    onclick,
  }: Props = $props();
</script>

<button
  {type}
  data-variant={variant}
  data-size={size}
  disabled={disabled || loading}
  aria-busy={loading ? "true" : undefined}
  class="brutal-btn brutal-btn--{variant} brutal-btn--{size}"
  {onclick}
>
  {#if typeof children === "string"}
    {children}
  {:else}
    {@render children?.()}
  {/if}
</button>
