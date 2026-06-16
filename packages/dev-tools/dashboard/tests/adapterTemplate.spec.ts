import { describe, it, expect } from "vitest";
import { renderAdapterModule } from "../src/lib/adapterTemplate.ts";

describe("renderAdapterModule", () => {
  const out = renderAdapterModule({
    library: "react-v18",
    requiredNames: ["badge", "button", "toggle"],
    plannedNames: ["select", "checkbox"]
  });

  it("imports the chosen library's adapter and the contract manifest", () => {
    expect(out).toContain('import { reactV18ContractAdapter } from "@design-system/react-v18";');
    expect(out).toContain('import type { RequiredComponentContracts } from "@design-system/contracts";');
  });

  it("exports a `ui` const constrained by the contract surface", () => {
    expect(out).toContain(
      "export const ui = reactV18ContractAdapter satisfies Record<"
    );
    expect(out).toContain("keyof RequiredComponentContracts");
  });

  it("includes the one-line swap hint for the other library", () => {
    expect(out).toContain('// import { svelteV5ContractAdapter } from "@design-system/svelte-v5";');
  });

  it("lists planned components as TODO binding points", () => {
    expect(out).toContain("TODO (planned, not yet required): select, checkbox");
  });

  it("omits the planned-components TODO when there are none", () => {
    const out = renderAdapterModule({ library: "react-v18", requiredNames: ["badge"], plannedNames: [] });
    expect(out).not.toContain("TODO (planned");
  });
});
