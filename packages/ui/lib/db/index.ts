import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "path";
import { runs, executions } from "@reval/core/src/db/schema";

// Database path relative to the UI package
const dbPath = path.join(process.cwd(), "../../.reval/reval.db");

// Create database connection using better-sqlite3 (compatible with Node.js)
// while importing schema from core to maintain consistency
const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema: { runs, executions } });

// Re-export schema and types from core
export { runs, executions };
export type { Run, Execution } from "@reval/core/src/types/db";