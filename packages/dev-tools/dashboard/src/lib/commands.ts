import type { ImplLibrary } from "./adapterTemplate.ts";

export interface Command { cmd: string; args: string[]; }

const STORYBOOK_FILTER: Record<ImplLibrary, string> = {
  "react-v18": "@design-system/default-react-v18",
  "svelte-v5": "@design-system/default-svelte-v5"
};

export function storybookCommand(library: ImplLibrary): Command {
  return { cmd: "pnpm", args: ["--filter", STORYBOOK_FILTER[library], "storybook"] };
}

export function taskCommand(task: string): Command {
  return { cmd: "pnpm", args: [task] };
}
