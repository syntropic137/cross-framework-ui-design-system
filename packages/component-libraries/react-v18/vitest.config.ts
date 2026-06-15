import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));

// Two projects:
//  - "unit": fast jsdom unit/contract tests (run via `pnpm test` -> --project=unit)
//  - "storybook": every story run as a Playwright browser test via
//    @storybook/addon-vitest (run via `pnpm storybook:test` -> --project=storybook).
//    Replaces @storybook/test-runner, which pulled wait-on -> axios.
export default defineConfig({
  test: {
    projects: [
      {
        plugins: [react()],
        test: {
          name: "unit",
          environment: "jsdom",
          globals: true,
          setupFiles: [resolve(dir, "tests/setup.ts")],
          include: ["tests/**/*.spec.tsx"]
        }
      },
      {
        extends: true,
        plugins: [storybookTest({ configDir: resolve(dir, ".storybook") })],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: "chromium" }]
          },
          setupFiles: [resolve(dir, ".storybook/vitest.setup.ts")]
        }
      }
    ]
  }
});
