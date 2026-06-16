<script lang="ts">
  import type { Component } from "svelte";
  import type { Snippet } from "svelte";
  import type {
    BadgeContract,
    ButtonContract,
    ToggleContract,
  } from "@design-system/contracts";
  import { ui, activeDesign } from "./ui/adapter.js";

  // The adapter values are typed `unknown` (RequiredComponentAdapter widened
  // them — see contract-adapter.ts in each design). Cast to typed Svelte 5
  // Component types so we can use them with direct JSX-like syntax.
  type BadgeProps = BadgeContract & { children?: Snippet | string };
  type ButtonProps = ButtonContract & {
    children?: Snippet | string;
    onclick?: (e: MouseEvent) => void;
  };
  type ToggleProps = ToggleContract & { children?: Snippet | string };

  const Badge = ui.badge as Component<BadgeProps>;
  const Button = ui.button as Component<ButtonProps>;
  const Toggle = ui.toggle as Component<ToggleProps>;

  let pressed = $state(false);
</script>

<main style="padding: 2rem; font-family: sans-serif;">
  <h1>Design System Harness (Svelte)</h1>
  <p style="font-family: monospace; font-size: 0.85rem; color: #666; margin-top: 0;">
    active design: <strong>{activeDesign}</strong>
  </p>

  <section style="margin-bottom: 2rem;">
    <h2>Button</h2>
    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
    </div>
  </section>

  <section style="margin-bottom: 2rem;">
    <h2>Badge</h2>
    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
      <Badge variant="solid" tone="neutral">Neutral</Badge>
      <Badge variant="solid" tone="accent">Accent</Badge>
      <Badge variant="outline" tone="success">Success</Badge>
      <Badge variant="soft" tone="danger">Danger</Badge>
    </div>
  </section>

  <section style="margin-bottom: 2rem;">
    <h2>Toggle</h2>
    <Toggle {pressed} onPressedChange={(v) => (pressed = v)}>
      {pressed ? "ON" : "OFF"}
    </Toggle>
  </section>
</main>
