import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/svelte";
import Tag from "../src/lib/components/tag/Tag.svelte";

describe("Tag (brutalist)", () => {
  it("renders the label text", () => {
    render(Tag, { props: { label: "Beta" } });
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });

  it("defaults data-tone to neutral when tone is omitted", () => {
    render(Tag, { props: { label: "Default" } });
    expect(screen.getByText("Default")).toHaveAttribute("data-tone", "neutral");
  });

  it("applies data-tone from the tone prop", () => {
    render(Tag, { props: { label: "Accent", tone: "accent" } });
    expect(screen.getByText("Accent")).toHaveAttribute("data-tone", "accent");
  });

  it("applies neutral tone explicitly", () => {
    render(Tag, { props: { label: "Neutral", tone: "neutral" } });
    expect(screen.getByText("Neutral")).toHaveAttribute("data-tone", "neutral");
  });

  it("renders as a span element with the brutal-tag class", () => {
    render(Tag, { props: { label: "Tag" } });
    const el = screen.getByText("Tag");
    expect(el.tagName.toLowerCase()).toBe("span");
    expect(el).toHaveClass("brutal-tag");
  });

  // Required by docs/component-standard.md "Native Attribute Pass-Through".
  describe("attribute pass-through", () => {
    it("forwards id and data-* attributes", () => {
      render(Tag, { props: { label: "Beta", id: "beta", "data-testid": "beta-tag" } });
      expect(screen.getByTestId("beta-tag")).toHaveAttribute("id", "beta");
    });

    it("merges a consumer class", () => {
      render(Tag, { props: { label: "Beta", class: "pill" } });
      expect(screen.getByText("Beta")).toHaveClass("pill");
    });

    it("supports the object form of class", () => {
      render(Tag, { props: { label: "Beta", class: { pill: true, muted: false } } });
      const el = screen.getByText("Beta");
      expect(el).toHaveClass("pill");
      expect(el).not.toHaveClass("muted");
    });

    it("does not let rest props clobber data-tone", () => {
      render(Tag, { props: { label: "Beta", tone: "accent", "data-tone": "bogus" } });
      expect(screen.getByText("Beta")).toHaveAttribute("data-tone", "accent");
    });
  });
});
