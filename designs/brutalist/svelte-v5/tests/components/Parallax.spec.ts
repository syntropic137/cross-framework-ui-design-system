import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/svelte";
import { offsetFor, STEP_PX } from "../../src/lib/components/parallax/offset.js";
import Parallax from "../../src/lib/components/parallax/Parallax.svelte";

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

describe("offsetFor (brutalist: stepped)", () => {
  it("snaps to the step grid instead of drifting continuously", () => {
    expect(STEP_PX).toBe(24);
    // continuous would be -50; nearest 24px step is -48
    expect(offsetFor(100, 0.5)).toBe(-48);
  });

  it("stays at zero until the first step is crossed", () => {
    expect(offsetFor(10, 0.5)).toBe(0); // -5 rounds to 0
    expect(offsetFor(40, 0.5)).toBe(-24); // -20 rounds to -24
  });

  it("returns 0 at speed 0 regardless of scroll", () => {
    expect(offsetFor(1000, 0)).toBe(0);
  });

  it("clamps speed above 1 and below 0", () => {
    expect(offsetFor(96, 5)).toBe(-96);
    expect(offsetFor(96, -3)).toBe(0);
  });

  // Assert "is a multiple of STEP_PX" directly. Do NOT use `% STEP_PX`:
  // JavaScript's remainder preserves the sign of the DIVIDEND, so a
  // perfectly valid offset like -48 yields `-0`, and `toBe(0)` compares with
  // Object.is, which distinguishes -0 from 0. The offsets are correct; the
  // modulo form just cannot express the intent safely.
  it("always lands on a multiple of the step", () => {
    for (const y of [7, 33, 91, 458, 1203]) {
      expect(Number.isInteger(offsetFor(y, 0.4) / STEP_PX)).toBe(true);
    }
  });
});

describe("Parallax (brutalist)", () => {
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

  it("does not attach a scroll listener when reduced motion is requested", () => {
    stubMatchMedia(true);
    const addSpy = vi.spyOn(window, "addEventListener");
    render(Parallax, { props: { speed: 0.5, children: "x" } });
    expect(addSpy.mock.calls.filter((c) => c[0] === "scroll")).toHaveLength(0);
  });

  it("initialises its offset at mount, snapped to the step grid", () => {
    stubMatchMedia(false);
    window.scrollY = 600;
    const { container } = render(Parallax, { props: { speed: 0.5, children: "x" } });
    const el = container.querySelector(".parallax") as HTMLElement;
    expect(el.style.transform).toBe("translate3d(0, -288px, 0)");
  });

  it("removes its scroll listener on unmount", () => {
    stubMatchMedia(false);
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(Parallax, { props: { speed: 0.5, children: "x" } });
    unmount();
    expect(removeSpy.mock.calls.some((c) => c[0] === "scroll")).toBe(true);
  });

  it("survives a missing matchMedia entirely", () => {
    // @ts-expect-error deliberately removing the API
    delete window.matchMedia;
    expect(() => render(Parallax, { props: { children: "x" } })).not.toThrow();
  });
});
