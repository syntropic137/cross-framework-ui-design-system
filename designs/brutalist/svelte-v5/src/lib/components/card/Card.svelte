<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import "./card.css";

  // Card has no framework-neutral contract yet (see docs/component-standard.md
  // "Implementation Extras"). Mirrors the default cell's prop shape exactly:
  // a surface container with a single `interactive` boolean, no variant/tone axis.
  //
  // The native-attribute surface is required, not cosmetic: `interactive`
  // sets cursor:pointer, and a <div> that cannot accept onclick / role /
  // tabindex is styled as clickable while being unreachable.
  type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    interactive?: boolean;
    children?: Snippet | string;
  };

  let { interactive = false, children, class: className = "", ...rest }: Props = $props();
</script>

<!-- `{...rest}` first: class and data-state below are component invariants.
     The consumer's class is merged rather than dropped. -->
<div
  {...rest}
  class="brutal-card {className}"
  data-state={interactive ? "interactive" : "static"}
>
  {#if typeof children === "string"}
    {children}
  {:else}
    {@render children?.()}
  {/if}
</div>
