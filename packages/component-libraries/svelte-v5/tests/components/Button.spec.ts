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
});
