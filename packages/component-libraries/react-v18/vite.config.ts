import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "DesignSystemReact18",
      formats: ["es", "cjs"],
      fileName: (format) => (format === "es" ? "index.js" : "index.cjs")
    },
    rollupOptions: {
      external: ["react", "react-dom", "clsx"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          clsx: "clsx"
        }
      }
    }
  },
  test: {
    environment: "jsdom"
  }
});
