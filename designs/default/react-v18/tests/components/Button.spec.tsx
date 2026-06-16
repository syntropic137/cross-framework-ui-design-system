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
      <Button variant="secondary" size="lg">
        Secondary
      </Button>
    );

    const button = screen.getByRole("button", { name: /secondary/i });
    expect(button).toHaveClass("btn--secondary", "btn--lg");
  });

  it("marks loading buttons busy and disabled", () => {
    render(<Button loading>Saving</Button>);

    const button = screen.getByRole("button", { name: /saving/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
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
