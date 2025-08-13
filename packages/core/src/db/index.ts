import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { dbPath } from "../../drizzle.config";

export * from "./save-run";
export * from "./schema";

export const getDb = () => {
  const sqlite = new Database(dbPath);
  const db = drizzle(sqlite);
  return db;
};
