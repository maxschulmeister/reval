import path from "path";
// Main exports for @reval/core package
export * from "./db";
// Core API for programmatic access (server-side only)
export * from "./api";
// Utils
export * from "./utils";
// Types
export * from "./types";
// Prisma schema path for CLI tools (keeping drizzleConfigPath for compatibility)
export * from "./db";

export * from "./constants";

const currentDir = path.dirname(new URL(import.meta.url).pathname);
export const coreRoot = path.resolve(currentDir, "../");
