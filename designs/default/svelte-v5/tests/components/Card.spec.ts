import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import Card from "../../src/lib/components/card/Card.svelte";

describe("Card", () => {
  it("renders children", () => {
    render(Card, { props: { children: "Card content" } });
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it("renders as a div element with the card class", () => {
    render(Card, { props: { children: "Body" } });
    const el = screen.getByText("Body");
    expect(el.tagName.toLowerCase()).toBe("div");
    expect(el).toHaveClass("card");
  });

  it("does not mark data-state as interactive by default", () => {
    render(Card, { props: { children: "Static" } });
    expect(screen.getByText("Static")).not.toHaveAttribute("data-state", "interactive");
  });

  it("marks data-state as interactive when interactive is true", () => {
    render(Card, { props: { interactive: true, children: "Clickable" } });
    expect(screen.getByText("Clickable")).toHaveAttribute("data-state", "interactive");
  });

  // An interactive Card sets cursor:pointer, so it must be able to carry the
  // handler, role and tabindex that make it actually reachable. Required by
  // docs/component-standard.md "Native Attribute Pass-Through"; matches
  // default-react-v18's Card, which is HTMLAttributes<HTMLDivElement> + rest.
  describe("attribute pass-through", () => {
    it("forwards id and data-* attributes", () => {
      render(Card, { props: { id: "summary", "data-testid": "summary-card", children: "Body" } });
      const el = screen.getByTestId("summary-card");
      expect(el).toHaveAttribute("id", "summary");
    });

    it("forwards role and tabindex so an interactive card is reachable", () => {
      render(Card, {
        props: { interactive: true, role: "button", tabindex: 0, children: "Open" }
      });
      const el = screen.getByRole("button", { name: "Open" });
      expect(el).toHaveAttribute("tabindex", "0");
    });

    it("invokes a consumer onclick handler", async () => {
      const user = userEvent.setup();
      const onclick = vi.fn();
      render(Card, { props: { interactive: true, onclick, children: "Open" } });
      await user.click(screen.getByText("Open"));
      expect(onclick).toHaveBeenCalledOnce();
    });

    it("merges a consumer class with the card class", () => {
      render(Card, { props: { class: "featured", children: "Body" } });
      const el = screen.getByText("Body");
      expect(el).toHaveClass("card");
      expect(el).toHaveClass("featured");
    });

    it("does not let rest props clobber data-state", () => {
      render(Card, { props: { interactive: true, "data-state": "bogus", children: "Body" } });
      expect(screen.getByText("Body")).toHaveAttribute("data-state", "interactive");
    });
  });
});
