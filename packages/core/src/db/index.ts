import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "fs";
import path from "path";
import config from "../../drizzle.config";

let _db: ReturnType<typeof drizzle> | null = null;

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    if (!_db) {
      const out = config.out ?? "";
      // Create database directory if it doesn't exist
      fs.mkdirSync(path.join(out), { recursive: true });
      const sqlite = new Database(path.join(out, "reval.db"));
      _db = drizzle(sqlite);
    }
    return (_db as any)[prop];
  }
});
