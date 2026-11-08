import { writeGeneratedFiles } from "./index.js";
import { writeDesign } from "./dtcg/design.js";
import { fileURLToPath } from "node:url";
import { dirname, isAbsolute, join } from "node:path";

/** DTCG designs built on every run: source dir under dtcg/, Rust module in the design-tokens-rs crate. */
const DTCG_DESIGNS = ["dreamship"] as const;

async function run(): Promise<void> {
  const distDir = dirname(fileURLToPath(import.meta.url));
  const packageRoot = join(distDir, "..");
  const targetArgument = process.argv[2] ?? "generated";
  const outputDir = isAbsolute(targetArgument) ? targetArgument : join(packageRoot, targetArgument);

  await writeGeneratedFiles(outputDir);

  for (const design of DTCG_DESIGNS) {
    await writeDesign(join(packageRoot, "dtcg", design), {
      cssPath: join(outputDir, design, "tokens.css"),
      jsonPath: join(outputDir, design, "tokens.resolved.json"),
      rustPath: join(packageRoot, "..", "design-tokens-rs", "src", `${design}.rs`),
    });
  }
}

run().catch((error) => {
  console.error("Failed to generate design token assets:", error);
  process.exitCode = 1;
});
