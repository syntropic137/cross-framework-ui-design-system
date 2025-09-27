import { render, screen } from "@testing-library/react";
import { Card } from "../../src/components/Card.js";

describe("Card", () => {
  it("applies base card class", () => {
    render(<Card>Content</Card>);

    const card = screen.getByText("Content");
    expect(card).toHaveClass("card");
  });

  it("applies interactive modifier when requested", () => {
    render(<Card interactive>Interactive</Card>);

    const card = screen.getByText("Interactive");
    expect(card).toHaveClass("card--interactive");
  });
});
