import { copyFileSync } from "fs";
import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        "types/index": resolve(__dirname, "src/types/index.ts"),
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
        "@prisma/client",
        "data-forge",
        "nanoid",
        "p-queue",
        "p-retry",
        "execa",
        "jiti",
        "tsconfig-paths",
        "fs",
        "node:fs",
        "url",
        "node:path",
        "node:crypto",
        "path",
        "crypto",
      ],
    },
    target: "node18",
  },
  plugins: [
    {
      name: "copy-prisma-schema",
      writeBundle() {
        // Copy schema.prisma to dist directory
        copyFileSync(
          resolve(__dirname, "schema.prisma"),
          resolve(__dirname, "dist/schema.prisma"),
        );
      },
    },
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@types": resolve(__dirname, "src/types"),
    },
  },
});
