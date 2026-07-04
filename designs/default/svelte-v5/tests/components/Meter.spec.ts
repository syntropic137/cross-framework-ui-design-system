import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/svelte";
import Meter from "../../src/lib/components/meter/Meter.svelte";

describe("Meter", () => {
  it("renders with role meter", () => {
    render(Meter, { props: { value: 0.5 } });
    expect(screen.getByRole("meter")).toBeInTheDocument();
  });

  it("exposes value via aria-valuenow", () => {
    render(Meter, { props: { value: 0.78 } });
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "0.78");
  });

  it("exposes default min/max as aria-valuemin/aria-valuemax", () => {
    render(Meter, { props: { value: 0.4 } });
    const el = screen.getByRole("meter");
    expect(el).toHaveAttribute("aria-valuemin", "0");
    expect(el).toHaveAttribute("aria-valuemax", "1");
  });

  it("respects a custom max from the contract", () => {
    render(Meter, { props: { value: 40, max: 100 } });
    const el = screen.getByRole("meter");
    expect(el).toHaveAttribute("aria-valuemax", "100");
    expect(el).toHaveAttribute("aria-valuenow", "40");
  });

  it("clamps aria-valuenow to the [min, max] range", () => {
    render(Meter, { props: { value: 1.5 } });
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "1");
  });

  it("clamps below min too", () => {
    render(Meter, { props: { value: -0.5 } });
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "0");
  });

  it("applies aria-label from the label prop", () => {
    render(Meter, { props: { value: 0.5, label: "Disk usage" } });
    expect(screen.getByRole("meter")).toHaveAttribute("aria-label", "Disk usage");
  });
});
