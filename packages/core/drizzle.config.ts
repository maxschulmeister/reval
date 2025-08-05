import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./.reval",
  dialect: "sqlite",
  dbCredentials: {
    url: ".reval/reval.db",
  },
});
