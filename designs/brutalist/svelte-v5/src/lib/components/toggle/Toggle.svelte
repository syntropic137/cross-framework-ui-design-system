<script lang="ts">
  import type { ToggleContract } from "@syntropic137/contracts";
  import type { Snippet } from "svelte";
  import "./toggle.css";

  interface Props extends ToggleContract {
    children?: Snippet | string;
  }

  let {
    pressed,
    defaultPressed = false,
    onPressedChange,
    disabled = false,
    children,
  }: Props = $props();

  // isControlled is $derived so Svelte tracks `pressed` reactively
  const isControlled = $derived(pressed !== undefined);
  // internalPressed seeds from defaultPressed at mount only — this is the
  // standard uncontrolled-input pattern (mirrors React's useState(defaultPressed)).
  // The snapshot is intentional; use `pressed` prop for controlled mode.
  // svelte-ignore state_referenced_locally
  let internalPressed = $state(defaultPressed);

  const currentPressed = $derived(isControlled ? pressed! : internalPressed);

  function handleClick() {
    if (disabled) return;

    const next = !currentPressed;
    if (!isControlled) {
      internalPressed = next;
    }
    onPressedChange?.(next);
  }
</script>

<button
  type="button"
  aria-pressed={currentPressed}
  {disabled}
  data-state={currentPressed ? "pressed" : "unpressed"}
  class="brutal-toggle{currentPressed ? ' brutal-toggle--pressed' : ''}{disabled ? ' brutal-toggle--disabled' : ''}"
  onclick={handleClick}
>
  <span class="brutal-toggle__track" aria-hidden="true">
    <span class="brutal-toggle__thumb"></span>
  </span>
  {#if typeof children === "string"}
    {children}
  {:else}
    {@render children?.()}
  {/if}
</button>
