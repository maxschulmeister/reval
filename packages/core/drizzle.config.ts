// This file is kept for compatibility with existing code that imports dbPath, dbOut, etc.
import path from "path";

export const dbName = "reval.db";
export const dbOut = path.resolve(
  process.env.REVAL_PROJECT_ROOT || process.cwd(),
  ".reval",
);
export const dbPath = path.join(dbOut, dbName);

// Prisma schema path for CLI tools
const currentFileUrl = new URL(import.meta.url);
const currentDir = path.dirname(currentFileUrl.pathname);
export const prismaSchemaPath = path.join(currentDir, "schema.prisma");
