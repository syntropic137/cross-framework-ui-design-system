import { select, bold } from "@neuralempowerment/tui";
import { detectContext } from "./context.ts";
import { buildMainMenu } from "./menu.ts";
import { startStorybook } from "./actions/storybook.ts";
import { runRepoTask } from "./actions/runTask.ts";
import { installContracts } from "./actions/installContracts.ts";
import { showDesignTokens } from "./actions/designTokens.ts";

async function main(): Promise<void> {
  const ctx = detectContext(process.cwd());
  console.log(bold(`\nDesign System Dashboard — ${ctx.kind}\n`));

  while (true) {
    const choice = await select(buildMainMenu(ctx).map((i) => ({ label: i.label, value: i.value })), {
      title: "What would you like to do?"
    });

    try {
      if (choice === "quit") break;
      if (choice === "storybook" && ctx.kind === "in-repo") await startStorybook(ctx);
      else if (choice === "task" && ctx.kind === "in-repo") await runRepoTask(ctx);
      else if (choice === "install-contracts") await installContracts(ctx);
      else if (choice === "tokens") showDesignTokens(ctx);
    } catch (err) {
      console.error(`\nAction failed: ${(err as Error).message}\n`);
    }
  }
}

await main();
