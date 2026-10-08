<script lang="ts">
  import type { ToggleContract } from "@syntropic137/design-contracts";
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import "./toggle.css";

  // Same additive native-attribute surface as default-react-v18's Toggle,
  // which spreads `...rest` onto its <button>. Needed so an icon-only toggle
  // can carry an `aria-label`.
  type Props = Omit<HTMLButtonAttributes, "children" | "type" | "disabled"> &
    ToggleContract & {
      children?: Snippet | string;
    };

  let {
    pressed,
    defaultPressed = false,
    onPressedChange,
    disabled = false,
    children,
    // Pulled out of `rest` deliberately. The component owns the click handler,
    // so a spread `onclick` would be overwritten by ours and silently never
    // run. default-react-v18's Toggle destructures onClick for the same
    // reason and calls it from handleToggle.
    onclick,
    ...rest
  }: Props = $props();

  // isControlled is $derived so Svelte tracks `pressed` reactively
  const isControlled = $derived(pressed !== undefined);
  // internalPressed seeds from defaultPressed at mount only — this is the
  // standard uncontrolled-input pattern (mirrors React's useState(defaultPressed)).
  // The snapshot is intentional; use `pressed` prop for controlled mode.
  // svelte-ignore state_referenced_locally
  let internalPressed = $state(defaultPressed);

  const currentPressed = $derived(isControlled ? pressed! : internalPressed);

  function handleClick(event: MouseEvent & { currentTarget: HTMLButtonElement }) {
    if (disabled) return;

    const next = !currentPressed;
    if (!isControlled) {
      internalPressed = next;
    }
    onPressedChange?.(next);
    onclick?.(event);
  }
</script>

<!-- `{...rest}` first: the attributes below are component invariants. -->
<button
  {...rest}
  type="button"
  aria-pressed={currentPressed}
  {disabled}
  data-state={currentPressed ? "pressed" : "unpressed"}
  onclick={handleClick}
>
  <span class="toggle__track" aria-hidden="true">
    <span class="toggle__thumb"></span>
  </span>
  {#if typeof children === "string"}
    {children}
  {:else}
    {@render children?.()}
  {/if}
</button>
