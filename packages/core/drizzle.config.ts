import { defineConfig } from "drizzle-kit";
import path from "path";

export const dbName = "reval.db";
export const dbOut = path.resolve(
  process.env.REVAL_PROJECT_ROOT || process.cwd(),
  ".reval",
);
export const dbPath = path.join(dbOut, dbName);

const currentFileUrl = new URL(import.meta.url);
const currentDir = path.dirname(currentFileUrl.pathname);
const schemaPath = path.join(currentDir, "src/db/schema.ts");

export default defineConfig({
  schema: schemaPath,
  out: dbOut,
  dialect: "sqlite",
  dbCredentials: {
    url: dbPath,
  },
});
