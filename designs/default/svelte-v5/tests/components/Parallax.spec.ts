import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/svelte";
import { offsetFor } from "../../src/lib/components/parallax/offset.js";
import Parallax from "../../src/lib/components/parallax/Parallax.svelte";

const PARALLAX_CLASS = "parallax";

// jsdom does not implement matchMedia. Every test that mounts Parallax must
// install a stub first, or the component's guard is the only thing under test.
function stubMatchMedia(reduced: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: reduced,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe("offsetFor", () => {
  it("returns 0 at speed 0 regardless of scroll (pinned layer)", () => {
    expect(offsetFor(0, 0)).toBe(0);
    expect(offsetFor(1000, 0)).toBe(0);
  });

  it("moves opposite the scroll direction so the layer drifts upward", () => {
    expect(offsetFor(100, 1)).toBe(-100);
    expect(offsetFor(100, 0.5)).toBe(-50);
  });

  it("clamps speed above 1 and below 0", () => {
    expect(offsetFor(100, 5)).toBe(-100);
    expect(offsetFor(100, -3)).toBe(0);
  });

  it("handles a negative scrollY (rubber-band overscroll) without flipping", () => {
    expect(offsetFor(-50, 0.5)).toBe(25);
  });

  it("is zero at the top of the page for any speed", () => {
    expect(offsetFor(0, 0.35)).toBe(0);
  });

  // Regression: `-scrollY * 0` is IEEE-754 -0, which is not Object.is-equal
  // to 0 and poisons downstream arithmetic (`-0 % n === -0`).
  it("never returns negative zero", () => {
    for (const [y, s] of [[1000, 0], [100, -3], [0, 0.35], [0, 0]] as const) {
      expect(Object.is(offsetFor(y, s), -0)).toBe(false);
    }
  });
});

describe("Parallax", () => {
  beforeEach(() => {
    window.scrollY = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders its children", () => {
    stubMatchMedia(false);
    render(Parallax, { props: { children: "layer content" } });
    expect(screen.getByText("layer content")).toBeInTheDocument();
  });

  it("applies no transform at the top of the page", () => {
    stubMatchMedia(false);
    const { container } = render(Parallax, { props: { speed: 0.5, children: "x" } });
    const el = container.querySelector(".parallax") as HTMLElement;
    expect(el.style.transform).toBe("translate3d(0, 0px, 0)");
  });

  it("initialises its offset at mount when the page is already scrolled", () => {
    stubMatchMedia(false);
    window.scrollY = 600;
    const { container } = render(Parallax, { props: { speed: 0.5, children: "x" } });
    const el = container.querySelector(".parallax") as HTMLElement;
    expect(el.style.transform).toBe("translate3d(0, -300px, 0)");
  });

  it("does not attach a scroll listener when reduced motion is requested", () => {
    stubMatchMedia(true);
    const addSpy = vi.spyOn(window, "addEventListener");
    render(Parallax, { props: { speed: 0.5, children: "x" } });
    const scrollListeners = addSpy.mock.calls.filter((c) => c[0] === "scroll");
    expect(scrollListeners).toHaveLength(0);
  });

  it("attaches a passive scroll listener when motion is allowed", () => {
    stubMatchMedia(false);
    const addSpy = vi.spyOn(window, "addEventListener");
    render(Parallax, { props: { speed: 0.5, children: "x" } });
    const scrollCall = addSpy.mock.calls.find((c) => c[0] === "scroll");
    expect(scrollCall).toBeDefined();
    expect(scrollCall?.[2]).toMatchObject({ passive: true });
  });

  it("removes its scroll listener on unmount", () => {
    stubMatchMedia(false);
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(Parallax, { props: { speed: 0.5, children: "x" } });
    unmount();
    expect(removeSpy.mock.calls.some((c) => c[0] === "scroll")).toBe(true);
  });

  it("survives a missing matchMedia entirely (SSR / bare jsdom)", () => {
    // @ts-expect-error deliberately removing the API
    delete window.matchMedia;
    expect(() => render(Parallax, { props: { children: "x" } })).not.toThrow();
  });

  // Required by docs/component-standard.md "Native Attribute Pass-Through".
  // `style` is excluded from the surface on purpose: the scroll transform is
  // the component's whole point and must not be overwritable.
  describe("attribute pass-through", () => {
    it("forwards id and data-* attributes", () => {
      stubMatchMedia(true);
      const { container } = render(Parallax, {
        props: { children: "x", id: "hero", "data-testid": "hero-layer" },
      });
      const el = container.querySelector("#hero") as HTMLElement;
      expect(el).toHaveAttribute("data-testid", "hero-layer");
    });

    it("merges a consumer class alongside the component class", () => {
      stubMatchMedia(true);
      const { container } = render(Parallax, { props: { children: "x", class: "layer-2" } });
      const el = container.querySelector(".layer-2") as HTMLElement;
      expect(el).toHaveClass(PARALLAX_CLASS);
    });

    it("keeps its own transform, which a consumer cannot replace", () => {
      stubMatchMedia(false);
      window.scrollY = 0;
      const { container } = render(Parallax, { props: { children: "x", class: "layer-2" } });
      const el = container.querySelector(`.${PARALLAX_CLASS}`) as HTMLElement;
      expect(el.style.transform).toContain("translate3d");
    });
  });
});
