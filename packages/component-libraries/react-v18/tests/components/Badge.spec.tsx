import { render, screen } from "@testing-library/react";
import { Badge } from "../../src/components/Badge.js";

describe("Badge", () => {
  it("renders with base class and content", () => {
    render(<Badge>Test content</Badge>);

    const element = screen.getByText("Test content");
    expect(element).toHaveClass("badge");
  });

  it("applies variant classes", () => {
    const { rerender } = render(
      <Badge variant="primary">Primary content</Badge>
    );

    expect(screen.getByText("Primary content")).toHaveClass("badge--primary");

    rerender(<Badge variant="secondary">Secondary content</Badge>);
    expect(screen.getByText("Secondary content")).toHaveClass("badge--secondary");

    rerender(<Badge variant="ghost">Ghost content</Badge>);
    expect(screen.getByText("Ghost content")).toHaveClass("badge--ghost");

    rerender(<Badge variant="danger">Danger content</Badge>);
    expect(screen.getByText("Danger content")).toHaveClass("badge--danger");
  });

  it("applies size variant classes", () => {
    const { rerender } = render(<Badge size="sm">Sm content</Badge>);

    expect(screen.getByText("Sm content")).toHaveClass("badge--sm");

    rerender(<Badge size="md">Md content</Badge>);
    expect(screen.getByText("Md content")).toHaveClass("badge--md");

    rerender(<Badge size="lg">Lg content</Badge>);
    expect(screen.getByText("Lg content")).toHaveClass("badge--lg");
  });


  it("merges custom className", () => {
    render(<Badge className="custom-class">Custom content</Badge>);

    const element = screen.getByText("Custom content");
    expect(element).toHaveClass("custom-class", "badge");
  });


  it("forwards ref correctly", () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<Badge ref={ref}>Ref test</Badge>);

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
