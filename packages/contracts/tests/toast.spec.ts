import { describe, expect, expectTypeOf, it } from "vitest";
import { componentContractStatus, requiredContractNames } from "../src/component-status.js";
import type { ToastAction, ToastContract, ToastKind } from "../src/index.js";

describe("toast contract (0.3.0, dreamship-v0-xvzo6.3)", () => {
  it("is planned, not yet required of every design", () => {
    expect(componentContractStatus.toast).toBe("planned");
    expect(requiredContractNames).not.toContain("toast");
  });

  it("has exactly two kinds", () => {
    expectTypeOf<ToastKind>().toEqualTypeOf<"info" | "failed">();
    // @ts-expect-error a third kind is not part of the contract
    const bad: ToastKind = "success";
    void bad;
  });

  it("requires kind and message; action, duration and onDismiss are optional", () => {
    const minimal: ToastContract = { kind: "info", message: "Saved on this ship. Not sent." };
    const full: ToastContract = {
      kind: "failed",
      message: "Not saved. Your note is kept.",
      action: { label: "Try again", onAction: () => {} },
      duration: 6000,
      onDismiss: () => {},
    };
    expect(minimal.kind).toBe("info");
    expect(full.action?.label).toBe("Try again");
    // @ts-expect-error message is required
    const noMessage: ToastContract = { kind: "info" };
    void noMessage;
    expectTypeOf<ToastContract["action"]>().toEqualTypeOf<ToastAction | undefined>();
  });
});
