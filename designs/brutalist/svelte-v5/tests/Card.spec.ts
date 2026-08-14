import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/svelte";
import Card from "../src/lib/components/card/Card.svelte";

describe("Card (brutalist)", () => {
  it("renders children", () => {
    render(Card, { props: { children: "Card content" } });
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it("renders as a div element with the brutal-card class", () => {
    render(Card, { props: { children: "Body" } });
    const el = screen.getByText("Body");
    expect(el.tagName.toLowerCase()).toBe("div");
    expect(el).toHaveClass("brutal-card");
  });

  it("does not mark data-state as interactive by default", () => {
    render(Card, { props: { children: "Static" } });
    expect(screen.getByText("Static")).not.toHaveAttribute("data-state", "interactive");
  });

  it("marks data-state as interactive when interactive is true", () => {
    render(Card, { props: { interactive: true, children: "Clickable" } });
    expect(screen.getByText("Clickable")).toHaveAttribute("data-state", "interactive");
  });
});
