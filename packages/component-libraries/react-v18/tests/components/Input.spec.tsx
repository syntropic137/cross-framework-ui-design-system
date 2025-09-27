import { render, screen, fireEvent } from "@testing-library/react";
import { Input } from "../../src/components/Input.js";

describe("Input", () => {
  it("renders an input with semantic class", () => {
    render(<Input placeholder="Your name" />);

    const input = screen.getByPlaceholderText("Your name");
    expect(input).toHaveClass("input");
  });

  it("forwards props to the input element", () => {
    const handleChange = vi.fn();
    render(<Input type="email" onChange={handleChange} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "user@example.com" } });

    expect(handleChange).toHaveBeenCalled();
  });
});
