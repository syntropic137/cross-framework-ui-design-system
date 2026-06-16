import { describe, it, expect } from "vitest";
import { buildMainMenu } from "../src/menu.ts";

describe("buildMainMenu", () => {
  it("in-repo menu includes dev + integration actions", () => {
    const items = buildMainMenu({ kind: "in-repo", repoRoot: "/repo" });
    expect(items.map((i) => i.value)).toEqual([
      "storybook", "task", "install-contracts", "tokens", "quit"
    ]);
  });

  it("external menu includes only integration actions", () => {
    const items = buildMainMenu({ kind: "external", cwd: "/app" });
    expect(items.map((i) => i.value)).toEqual([
      "install-contracts", "tokens", "quit"
    ]);
  });
});
