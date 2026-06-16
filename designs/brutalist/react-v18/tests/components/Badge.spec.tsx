import { render, screen } from "@testing-library/react";
import { Badge } from "../../src/components/Badge.js";

describe("Badge (brutalist)", () => {
  it("renders with base class and content", () => {
    render(<Badge>Test content</Badge>);
    const element = screen.getByText("Test content");
    expect(element).toHaveClass("brutal-badge");
  });

  it("applies variant classes", () => {
    const { rerender } = render(<Badge variant="solid">Solid content</Badge>);
    expect(screen.getByText("Solid content")).toHaveClass("brutal-badge--solid");

    rerender(<Badge variant="soft">Soft content</Badge>);
    expect(screen.getByText("Soft content")).toHaveClass("brutal-badge--soft");

    rerender(<Badge variant="outline">Outline content</Badge>);
    expect(screen.getByText("Outline content")).toHaveClass("brutal-badge--outline");
  });

  it("applies tone classes", () => {
    render(<Badge tone="danger">Danger content</Badge>);
    expect(screen.getByText("Danger content")).toHaveClass("brutal-badge--danger");
  });

  it("applies size variant classes", () => {
    const { rerender } = render(<Badge size="sm">Sm content</Badge>);
    expect(screen.getByText("Sm content")).toHaveClass("brutal-badge--sm");

    rerender(<Badge size="md">Md content</Badge>);
    expect(screen.getByText("Md content")).toHaveClass("brutal-badge--md");

    rerender(<Badge size="lg">Lg content</Badge>);
    expect(screen.getByText("Lg content")).toHaveClass("brutal-badge--lg");
  });

  it("merges custom className", () => {
    render(<Badge className="custom-class">Custom content</Badge>);
    const element = screen.getByText("Custom content");
    expect(element).toHaveClass("custom-class", "brutal-badge");
  });

  it("forwards ref correctly", () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<Badge ref={ref}>Ref test</Badge>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
