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
          environmentOptions: {
            jsdom: {
              url: "http://localhost"
            }
          },
          globals: true,
          setupFiles: [resolve(dir, "tests/setup.ts")],
          include: ["tests/**/*.spec.tsx"]
        }
      },
      {
        extends: true,
        plugins: [storybookTest({ configDir: resolve(dir, ".storybook") })],
        // Pre-bundle every story's deps at startup so Vite's optimizer never
        // discovers a new dep mid-run. On a cold cache (fresh CI) a mid-run
        // re-optimize logs "optimized dependencies changed. reloading" and the
        // reload drops the suite context ("failed to find the current suite"),
        // failing story files nondeterministically. Scanning the stories/preview
        // up front (entries) plus force-including the React/clsx runtime makes the
        // optimize happen once, before any test runs.
        optimizeDeps: {
          entries: ["src/**/*.stories.@(ts|tsx)", ".storybook/preview.tsx"],
          include: [
            "react",
            "react-dom",
            "react-dom/client",
            "react/jsx-runtime",
            "react/jsx-dev-runtime",
            "clsx"
          ]
        },
        test: {
          name: "storybook",
          // Belt-and-suspenders against any residual cold-cache reload flake.
          fileParallelism: false,
          retry: 2,
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: "chromium" }]
          }
        }
      }
    ]
  }
});
