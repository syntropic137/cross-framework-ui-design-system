import { render, screen, fireEvent } from "@testing-library/react";
import { Toggle } from "../../src/components/Toggle.js";

describe("Toggle", () => {
  it("renders with button role and default unpressed state", () => {
    render(<Toggle aria-label="Airplane mode" />);

    const toggle = screen.getByRole("button", { name: /airplane mode/i });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });

  it("toggles value in uncontrolled mode when clicked", () => {
    const onPressedChange = vi.fn();
    render(
      <Toggle
        aria-label="Notifications"
        defaultPressed={false}
        onPressedChange={onPressedChange}
      />
    );

    const toggle = screen.getByRole("button", { name: /notifications/i });

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(onPressedChange).toHaveBeenCalledWith(true);

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(onPressedChange).toHaveBeenLastCalledWith(false);
  });

  it("supports controlled usage", () => {
    const onPressedChange = vi.fn();
    const { rerender } = render(
      <Toggle
        aria-label="Dark mode"
        pressed={false}
        onPressedChange={onPressedChange}
      />
    );

    const toggle = screen.getByRole("button", { name: /dark mode/i });

    fireEvent.click(toggle);
    expect(onPressedChange).toHaveBeenCalledWith(true);
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    rerender(
      <Toggle
        aria-label="Dark mode"
        pressed={true}
        onPressedChange={onPressedChange}
      />
    );

    expect(screen.getByRole("button", { name: /dark mode/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("responds to keyboard interaction", () => {
    const onPressedChange = vi.fn();
    render(
      <Toggle
        aria-label="Wi-Fi"
        defaultPressed={false}
        onPressedChange={onPressedChange}
      />
    );

    const toggle = screen.getByRole("button", { name: /wi-fi/i });
    toggle.focus();

    fireEvent.keyDown(toggle, { key: "Enter" });
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(onPressedChange).toHaveBeenCalledWith(true);
  });

  it("does not toggle when disabled", () => {
    const onPressedChange = vi.fn();
    render(
      <Toggle
        aria-label="Location"
        disabled
        defaultPressed={false}
        onPressedChange={onPressedChange}
      />
    );

    const toggle = screen.getByRole("button", { name: /location/i });

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(onPressedChange).not.toHaveBeenCalled();
  });
});
