// Main exports for @reval/core package
export * from "./db";

// Core API for programmatic access (server-side only)
export * from "./api";

// Utils
export * from "./utils";

// Types
export * from "./types";

// Database config
export { dbOut, dbPath, prismaSchemaPath } from "../drizzle.config";

// Prisma schema path for CLI tools (keeping drizzleConfigPath for compatibility)
import path from "path";
const currentFileUrl = new URL(import.meta.url);
const currentDir = path.dirname(currentFileUrl.pathname);
export const drizzleConfigPath = path.resolve(
  currentDir,
  "../drizzle.config.ts",
);
export const prismaConfigPath = path.resolve(
  currentDir,
  "../schema.prisma",
);
