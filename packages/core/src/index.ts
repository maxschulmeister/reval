// Main exports for @reval/core package
export * from "./db";

// Core API for programmatic access (server-side only)
export * from "./api";

// Utils (including object expansion utilities)
export * from "./utils";

// Types
export * from "./types";

// Database config
export { dbPath, dbOut } from "../drizzle.config";

// Drizzle config path for CLI tools
import path from "path";
const currentFileUrl = new URL(import.meta.url);
const currentDir = path.dirname(currentFileUrl.pathname);
export const drizzleConfigPath = path.resolve(currentDir, "../drizzle.config.ts");
