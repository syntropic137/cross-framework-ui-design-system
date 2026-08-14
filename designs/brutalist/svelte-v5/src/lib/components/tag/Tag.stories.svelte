<script module>
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import Tag from "./Tag.svelte";

  const { Story } = defineMeta({
    title: "Components/Tag",
    component: Tag,
    argTypes: {
      label: { control: "text" },
      tone: { control: "select", options: ["neutral", "accent"] },
    },
  });
</script>

<Story name="Default" args={{ label: "Default" }}>
  {#snippet children(args)}
    <Tag {...args} />
  {/snippet}
</Story>

<Story name="Accent" args={{ label: "Accent", tone: "accent" }}>
  {#snippet children(args)}
    <Tag {...args} />
  {/snippet}
</Story>
