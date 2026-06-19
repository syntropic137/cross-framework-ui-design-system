<!--
  Card.svelte  -  snippets / children instead of slots.
  Demonstrates: the `children` snippet (default content), an optional named
  snippet prop, a parameterized snippet, typing with Snippet<[...]>, and
  rendering with {@render ...?.()}.
-->
<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    title: string;
    /** default content (anything placed between <Card>…</Card>) */
    children?: Snippet;
    /** optional header actions area */
    actions?: Snippet;
    /** optional footer that receives the title back as a param */
    footer?: Snippet<[string]>;
  }

  let { title, children, actions, footer }: Props = $props();
</script>

<article class="card">
  <header>
    <h3>{title}</h3>
    {#if actions}
      <div class="actions">{@render actions()}</div>
    {/if}
  </header>

  <div class="body">
    {@render children?.()}
  </div>

  {#if footer}
    <footer>{@render footer(title)}</footer>
  {/if}
</article>

<style>
  .card {
    border: 1px solid var(--ds-color-border, #ddd);
    border-radius: var(--ds-radius-md, 0.5rem);
    padding: 1rem;
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  h3 {
    margin: 0;
  }
</style>
