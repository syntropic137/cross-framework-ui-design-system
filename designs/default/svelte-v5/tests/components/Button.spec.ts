import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import Button from "../../src/lib/components/button/Button.svelte";

describe("Button", () => {
  it("renders children", () => {
    render(Button, { props: { variant: "primary", children: "Click me" } });
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("applies variant as data attribute", () => {
    render(Button, { props: { variant: "danger", children: "Delete" } });
    expect(screen.getByRole("button")).toHaveAttribute("data-variant", "danger");
  });

  it("applies size as data attribute", () => {
    render(Button, { props: { variant: "primary", size: "sm", children: "Small" } });
    expect(screen.getByRole("button")).toHaveAttribute("data-size", "sm");
  });

  it("is disabled when disabled prop is true", () => {
    render(Button, { props: { variant: "primary", disabled: true, children: "Disabled" } });
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("is disabled and aria-busy when loading prop is true", () => {
    render(Button, { props: { variant: "primary", loading: true, children: "Loading" } });
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute("aria-busy", "true");
  });

  it("renders type attribute", () => {
    render(Button, { props: { variant: "primary", type: "submit", children: "Submit" } });
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  it("fires click events", async () => {
    const user = userEvent.setup();
    let clicked = false;
    render(Button, {
      props: { variant: "primary", children: "Click", onclick: () => { clicked = true; } },
    });
    await user.click(screen.getByRole("button"));
    expect(clicked).toBe(true);
  });

  // default-react-v18's Button is `ButtonHTMLAttributes & ButtonContract` and
  // spreads `...rest`. The Svelte cell must accept the same surface, or
  // icon-only buttons cannot carry an accessible name and tab/toolbar
  // patterns (role, tabindex, aria-selected, aria-controls) are unexpressible.
  describe("attribute pass-through", () => {
    it("forwards aria-label as the accessible name", () => {
      render(Button, { props: { children: "📋", "aria-label": "Copy bead id okrs-42" } });
      expect(
        screen.getByRole("button", { name: "Copy bead id okrs-42" }),
      ).toBeInTheDocument();
    });

    it("forwards tab-pattern ARIA attributes", () => {
      render(Button, {
        props: {
          children: "Board",
          role: "tab",
          tabindex: 0,
          "aria-selected": "true",
          "aria-controls": "panel-board",
        },
      });
      const el = screen.getByRole("tab");
      expect(el).toHaveAttribute("tabindex", "0");
      expect(el).toHaveAttribute("aria-selected", "true");
      expect(el).toHaveAttribute("aria-controls", "panel-board");
    });

    it("forwards aria-pressed for legend-style toggles", () => {
      render(Button, { props: { children: "Blocks", "aria-pressed": "true" } });
      expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
    });

    it("forwards id, title and data-* attributes", () => {
      render(Button, {
        props: { children: "Go", id: "go", title: "Go now", "data-testid": "go-btn" },
      });
      const el = screen.getByRole("button");
      expect(el).toHaveAttribute("id", "go");
      expect(el).toHaveAttribute("title", "Go now");
      expect(el).toHaveAttribute("data-testid", "go-btn");
    });

    it("does not let rest props clobber data-variant or data-size", () => {
      render(Button, {
        props: {
          children: "Hi",
          variant: "danger",
          size: "lg",
          "data-variant": "bogus",
          "data-size": "bogus",
        },
      });
      const el = screen.getByRole("button");
      expect(el).toHaveAttribute("data-variant", "danger");
      expect(el).toHaveAttribute("data-size", "lg");
    });

    it("does not let a rest `disabled` re-enable a loading button", () => {
      render(Button, { props: { children: "Hi", loading: true, "aria-busy": "false" } });
      const el = screen.getByRole("button");
      expect(el).toBeDisabled();
      expect(el).toHaveAttribute("aria-busy", "true");
    });
  });
});
