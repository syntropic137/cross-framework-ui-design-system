import { spawn } from "node:child_process";

/** Spawn a command with inherited stdio; resolve with its exit code. */
export function runCommand(cmd: string, args: string[], cwd: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: "inherit", shell: false });
    child.on("error", reject);
    child.on("close", (code) => resolve(code ?? 0));
  });
}
