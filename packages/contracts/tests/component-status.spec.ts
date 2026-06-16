import { describe, expect, it } from "vitest";
import { componentContractStatus, requiredContractNames } from "../src/component-status.js";

describe("component contract status", () => {
  it("marks required names as required in the status manifest", () => {
    expect(requiredContractNames).toEqual(["badge", "button", "toggle"]);

    for (const name of requiredContractNames) {
      expect(componentContractStatus[name]).toBe("required");
    }
  });

  it("does not omit required components from the required-name list", () => {
    const requiredFromManifest = Object.entries(componentContractStatus)
      .filter(([, status]) => status === "required")
      .map(([name]) => name);

    expect(requiredFromManifest).toEqual([...requiredContractNames]);
  });
});
