import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/svelte";
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

  it("does not apply the interactive class by default", () => {
    render(Card, { props: { children: "Static" } });
    expect(screen.getByText("Static")).not.toHaveClass("card--interactive");
  });

  it("applies the interactive class when interactive is true", () => {
    render(Card, { props: { interactive: true, children: "Clickable" } });
    expect(screen.getByText("Clickable")).toHaveClass("card--interactive");
  });
});
