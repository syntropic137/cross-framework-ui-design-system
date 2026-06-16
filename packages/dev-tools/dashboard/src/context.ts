import { existsSync } from "node:fs";
import { dirname, join, parse } from "node:path";

export type RepoContext =
  | { kind: "in-repo"; repoRoot: string }
  | { kind: "external"; cwd: string };

function isRepoRoot(dir: string): boolean {
  return (
    existsSync(join(dir, "pnpm-workspace.yaml")) &&
    existsSync(join(dir, "packages", "contracts", "package.json"))
  );
}

export function detectContext(startDir: string): RepoContext {
  let dir = startDir;
  const rootOf = parse(dir).root;
  while (true) {
    if (isRepoRoot(dir)) return { kind: "in-repo", repoRoot: dir };
    if (dir === rootOf) break;
    dir = dirname(dir);
  }
  return { kind: "external", cwd: startDir };
}
