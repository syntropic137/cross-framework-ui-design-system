import type { RepoContext } from "./context.ts";

export interface MenuItem { label: string; value: string; }

export function buildMainMenu(ctx: RepoContext): MenuItem[] {
  if (ctx.kind === "in-repo") {
    return [
      { label: "Start a Storybook", value: "storybook" },
      { label: "Run a repo task", value: "task" },
      { label: "Install contracts into an app", value: "install-contracts" },
      { label: "Design tokens standard", value: "tokens" },
      { label: "Quit", value: "quit" }
    ];
  }
  return [
    { label: "Install contracts adapter", value: "install-contracts" },
    { label: "Set up design tokens", value: "tokens" },
    { label: "Quit", value: "quit" }
  ];
}
