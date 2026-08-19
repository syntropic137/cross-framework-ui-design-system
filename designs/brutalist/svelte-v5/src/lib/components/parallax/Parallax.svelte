<script lang="ts">
  import type { Snippet } from "svelte";
  import "./parallax.css";
  import { offsetFor } from "./offset.js";

  // Brutalist cell. Same prop contract as the default cell's Parallax — the
  // design swap must never break a consumer. The difference is in offset.ts:
  // offsets snap to a 24px grid instead of drifting continuously.
  interface Props {
    /** Fraction of normal scroll motion: 0 = pinned, 1 = moves with content. */
    speed?: number;
    children?: Snippet | string;
  }

  let { speed = 0.2, children }: Props = $props();

  let offset = $state(0);

  $effect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        offset = offsetFor(window.scrollY, speed);
      });
    };

    // Initialise from the current scroll position: the component can mount
    // with the page already scrolled (tab switch, deep link with scroll
    // restoration), and without this the layer sits at 0 until the first
    // scroll event and then jumps.
    offset = offsetFor(window.scrollY, speed);

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  });
</script>

<div class="brutal-parallax" style="transform: translate3d(0, {offset}px, 0)">
  {#if typeof children === "string"}
    {children}
  {:else}
    {@render children?.()}
  {/if}
</div>
