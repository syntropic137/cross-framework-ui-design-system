import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export interface FilePlan { path: string; contents: string; }
export interface WriteResult { written: string[]; skipped: string[]; }

export function writeFiles(plans: FilePlan[], opts: { overwrite: boolean }): WriteResult {
  const written: string[] = [];
  const skipped: string[] = [];
  for (const plan of plans) {
    if (existsSync(plan.path) && !opts.overwrite) {
      skipped.push(plan.path);
      continue;
    }
    mkdirSync(dirname(plan.path), { recursive: true });
    writeFileSync(plan.path, plan.contents);
    written.push(plan.path);
  }
  return { written, skipped };
}
