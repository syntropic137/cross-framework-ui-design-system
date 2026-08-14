<script module>
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import Meter from "./Meter.svelte";

  const { Story } = defineMeta({
    title: "Components/Meter",
    component: Meter,
    argTypes: {
      value: { control: "number" },
      min: { control: "number" },
      max: { control: "number" },
      label: { control: "text" },
      tone: {
        control: "select",
        options: ["accent", "neutral", "success", "warning", "danger"],
      },
    },
  });
</script>

<Story name="Default" args={{ value: 0.5 }}>
  {#snippet children(args)}
    <Meter {...args} />
  {/snippet}
</Story>

<Story name="Low" args={{ value: 0.1, label: "Low usage" }}>
  {#snippet children(args)}
    <Meter {...args} />
  {/snippet}
</Story>

<Story name="Full" args={{ value: 1 }}>
  {#snippet children(args)}
    <Meter {...args} />
  {/snippet}
</Story>

<Story name="CustomRange" args={{ value: 40, max: 100, label: "Disk usage" }}>
  {#snippet children(args)}
    <Meter {...args} />
  {/snippet}
</Story>
