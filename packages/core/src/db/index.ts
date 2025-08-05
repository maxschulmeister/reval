import config from "@/../drizzle.config";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import fs from "fs";
import path from "path";

const out = config.out ?? "";
// Create database directory if it doesn't exist
fs.mkdirSync(path.join(out), { recursive: true });

const sqlite = new Database(path.join(out, "reval.db"));
export const db = drizzle(sqlite);
