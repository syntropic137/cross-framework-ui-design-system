import { select } from "@neuralempowerment/tui";
import type { RepoContext } from "../context.ts";
import { storybookCommand } from "../lib/commands.ts";
import { runCommand } from "../lib/run.ts";
import type { ImplLibrary } from "../lib/adapterTemplate.ts";

export async function startStorybook(ctx: Extract<RepoContext, { kind: "in-repo" }>): Promise<void> {
  const library = await select<ImplLibrary>(
    [
      { label: "React 18", value: "react-v18" },
      { label: "Svelte 5", value: "svelte-v5" }
    ],
    { title: "Which Storybook?" }
  );
  const { cmd, args } = storybookCommand(library);
  await runCommand(cmd, args, ctx.repoRoot);
}
