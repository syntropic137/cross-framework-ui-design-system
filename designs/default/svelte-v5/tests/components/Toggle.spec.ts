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

  // Matches default-react-v18's Toggle, which spreads `...rest` onto the
  // <button>. Without this, an icon-only toggle cannot be given an
  // accessible name and consumers hand-roll a <button> instead.
  describe("attribute pass-through", () => {
    it("forwards aria-label", () => {
      render(Toggle, { props: { "aria-label": "Mute audio" } });
      expect(screen.getByRole("button", { name: "Mute audio" })).toBeInTheDocument();
    });

    it("forwards id and data-* attributes", () => {
      render(Toggle, { props: { id: "mute", "data-testid": "mute-toggle" } });
      const btn = screen.getByRole("button");
      expect(btn).toHaveAttribute("id", "mute");
      expect(btn).toHaveAttribute("data-testid", "mute-toggle");
    });

    it("does not let rest props clobber the component's own aria-pressed", () => {
      render(Toggle, { props: { pressed: true, "aria-pressed": "false" } });
      expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
    });

    it("does not let rest props clobber data-state", () => {
      render(Toggle, { props: { pressed: true, "data-state": "bogus" } });
      expect(screen.getByRole("button")).toHaveAttribute("data-state", "pressed");
    });

    // `onclick` is NOT a component invariant — the invariants are the data-*
    // attributes, aria-pressed and disabled. default-react-v18's Toggle
    // destructures onClick and calls it from handleToggle; the Svelte cell
    // must do the same or the handler is silently swallowed by the spread.
    it("invokes a consumer onclick handler in addition to onPressedChange", async () => {
      const user = userEvent.setup();
      const onclick = vi.fn();
      const onPressedChange = vi.fn();
      render(Toggle, { props: { onclick, onPressedChange, children: "Toggle" } });
      await user.click(screen.getByRole("button"));
      expect(onPressedChange).toHaveBeenCalledWith(true);
      expect(onclick).toHaveBeenCalledOnce();
    });

    it("passes the click event to the consumer onclick handler", async () => {
      const user = userEvent.setup();
      const onclick = vi.fn();
      render(Toggle, { props: { onclick, children: "Toggle" } });
      await user.click(screen.getByRole("button"));
      expect(onclick.mock.calls[0]?.[0]).toBeInstanceOf(MouseEvent);
    });

    // Mirrors React, which returns before calling onClick when disabled.
    it("does not invoke consumer onclick when disabled", async () => {
      const user = userEvent.setup();
      const onclick = vi.fn();
      render(Toggle, { props: { disabled: true, onclick, children: "Toggle" } });
      await user.click(screen.getByRole("button"));
      expect(onclick).not.toHaveBeenCalled();
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

    it("toggles on Space", async () => {
      const user = userEvent.setup();
      const onPressedChange = vi.fn();
      render(Toggle, { props: { onPressedChange, children: "Toggle" } });
      screen.getByRole("button").focus();
      await user.keyboard(" ");
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

    it("does not toggle on Enter when disabled", async () => {
      const user = userEvent.setup();
      const onPressedChange = vi.fn();
      render(Toggle, { props: { disabled: true, onPressedChange, children: "Toggle" } });
      screen.getByRole("button").focus();
      await user.keyboard("{Enter}");
      expect(onPressedChange).not.toHaveBeenCalled();
    });
  });
});
