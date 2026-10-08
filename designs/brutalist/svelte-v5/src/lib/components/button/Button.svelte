<script lang="ts">
  import type { ButtonContract } from "@syntropic137/design-contracts";
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import "./button.css";

  // Same additive native-attribute surface as designs/default/svelte-v5 and
  // default-react-v18: contract props plus the full native <button> surface,
  // so aria-label / role / tabindex / aria-pressed can be passed through.
  type Props = Omit<HTMLButtonAttributes, "children" | "type" | "disabled"> &
    ButtonContract & {
      children?: Snippet | string;
    };

  let {
    variant = "primary",
    size = "md",
    disabled = false,
    loading = false,
    type = "button",
    children,
    class: className = "",
    ...rest
  }: Props = $props();
</script>

<!-- `{...rest}` first: the attributes below are component invariants. -->
<button
  {...rest}
  {type}
  data-variant={variant}
  data-size={size}
  disabled={disabled || loading}
  aria-busy={loading ? "true" : undefined}
  class="brutal-btn brutal-btn--{variant} brutal-btn--{size} {className}"
>
  {#if typeof children === "string"}
    {children}
  {:else}
    {@render children?.()}
  {/if}
</button>
