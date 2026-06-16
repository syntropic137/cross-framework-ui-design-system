<script module>
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import Toggle from "../lib/components/toggle/Toggle.svelte";

  const { Story } = defineMeta({
    title: "Components/Toggle",
    component: Toggle,
    argTypes: {
      pressed: { control: "boolean" },
      defaultPressed: { control: "boolean" },
      disabled: { control: "boolean" },
    },
  });
</script>

<Story name="Default" args={{}}>
  {#snippet children(args)}
    <Toggle {...args} />
  {/snippet}
</Story>

<Story name="Pressed" args={{ defaultPressed: true }}>
  {#snippet children(args)}
    <Toggle {...args} />
  {/snippet}
</Story>

<Story name="Disabled" args={{ disabled: true }}>
  {#snippet children(args)}
    <Toggle {...args} />
  {/snippet}
</Story>

<Story name="Disabled Pressed" args={{ disabled: true, defaultPressed: true }}>
  {#snippet children(args)}
    <Toggle {...args} />
  {/snippet}
</Story>

<Story name="With Label" args={{}}>
  {#snippet children(args)}
    <Toggle {...args}>Mute</Toggle>
  {/snippet}
</Story>
