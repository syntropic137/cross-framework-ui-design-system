import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  // Resolve Svelte to its browser build. Without this, the app bundles Svelte in
  // SSR/server mode and `mount()` throws "not available on the server" → blank page.
  resolve: {
    conditions: ["browser"],
  },
  clearScreen: false,
  server: {
    port: 1421,
    strictPort: true,
  },
  build: {
    outDir: "dist",
  },
});
