import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "fs";
import path from "path";
import config from "../../drizzle.config";

const out = config.out ?? "";
// Create database directory if it doesn't exist
fs.mkdirSync(path.join(out), { recursive: true });

const sqlite = new Database(path.join(out, "reval.db"));
export const db = drizzle(sqlite);
