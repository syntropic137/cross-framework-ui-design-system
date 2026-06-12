import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import Button from "../../src/lib/components/button/Button.svelte";

describe("Button", () => {
  it("renders children", () => {
    render(Button, { props: { variant: "primary" }, slots: { default: "Click me" } });
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("applies variant as data attribute", () => {
    render(Button, { props: { variant: "danger" }, slots: { default: "Delete" } });
    expect(screen.getByRole("button")).toHaveAttribute("data-variant", "danger");
  });

  it("applies size as data attribute", () => {
    render(Button, { props: { variant: "primary", size: "sm" }, slots: { default: "Small" } });
    expect(screen.getByRole("button")).toHaveAttribute("data-size", "sm");
  });

  it("is disabled when disabled prop is true", () => {
    render(Button, { props: { variant: "primary", disabled: true }, slots: { default: "Disabled" } });
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("is disabled and aria-busy when loading prop is true", () => {
    render(Button, { props: { variant: "primary", loading: true }, slots: { default: "Loading" } });
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute("aria-busy", "true");
  });

  it("renders type attribute", () => {
    render(Button, { props: { variant: "primary", type: "submit" }, slots: { default: "Submit" } });
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  it("fires click events", async () => {
    const user = userEvent.setup();
    let clicked = false;
    const { getByRole } = render(Button, {
      props:  { variant: "primary" },
      slots:  { default: "Click" },
      events: { click: () => { clicked = true; } },
    });
    await user.click(getByRole("button"));
    expect(clicked).toBe(true);
  });
});
