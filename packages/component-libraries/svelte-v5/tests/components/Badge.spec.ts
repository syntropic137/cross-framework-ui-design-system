import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/svelte";
import Badge from "../../src/lib/components/badge/Badge.svelte";

describe("Badge", () => {
  it("renders children", () => {
    render(Badge, { props: { children: "New" } });
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("applies default variant as data attribute", () => {
    render(Badge, { props: { children: "Default" } });
    expect(screen.getByText("Default")).toHaveAttribute("data-variant", "solid");
  });

  it("applies variant as data attribute", () => {
    render(Badge, { props: { variant: "outline", children: "Outline" } });
    expect(screen.getByText("Outline")).toHaveAttribute("data-variant", "outline");
  });

  it("applies soft variant as data attribute", () => {
    render(Badge, { props: { variant: "soft", children: "Soft" } });
    expect(screen.getByText("Soft")).toHaveAttribute("data-variant", "soft");
  });

  it("applies tone as data attribute", () => {
    render(Badge, { props: { tone: "success", children: "Done" } });
    expect(screen.getByText("Done")).toHaveAttribute("data-tone", "success");
  });

  it("applies default tone as data attribute", () => {
    render(Badge, { props: { children: "Badge" } });
    expect(screen.getByText("Badge")).toHaveAttribute("data-tone", "neutral");
  });

  it("applies danger tone", () => {
    render(Badge, { props: { tone: "danger", children: "Error" } });
    expect(screen.getByText("Error")).toHaveAttribute("data-tone", "danger");
  });

  it("applies warning tone", () => {
    render(Badge, { props: { tone: "warning", children: "Warn" } });
    expect(screen.getByText("Warn")).toHaveAttribute("data-tone", "warning");
  });

  it("applies accent tone", () => {
    render(Badge, { props: { tone: "accent", children: "Accent" } });
    expect(screen.getByText("Accent")).toHaveAttribute("data-tone", "accent");
  });

  it("renders as a span element", () => {
    render(Badge, { props: { children: "Tag" } });
    const el = screen.getByText("Tag");
    expect(el.tagName.toLowerCase()).toBe("span");
  });
});
