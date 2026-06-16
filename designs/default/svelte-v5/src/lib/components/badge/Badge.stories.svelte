<script module>
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import Badge from "../lib/components/badge/Badge.svelte";

  const { Story } = defineMeta({
    title: "Components/Badge",
    component: Badge,
    argTypes: {
      variant: { control: "select", options: ["solid", "outline", "soft"] },
      tone: { control: "select", options: ["neutral", "success", "warning", "danger", "accent"] },
    },
  });
</script>

<Story name="Solid" args={{ variant: "solid", tone: "neutral" }}>
  {#snippet children(args)}
    <Badge {...args}>Badge</Badge>
  {/snippet}
</Story>

<Story name="Outline" args={{ variant: "outline", tone: "neutral" }}>
  {#snippet children(args)}
    <Badge {...args}>Badge</Badge>
  {/snippet}
</Story>

<Story name="Soft" args={{ variant: "soft", tone: "neutral" }}>
  {#snippet children(args)}
    <Badge {...args}>Badge</Badge>
  {/snippet}
</Story>

<Story name="Success" args={{ variant: "solid", tone: "success" }}>
  {#snippet children(args)}
    <Badge {...args}>Success</Badge>
  {/snippet}
</Story>

<Story name="Warning" args={{ variant: "solid", tone: "warning" }}>
  {#snippet children(args)}
    <Badge {...args}>Warning</Badge>
  {/snippet}
</Story>

<Story name="Danger" args={{ variant: "solid", tone: "danger" }}>
  {#snippet children(args)}
    <Badge {...args}>Danger</Badge>
  {/snippet}
</Story>

<Story name="Accent" args={{ variant: "solid", tone: "accent" }}>
  {#snippet children(args)}
    <Badge {...args}>Accent</Badge>
  {/snippet}
</Story>

<Story name="Soft Success" args={{ variant: "soft", tone: "success" }}>
  {#snippet children(args)}
    <Badge {...args}>Done</Badge>
  {/snippet}
</Story>

<Story name="Outline Danger" args={{ variant: "outline", tone: "danger" }}>
  {#snippet children(args)}
    <Badge {...args}>Error</Badge>
  {/snippet}
</Story>
