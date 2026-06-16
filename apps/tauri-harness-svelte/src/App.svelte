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

  // Theming is RUNTIME: flip `data-theme` on the root element and every
  // var(--ds-color-*) re-resolves — no rebuild, no component changes. The dark
  // palette lives entirely in @design-system/design-tokens.
  type Theme = "light" | "dark";
  const stored =
    typeof localStorage !== "undefined" ? localStorage.getItem("ds-theme") : null;
  let theme = $state<Theme>(stored === "dark" ? "dark" : "light");

  $effect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("ds-theme", theme);
    } catch {
      /* localStorage unavailable — ignore */
    }
  });
</script>

<main>
  <header>
    <div>
      <h1>Design System Harness (Svelte)</h1>
      <p class="meta">
        active design: <strong>{activeDesign}</strong> · theme: <strong>{theme}</strong>
      </p>
    </div>
    <button
      class="theme-toggle"
      onclick={() => (theme = theme === "light" ? "dark" : "light")}
    >
      {theme === "light" ? "🌙 Dark" : "☀️ Light"}
    </button>
  </header>

  <section>
    <h2>Button</h2>
    <div class="row">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
    </div>
  </section>

  <section>
    <h2>Badge</h2>
    <div class="row">
      <Badge variant="solid" tone="neutral">Neutral</Badge>
      <Badge variant="solid" tone="accent">Accent</Badge>
      <Badge variant="outline" tone="success">Success</Badge>
      <Badge variant="soft" tone="danger">Danger</Badge>
    </div>
  </section>

  <section>
    <h2>Toggle</h2>
    <Toggle {pressed} onPressedChange={(v) => (pressed = v)}>
      {pressed ? "ON" : "OFF"}
    </Toggle>
  </section>
</main>

<style>
  :global(body) {
    margin: 0;
    background: var(--ds-color-bg);
    color: var(--ds-color-fg);
    transition:
      background var(--ds-duration-base, 200ms) var(--ds-ease, ease),
      color var(--ds-duration-base, 200ms) var(--ds-ease, ease);
  }
  main {
    padding: 2rem;
    min-height: 100vh;
    box-sizing: border-box;
    font-family: var(--ds-font-sans, sans-serif);
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
  }
  h1 {
    margin: 0 0 0.25rem;
  }
  .meta {
    font-family: var(--ds-font-mono, monospace);
    font-size: 0.85rem;
    color: var(--ds-color-text-muted);
    margin: 0 0 1.5rem;
  }
  section {
    margin-bottom: 2rem;
  }
  .row {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    align-items: center;
  }
  .theme-toggle {
    flex-shrink: 0;
    padding: 0.5rem 0.9rem;
    border: 1px solid var(--ds-color-border);
    border-radius: var(--ds-radius-md, 8px);
    background: var(--ds-color-surface);
    color: var(--ds-color-fg);
    font: inherit;
    cursor: pointer;
  }
  .theme-toggle:hover {
    background: var(--ds-color-surface-raised);
  }
</style>
