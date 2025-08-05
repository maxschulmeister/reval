import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import fs from "fs";

// Create database directory if it doesn't exist
fs.mkdirSync(".reval", { recursive: true });

const sqlite = new Database(".reval/reval.db");
export const db = drizzle(sqlite);
