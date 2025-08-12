import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "fs";
import path from "path";
import config from "../../drizzle.config";

export * from "./save-run";
export * from "./schema";

let _db: ReturnType<typeof drizzle> | null = null;
let _customPath: string | null = null;

export const setDatabasePath = (customPath?: string) => {
  _customPath = customPath || null;
  _db = null; // Reset connection to use new path
};

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    if (!_db) {
      const out = _customPath 
        ? path.resolve(_customPath, ".reval")
        : (config.out ?? "");
      // Create database directory if it doesn't exist
      fs.mkdirSync(path.join(out), { recursive: true });
      const sqlite = new Database(path.join(out, "reval.db"));
      _db = drizzle(sqlite);
    }
    return (_db as any)[prop];
  },
});
