import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { execa } from "execa";
import fs from "fs";
import path from "path";
import { dbOut, dbPath } from "../../drizzle.config";

export async function runMigrations() {
  const sqlite = new Database(dbPath);
  const db = drizzle(sqlite);

  // Use the drizzle config from this package (core)
  const currentFileUrl = new URL(import.meta.url);
  const currentDir = path.dirname(currentFileUrl.pathname);
  const corePackageRootDir = path.resolve(currentDir, "../../");
  const configPath = path.join(corePackageRootDir, "drizzle.config.ts");

  await execa("npx", ["drizzle-kit", "generate", `--config=${configPath}`]);
  migrate(db, { migrationsFolder: dbOut });
}

export async function createDatabase(force = false): Promise<void> {
  if (fs.existsSync(dbPath) && !force) {
    throw new Error(
      `Database already exists at ${dbPath}. Use --force to overwrite.`,
    );
  }

  // Remove existing database if force is true
  if (force && fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log("Existing database removed");
  }

  // Create database directory and run migrations
  fs.mkdirSync(dbOut, { recursive: true });
  await runMigrations();

  console.log("Database initialized successfully");
}
