import { describe, expect, it } from "vitest";
import { requiredContractNames } from "@syntropic137/contracts";
import { svelteV5ContractAdapter } from "../src/lib/contract-adapter.js";

describe("svelteV5ContractAdapter", () => {
  it("exports every currently required contract implementation", () => {
    expect(Object.keys(svelteV5ContractAdapter).sort()).toEqual([
      ...requiredContractNames,
    ].sort());
  });
});
