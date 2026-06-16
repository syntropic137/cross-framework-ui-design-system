import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [react()],
        test: {
          name: "unit",
          environment: "jsdom",
          environmentOptions: {
            jsdom: {
              url: "http://localhost"
            }
          },
          globals: true,
          setupFiles: [resolve(dir, "tests/setup.ts")],
          include: ["tests/**/*.spec.tsx", "tests/**/*.spec.ts"]
        }
      }
    ]
  }
});
