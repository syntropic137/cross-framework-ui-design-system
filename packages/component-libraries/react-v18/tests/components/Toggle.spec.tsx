import { render, screen, fireEvent } from "@testing-library/react";
import { Toggle } from "../../src/components/Toggle.js";

describe("Toggle", () => {
  it("renders with switch role and default unchecked state", () => {
    render(<Toggle aria-label="Airplane mode" />);

    const toggle = screen.getByRole("switch", { name: /airplane mode/i });
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });

  it("toggles value in uncontrolled mode when clicked", () => {
    const onCheckedChange = vi.fn();
    render(
      <Toggle
        aria-label="Notifications"
        defaultChecked={false}
        onCheckedChange={onCheckedChange}
      />
    );

    const toggle = screen.getByRole("switch", { name: /notifications/i });

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(onCheckedChange).toHaveBeenCalledWith(true);

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(onCheckedChange).toHaveBeenLastCalledWith(false);
  });

  it("supports controlled usage", () => {
    const onCheckedChange = vi.fn();
    const { rerender } = render(
      <Toggle
        aria-label="Dark mode"
        checked={false}
        onCheckedChange={onCheckedChange}
      />
    );

    const toggle = screen.getByRole("switch", { name: /dark mode/i });

    fireEvent.click(toggle);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(toggle).toHaveAttribute("aria-checked", "false");

    rerender(
      <Toggle
        aria-label="Dark mode"
        checked={true}
        onCheckedChange={onCheckedChange}
      />
    );

    expect(screen.getByRole("switch", { name: /dark mode/i })).toHaveAttribute(
      "aria-checked",
      "true"
    );
  });

  it("responds to keyboard interaction", () => {
    const onCheckedChange = vi.fn();
    render(
      <Toggle
        aria-label="Wi-Fi"
        defaultChecked={false}
        onCheckedChange={onCheckedChange}
      />
    );

    const toggle = screen.getByRole("switch", { name: /wi-fi/i });
    toggle.focus();

    fireEvent.keyDown(toggle, { key: "Enter" });
    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("does not toggle when disabled", () => {
    const onCheckedChange = vi.fn();
    render(
      <Toggle
        aria-label="Location"
        disabled
        defaultChecked={false}
        onCheckedChange={onCheckedChange}
      />
    );

    const toggle = screen.getByRole("switch", { name: /location/i });

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
