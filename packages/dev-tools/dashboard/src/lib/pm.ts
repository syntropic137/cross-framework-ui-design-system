import { existsSync } from "node:fs";
import { join } from "node:path";

export type PackageManager = "pnpm" | "npm" | "yarn" | "bun";

export function detectPackageManager(dir: string): PackageManager {
  if (existsSync(join(dir, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(join(dir, "yarn.lock"))) return "yarn";
  if (existsSync(join(dir, "bun.lockb"))) return "bun";
  return "npm";
}

const ADD_VERB: Record<PackageManager, string> = {
  pnpm: "add",
  yarn: "add",
  bun: "add",
  npm: "install"
};

export function installCommand(pm: PackageManager, deps: string[], dev: boolean): string {
  const devFlag = dev ? (pm === "npm" ? " --save-dev" : " -D") : "";
  return `${pm} ${ADD_VERB[pm]}${devFlag} ${deps.join(" ")}`;
}
