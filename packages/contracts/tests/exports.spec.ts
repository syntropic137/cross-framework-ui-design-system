import { describe, it, expect } from "vitest";
import * as contracts from "../src/index.js";

describe("@syntropic137/contracts barrel exports", () => {
  it("exports are a defined module object", () => {
    expect(typeof contracts).toBe("object");
  });

  it("module loads without error", () => {
    expect(contracts).toBeDefined();
  });
});
