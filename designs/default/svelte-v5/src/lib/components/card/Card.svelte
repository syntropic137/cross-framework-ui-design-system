<script lang="ts">
  import type { Snippet } from "svelte";
  import "./card.css";

  // Card has no framework-neutral contract yet (see docs/component-standard.md
  // "Implementation Extras" — it mirrors the React port 1:1: a surface
  // container with a single `interactive` boolean, no variant/tone axis).
  interface Props {
    interactive?: boolean;
    children?: Snippet | string;
  }

  let { interactive = false, children }: Props = $props();
</script>

<div class="card" class:card--interactive={interactive}>
  {#if typeof children === "string"}
    {children}
  {:else}
    {@render children?.()}
  {/if}
</div>
