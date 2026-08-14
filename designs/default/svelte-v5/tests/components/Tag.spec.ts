import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/svelte";
import Tag from "../../src/lib/components/tag/Tag.svelte";

describe("Tag", () => {
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
});
