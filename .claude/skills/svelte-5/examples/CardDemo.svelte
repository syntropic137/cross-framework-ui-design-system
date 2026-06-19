<!--
  CardDemo.svelte  -  consumes Card.svelte.
  Demonstrates: passing implicit children, named snippet props, a parameterized
  snippet, a keyed {#each}, and bind:value with $state.
-->
<script lang="ts">
  import Card from "./Card.svelte";

  let items = $state([
    { id: 1, name: "Apples", qty: 5 },
    { id: 2, name: "Bananas", qty: 10 },
  ]);

  let newName = $state("");

  function add() {
    if (!newName.trim()) return;
    const id = Math.max(0, ...items.map((i) => i.id)) + 1;
    items.push({ id, name: newName.trim(), qty: 1 }); // proxy mutation is reactive
    newName = "";
  }
</script>

<Card title="Inventory">
  <!-- the `actions` named snippet -->
  {#snippet actions()}
    <button onclick={() => (items = [])}>clear</button>
  {/snippet}

  <!-- implicit `children` snippet: everything not in a {#snippet} block -->
  <ul>
    {#each items as item (item.id)}
      <li>{item.name} × {item.qty}</li>
    {:else}
      <li><em>empty</em></li>
    {/each}
  </ul>

  <form onsubmit={(e) => { e.preventDefault(); add(); }}>
    <input bind:value={newName} placeholder="add item" />
    <button type="submit">add</button>
  </form>

  <!-- parameterized `footer` snippet: receives the title back -->
  {#snippet footer(title)}
    <small>{title}: {items.length} item(s)</small>
  {/snippet}
</Card>
