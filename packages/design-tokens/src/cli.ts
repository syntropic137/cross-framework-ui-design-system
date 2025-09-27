import { writeGeneratedFiles } from "./index.js";
import { fileURLToPath } from "node:url";
import { dirname, isAbsolute, join } from "node:path";

async function run(): Promise<void> {
  const distDir = dirname(fileURLToPath(import.meta.url));
  const packageRoot = join(distDir, "..");
  const targetArgument = process.argv[2] ?? "generated";
  const outputDir = isAbsolute(targetArgument)
    ? targetArgument
    : join(packageRoot, targetArgument);

  await writeGeneratedFiles(outputDir);
}

run().catch((error) => {
  console.error("Failed to generate design token assets:", error);
  process.exitCode = 1;
});
