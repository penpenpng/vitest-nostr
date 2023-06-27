import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  define: {
    "import.meta.vitest": "undefined",
  },
  build: {
    lib: {
      name: "vitest-nostr",
      fileName: (format) => `index.${format}.js`,
      entry: path.resolve(__dirname, "src/index.ts"),
      formats: ["es", "cjs", "umd"],
    },
    sourcemap: true,
  },
});
