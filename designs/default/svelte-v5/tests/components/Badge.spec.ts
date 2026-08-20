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

  // Required by docs/component-standard.md "Native Attribute Pass-Through";
  // default-react-v18's Badge already accepts HTMLAttributes, so without this
  // a React Badge carrying an id or aria-label cannot swap to the Svelte cell.
  describe("attribute pass-through", () => {
    it("forwards id and data-* attributes", () => {
      render(Badge, { props: { children: "New", id: "b1", "data-testid": "badge" } });
      expect(screen.getByTestId("badge")).toHaveAttribute("id", "b1");
    });

    it("forwards aria-label", () => {
      render(Badge, { props: { children: "3", "aria-label": "3 unread" } });
      expect(screen.getByLabelText("3 unread")).toBeInTheDocument();
    });

    it("merges a consumer class", () => {
      render(Badge, { props: { children: "New", class: "pinned" } });
      expect(screen.getByText("New")).toHaveClass("pinned");
    });

    it("does not let rest props clobber data-variant or data-tone", () => {
      render(Badge, {
        props: { children: "New", variant: "solid", tone: "danger", "data-variant": "x", "data-tone": "y" },
      });
      const el = screen.getByText("New");
      expect(el).toHaveAttribute("data-variant", "solid");
      expect(el).toHaveAttribute("data-tone", "danger");
    });
  });
});
