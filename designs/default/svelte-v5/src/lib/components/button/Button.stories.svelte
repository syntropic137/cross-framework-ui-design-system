<script module>
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import Button from "../lib/components/button/Button.svelte";

  const { Story } = defineMeta({
    title: "Components/Button",
    component: Button,
    argTypes: {
      variant: { control: "select", options: ["primary", "secondary", "ghost", "danger"] },
      size: { control: "select", options: ["sm", "md", "lg"] },
      disabled: { control: "boolean" },
      loading: { control: "boolean" },
    },
  });
</script>

<Story name="Primary" args={{ variant: "primary" }}>
  {#snippet children(args)}
    <Button {...args}>Click me</Button>
  {/snippet}
</Story>

<Story name="Secondary" args={{ variant: "secondary" }}>
  {#snippet children(args)}
    <Button {...args}>Click me</Button>
  {/snippet}
</Story>

<Story name="Ghost" args={{ variant: "ghost" }}>
  {#snippet children(args)}
    <Button {...args}>Click me</Button>
  {/snippet}
</Story>

<Story name="Danger" args={{ variant: "danger" }}>
  {#snippet children(args)}
    <Button {...args}>Delete</Button>
  {/snippet}
</Story>

<Story name="Small" args={{ variant: "primary", size: "sm" }}>
  {#snippet children(args)}
    <Button {...args}>Small</Button>
  {/snippet}
</Story>

<Story name="Large" args={{ variant: "primary", size: "lg" }}>
  {#snippet children(args)}
    <Button {...args}>Large</Button>
  {/snippet}
</Story>

<Story name="Disabled" args={{ variant: "primary", disabled: true }}>
  {#snippet children(args)}
    <Button {...args}>Disabled</Button>
  {/snippet}
</Story>

<Story name="Loading" args={{ variant: "primary", loading: true }}>
  {#snippet children(args)}
    <Button {...args}>Loading...</Button>
  {/snippet}
</Story>
