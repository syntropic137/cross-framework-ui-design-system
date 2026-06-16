import { select } from "@neuralempowerment/tui";
import type { RepoContext } from "../context.ts";
import { taskCommand } from "../lib/commands.ts";
import { runCommand } from "../lib/run.ts";

export async function runRepoTask(ctx: Extract<RepoContext, { kind: "in-repo" }>): Promise<void> {
  const task = await select<string>(
    [
      { label: "qa (full gate)", value: "qa" },
      { label: "build", value: "build" },
      { label: "test", value: "test" },
      { label: "lint", value: "lint" },
      { label: "typecheck", value: "typecheck" }
    ],
    { title: "Which task?" }
  );
  const { cmd, args } = taskCommand(task);
  await runCommand(cmd, args, ctx.repoRoot);
}
