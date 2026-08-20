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

  // `tone` exists so consumers can recolour the fill (e.g. green for a
  // completed key result) through the public API instead of reaching into
  // `.meter__fill` with a :global() override that breaks on any rename.
  describe("tone", () => {
    it("defaults data-tone to accent", () => {
      render(Meter, { props: { value: 0.5 } });
      expect(screen.getByRole("meter")).toHaveAttribute("data-tone", "accent");
    });

    it.each(["neutral", "success", "warning", "danger", "accent"] as const)(
      "applies data-tone=%s from the tone prop",
      (tone) => {
        render(Meter, { props: { value: 0.5, tone } });
        expect(screen.getByRole("meter")).toHaveAttribute("data-tone", tone);
      },
    );
  });

  // Required by docs/component-standard.md "Native Attribute Pass-Through".
  // Meter renders role="meter", so it MUST be nameable by the consumer: with
  // no `label` and no way to pass aria-labelledby it ships an ARIA role with
  // no accessible name at all.
  describe("attribute pass-through", () => {
    it("forwards id and data-* attributes", () => {
      render(Meter, { props: { value: 0.5, id: "disk", "data-testid": "disk-meter" } });
      expect(screen.getByTestId("disk-meter")).toHaveAttribute("id", "disk");
    });

    it("names the meter via aria-labelledby from a visible heading", () => {
      render(Meter, { props: { value: 0.5, "aria-labelledby": "disk-heading" } });
      expect(screen.getByRole("meter")).toHaveAttribute("aria-labelledby", "disk-heading");
    });

    // `label` is the contract prop and wins, but an undefined `label` must not
    // erase a consumer-supplied aria-label — the attribute is written after
    // the spread, and in Svelte an undefined value removes an attribute.
    it("keeps a consumer aria-label when no label prop is given", () => {
      render(Meter, { props: { value: 0.5, "aria-label": "Quota used" } });
      expect(screen.getByRole("meter")).toHaveAttribute("aria-label", "Quota used");
    });

    it("prefers the label prop over a consumer aria-label", () => {
      render(Meter, { props: { value: 0.5, label: "Disk", "aria-label": "Quota used" } });
      expect(screen.getByRole("meter")).toHaveAttribute("aria-label", "Disk");
    });

    // ARIA resolves aria-labelledby ahead of aria-label, so a consumer that
    // points at a visible heading wins over the `label` string. Documented in
    // docs/component-standard.md; pinned here so the attribute survives and
    // the precedence is not "fixed" by mistake.
    it("still forwards aria-labelledby when label is also set", () => {
      render(Meter, { props: { value: 0.5, label: "Disk", "aria-labelledby": "heading" } });
      const el = screen.getByRole("meter");
      expect(el).toHaveAttribute("aria-labelledby", "heading");
      expect(el).toHaveAttribute("aria-label", "Disk");
    });

    it("merges a consumer class", () => {
      render(Meter, { props: { value: 0.5, class: "wide" } });
      expect(screen.getByRole("meter")).toHaveClass("wide");
    });

    it("supports the object form of class", () => {
      render(Meter, { props: { value: 0.5, class: { wide: true, narrow: false } } });
      const el = screen.getByRole("meter");
      expect(el).toHaveClass("wide");
      expect(el).not.toHaveClass("narrow");
    });

    it("does not let rest props clobber the component's own aria-valuenow", () => {
      render(Meter, { props: { value: 0.5, "aria-valuenow": 999 } });
      expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "0.5");
    });

    it("does not let rest props clobber data-tone", () => {
      render(Meter, { props: { value: 0.5, tone: "accent", "data-tone": "bogus" } });
      expect(screen.getByRole("meter")).toHaveAttribute("data-tone", "accent");
    });
  });
});
