import { describe, expect, it } from "vitest";
import { requiredContractNames } from "@syntropic137/contracts";
import { reactV18ContractAdapter } from "../src/contract-adapter.js";

describe("reactV18ContractAdapter", () => {
  it("exports every currently required contract implementation", () => {
    expect(Object.keys(reactV18ContractAdapter).sort()).toEqual([
      ...requiredContractNames,
    ].sort());
  });
});
