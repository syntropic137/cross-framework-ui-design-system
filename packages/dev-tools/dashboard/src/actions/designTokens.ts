import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { bold, dim } from "@neuralempowerment/tui";
import type { RepoContext } from "../context.ts";

function readTokenNames(repoRoot: string): string[] {
  const css = join(repoRoot, "packages/design-tokens/generated/design-tokens.css");
  if (!existsSync(css)) return [];
  const text = readFileSync(css, "utf8");
  const names = new Set<string>();
  for (const m of text.matchAll(/--ds-[a-z0-9-]+/g)) names.add(m[0]);
  return [...names].sort();
}

export function showDesignTokens(ctx: RepoContext): void {
  console.log(bold("\nDesign tokens — the cross-UI standard\n"));
  console.log("Tokens are the visual source of truth. Components consume semantic");
  console.log("`--ds-*` custom properties; never hardcode colors or px. Size in rem.\n");
  console.log(bold("Consume the layered CSS:"));
  console.log('  import "@syntropic137/design-tokens/generated/design-tokens.css";\n');
  console.log(bold("Theme swapping:"));
  console.log("  Set data-theme on a root element; tokens re-resolve. Light/dark and beyond.\n");

  if (ctx.kind === "in-repo") {
    const names = readTokenNames(ctx.repoRoot);
    if (names.length) {
      const shown = names.slice(0, 12);
      const more = names.length - shown.length;
      console.log(bold("Sample tokens:"));
      const suffix = more > 0 ? dim(`  …and ${more} more (${names.length} total)`) : "";
      console.log(dim("  " + shown.join("  ")) + suffix + "\n");
    }
  }
  console.log(dim("See docs/component-standard.md for the full token-to-component map.\n"));
}
