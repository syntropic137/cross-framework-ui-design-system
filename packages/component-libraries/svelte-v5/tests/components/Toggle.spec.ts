import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import Toggle from "../../src/lib/components/toggle/Toggle.svelte";

describe("Toggle", () => {
  describe("rendering", () => {
    it("renders a button element", () => {
      render(Toggle, { props: { children: "Toggle me" } });
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("renders children", () => {
      render(Toggle, { props: { children: "Toggle me" } });
      expect(screen.getByText("Toggle me")).toBeInTheDocument();
    });

    it("has aria-pressed false by default", () => {
      render(Toggle, { props: {} });
      expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
    });
  });

  describe("uncontrolled mode", () => {
    it("starts unpressed by default", () => {
      render(Toggle, { props: { children: "Toggle" } });
      expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
    });

    it("starts pressed when defaultPressed is true", () => {
      render(Toggle, { props: { defaultPressed: true, children: "Toggle" } });
      expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
    });

    it("toggles on click", async () => {
      const user = userEvent.setup();
      render(Toggle, { props: { children: "Toggle" } });
      const btn = screen.getByRole("button");
      expect(btn).toHaveAttribute("aria-pressed", "false");
      await user.click(btn);
      expect(btn).toHaveAttribute("aria-pressed", "true");
      await user.click(btn);
      expect(btn).toHaveAttribute("aria-pressed", "false");
    });
  });

  describe("controlled mode", () => {
    it("reflects pressed prop", () => {
      render(Toggle, { props: { pressed: true, children: "Toggle" } });
      expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
    });

    it("reflects pressed=false", () => {
      render(Toggle, { props: { pressed: false, children: "Toggle" } });
      expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
    });
  });

  describe("onPressedChange callback", () => {
    it("fires onPressedChange with new value on click", async () => {
      const user = userEvent.setup();
      const onPressedChange = vi.fn();
      render(Toggle, { props: { onPressedChange, children: "Toggle" } });
      await user.click(screen.getByRole("button"));
      expect(onPressedChange).toHaveBeenCalledOnce();
      expect(onPressedChange).toHaveBeenCalledWith(true);
    });

    it("fires onPressedChange with false when toggling off", async () => {
      const user = userEvent.setup();
      const onPressedChange = vi.fn();
      render(Toggle, { props: { defaultPressed: true, onPressedChange, children: "Toggle" } });
      await user.click(screen.getByRole("button"));
      expect(onPressedChange).toHaveBeenCalledWith(false);
    });
  });

  describe("disabled state", () => {
    it("is disabled when disabled prop is true", () => {
      render(Toggle, { props: { disabled: true, children: "Toggle" } });
      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("does not toggle when disabled", async () => {
      const user = userEvent.setup();
      const onPressedChange = vi.fn();
      render(Toggle, { props: { disabled: true, onPressedChange, children: "Toggle" } });
      await user.click(screen.getByRole("button"));
      expect(onPressedChange).not.toHaveBeenCalled();
    });

    it("aria-pressed remains false when disabled and clicked", async () => {
      const user = userEvent.setup();
      render(Toggle, { props: { disabled: true, children: "Toggle" } });
      const btn = screen.getByRole("button");
      await user.click(btn);
      expect(btn).toHaveAttribute("aria-pressed", "false");
    });
  });
});
