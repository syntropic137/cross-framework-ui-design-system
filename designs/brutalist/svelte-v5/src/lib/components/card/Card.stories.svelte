<script module>
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import Card from "./Card.svelte";

  const { Story } = defineMeta({
    title: "Components/Card",
    component: Card,
    argTypes: {
      interactive: { control: "boolean" },
    },
  });
</script>

<Story name="Default" args={{}}>
  {#snippet children(args)}
    <Card {...args}>Cards use semantic tokens for surface, border, and text colors.</Card>
  {/snippet}
</Story>

<Story name="Interactive" args={{ interactive: true }}>
  {#snippet children(args)}
    <Card {...args}>Hover to see the offset shadow shift.</Card>
  {/snippet}
</Story>
