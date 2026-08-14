<script module>
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import Parallax from "./Parallax.svelte";

  const { Story } = defineMeta({
    title: "Components/Parallax",
    component: Parallax,
    argTypes: {
      speed: { control: { type: "range", min: 0, max: 1, step: 0.05 } },
    },
  });
</script>

<Story name="Default" args={{ speed: 0.2 }}>
  {#snippet children(args)}
    <div style="height: 200vh; padding-top: 2rem;">
      <Parallax {...args}>
        <div style="padding: 1rem; background: var(--ds-color-surface-raised);">
          Scroll the preview — this layer drifts at {args.speed}× page motion.
        </div>
      </Parallax>
    </div>
  {/snippet}
</Story>

<Story name="Pinned" args={{ speed: 0 }}>
  {#snippet children(args)}
    <div style="height: 200vh; padding-top: 2rem;">
      <Parallax {...args}>
        <div style="padding: 1rem; background: var(--ds-color-surface-raised);">
          speed=0 — pinned, never moves.
        </div>
      </Parallax>
    </div>
  {/snippet}
</Story>
