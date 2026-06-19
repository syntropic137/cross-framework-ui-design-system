import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { select, prompt, confirm, success, fail, bold } from "@neuralempowerment/tui";
import type { RepoContext } from "../context.ts";
import type { ImplLibrary } from "../lib/adapterTemplate.ts";
import { renderAdapterModule } from "../lib/adapterTemplate.ts";
import { writeFiles } from "../lib/scaffold.ts";
import { detectPackageManager, installCommand } from "../lib/pm.ts";

const FALLBACK_REQUIRED = ["badge", "button", "toggle"];

/** Required + planned contract names, read from the target app's contracts package if installed. */
function readContractNames(targetDir: string): { required: string[]; planned: string[] } {
  try {
    const require = createRequire(join(targetDir, "noop.js"));
    const mod = require("@syntropic137/contracts") as {
      requiredContractNames?: readonly string[];
      componentContractStatus?: Record<string, string>;
    };
    const required = [...(mod.requiredContractNames ?? FALLBACK_REQUIRED)];
    const planned = Object.entries(mod.componentContractStatus ?? {})
      .filter(([, status]) => status === "planned")
      .map(([name]) => name);
    return { required, planned };
  } catch {
    console.warn(
      "Note: could not read @syntropic137/contracts from the target; using the default required set (badge, button, toggle)."
    );
    return { required: [...FALLBACK_REQUIRED], planned: [] };
  }
}

export async function installContracts(ctx: RepoContext): Promise<void> {
  const defaultDir = ctx.kind === "external" ? ctx.cwd : process.cwd();
  const targetDir = resolve(await prompt(`Target app directory [${defaultDir}]: `) || defaultDir);

  const library = await select<ImplLibrary>(
    [{ label: "React 18 (reactV18ContractAdapter)", value: "react-v18" }],
    { title: "Implementation library" }
  );

  const adapterRel = (await prompt("Adapter module path [src/ui/adapter.ts]: ")) || "src/ui/adapter.ts";
  const adapterPath = join(targetDir, adapterRel);

  const { required, planned } = readContractNames(targetDir);
  const contents = renderAdapterModule({ library, requiredNames: required, plannedNames: planned });

  // Show the install command (do not auto-run unless confirmed).
  const pm = detectPackageManager(targetDir);
  const deps = ["@syntropic137/contracts", `@syntropic137/${library}`, "@syntropic137/design-tokens"];
  console.log(bold("\nAdd these dependencies to your app:"));
  console.log("  " + installCommand(pm, deps, false) + "\n");

  console.log(bold("Import the design tokens once in your app entry (e.g. main.tsx):"));
  console.log('  import "@syntropic137/design-tokens/generated/design-tokens.css";\n');

  console.log(bold("Will write:"));
  console.log("  " + adapterPath + "\n");

  if (!(await confirm("Write the adapter module now?"))) {
    fail("Aborted; nothing written.");
    return;
  }

  const result = writeFiles([{ path: adapterPath, contents }], { overwrite: false });
  if (result.skipped.length) {
    if (await confirm(`${adapterRel} exists. Overwrite?`)) {
      writeFiles([{ path: adapterPath, contents }], { overwrite: true });
      success(`Updated ${adapterRel}`);
    } else {
      fail(`Kept existing ${adapterRel}`);
    }
  } else {
    success(`Created ${adapterRel}`);
  }
}
