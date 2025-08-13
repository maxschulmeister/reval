import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        "types/index": resolve(__dirname, "src/types/index.ts"),
        client: resolve(__dirname, "src/client.ts"),
      },
      name: "RevalCore",
      fileName: (format, entryName) => {
        const ext = format === "cjs" ? "cjs" : "js";
        return `${entryName}.${ext}`;
      },
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
        "execa",
        "fs",
        "node:fs",
        "url",
        "node:path",
        "node:crypto",
        "path",
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
