<script lang="ts">
  import type { ButtonContract } from "@syntropic137/contracts";
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import "./button.css";

  // Mirrors default-react-v18's `ButtonHTMLAttributes<HTMLButtonElement> &
  // ButtonContract`: the contract props plus the full native button surface.
  // docs/component-standard.md sanctions framework-native additive props, and
  // without the native surface an icon-only button cannot carry an
  // `aria-label` and tab/toolbar patterns (`role`, `tabindex`,
  // `aria-selected`, `aria-controls`, `aria-pressed`) are unexpressible.
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
    ...rest
  }: Props = $props();
</script>

<!-- `{...rest}` comes first on purpose: the attributes below are component
     invariants and must not be clobbered by a pass-through prop. -->
<button
  {...rest}
  {type}
  data-variant={variant}
  data-size={size}
  disabled={disabled || loading}
  aria-busy={loading ? "true" : undefined}
>
  {#if typeof children === "string"}
    {children}
  {:else}
    {@render children?.()}
  {/if}
</button>
