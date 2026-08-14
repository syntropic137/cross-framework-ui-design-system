import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import Toggle from "../src/lib/components/toggle/Toggle.svelte";

describe("Toggle (brutalist)", () => {
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

    it("applies brutalist CSS class", () => {
      render(Toggle, { props: { children: "Brute" } });
      expect(screen.getByRole("button").classList.contains("brutal-toggle")).toBe(true);
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

  // `onclick` is NOT a component invariant — the invariants are the data-*
  // attributes, aria-pressed and disabled. Kept in parity with the default
  // cell and default-react-v18, both of which invoke the consumer handler.
  describe("attribute pass-through", () => {
    it("invokes a consumer onclick handler in addition to onPressedChange", async () => {
      const user = userEvent.setup();
      const onclick = vi.fn();
      const onPressedChange = vi.fn();
      render(Toggle, { props: { onclick, onPressedChange, children: "Toggle" } });
      await user.click(screen.getByRole("button"));
      expect(onPressedChange).toHaveBeenCalledWith(true);
      expect(onclick).toHaveBeenCalledOnce();
    });

    it("does not invoke consumer onclick when disabled", async () => {
      const user = userEvent.setup();
      const onclick = vi.fn();
      render(Toggle, { props: { disabled: true, onclick, children: "Toggle" } });
      await user.click(screen.getByRole("button"));
      expect(onclick).not.toHaveBeenCalled();
    });

    it("does not let rest props clobber aria-pressed", () => {
      render(Toggle, { props: { pressed: true, "aria-pressed": "false" } });
      expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
    });

    // `class` is typed ClassValue (string | ClassArray | ClassDictionary), so
    // the object and array forms are valid Svelte and must not be coerced to
    // "[object Object]" by string interpolation.
    it("supports the object form of class", () => {
      render(Toggle, { props: { class: { featured: true, muted: false }, children: "T" } });
      const btn = screen.getByRole("button");
      expect(btn).toHaveClass("brutal-toggle");
      expect(btn).toHaveClass("featured");
      expect(btn).not.toHaveClass("muted");
    });
  });

  // Svelte relies on the <button>'s native keyboard-generated click, so Enter
  // and Space run the full handleClick path. default-react-v18's Toggle
  // instead calls preventDefault() in its own onKeyDown and emits the change
  // directly, so its consumer onClick does NOT fire for keyboard activation.
  // That divergence is documented in docs/component-standard.md; these tests
  // pin the Svelte side so it cannot drift silently.
  describe("keyboard activation", () => {
    it("toggles on Enter", async () => {
      const user = userEvent.setup();
      const onPressedChange = vi.fn();
      render(Toggle, { props: { onPressedChange, children: "Toggle" } });
      screen.getByRole("button").focus();
      await user.keyboard("{Enter}");
      expect(onPressedChange).toHaveBeenCalledWith(true);
    });

    it("invokes consumer onclick on keyboard activation (diverges from React)", async () => {
      const user = userEvent.setup();
      const onclick = vi.fn();
      render(Toggle, { props: { onclick, children: "Toggle" } });
      screen.getByRole("button").focus();
      await user.keyboard("{Enter}");
      expect(onclick).toHaveBeenCalledOnce();
    });
  });
});
