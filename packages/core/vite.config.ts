import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "RevalCore",
      fileName: "index",
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: [
        "better-sqlite3",
        "drizzle-orm",
        "data-forge",
        "nanoid",
        "p-queue",
        "p-retry",
      ],
    },
    target: "node18",
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@types": resolve(__dirname, "src/types"),
    },
  },
});
