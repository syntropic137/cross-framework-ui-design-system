import { render, screen } from "@testing-library/react";
import { Button } from "../../src/components/Button.js";

describe("Button", () => {
  it("applies base class and renders children", () => {
    render(<Button>Click me</Button>);

    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toHaveClass("btn", "btn--primary", "btn--md");
  });

  it("supports variant and size modifiers", () => {
    render(
      <Button variant="ghost" size="lg">
        Ghost
      </Button>
    );

    const button = screen.getByRole("button", { name: /ghost/i });
    expect(button).toHaveClass("btn--ghost", "btn--lg");
  });

  it("merges custom className", () => {
    render(
      <Button className="custom-class" size="sm">
        Custom
      </Button>
    );

    const button = screen.getByRole("button", { name: /custom/i });
    expect(button).toHaveClass("custom-class", "btn--sm");
  });
});
