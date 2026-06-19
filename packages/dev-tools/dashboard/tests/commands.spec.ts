import { describe, it, expect } from "vitest";
import { storybookCommand, taskCommand } from "../src/lib/commands.ts";

describe("command builders", () => {
  it("builds the react storybook command", () => {
    expect(storybookCommand("react-v18")).toEqual({
      cmd: "pnpm",
      args: ["--filter", "@syntropic137/default-react-v18", "storybook"]
    });
  });

  it("builds the svelte storybook command", () => {
    expect(storybookCommand("svelte-v5")).toEqual({
      cmd: "pnpm",
      args: ["--filter", "@syntropic137/default-svelte-v5", "storybook"]
    });
  });

  it("builds a repo task command", () => {
    expect(taskCommand("qa")).toEqual({ cmd: "pnpm", args: ["qa"] });
  });
});
