<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import "./parallax.css";
  import { offsetFor } from "./offset.js";

  // Brutalist cell. Same prop contract as the default cell's Parallax — the
  // design swap must never break a consumer. The difference is in offset.ts:
  // offsets snap to a 24px grid instead of drifting continuously.
  // Native attribute pass-through per docs/component-standard.md. `style` is
  // deliberately excluded: the transform below is the component's entire
  // reason to exist, and a consumer style attribute would overwrite it.
  type Props = Omit<HTMLAttributes<HTMLDivElement>, "children" | "style"> & {
    /** Fraction of normal scroll motion: 0 = pinned, 1 = moves with content. */
    speed?: number;
    children?: Snippet | string;
  };

  let { speed = 0.2, children, class: className, ...rest }: Props = $props();

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

<!-- `{...rest}` first: the class and the scroll transform are invariants. -->
<div {...rest} class={["brutal-parallax", className]} style="transform: translate3d(0, {offset}px, 0)">
  {#if typeof children === "string"}
    {children}
  {:else}
    {@render children?.()}
  {/if}
</div>
