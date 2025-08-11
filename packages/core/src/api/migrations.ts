import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "../db";
import config from "../../drizzle.config";
import fs from "fs";
import path from "path";

export async function runMigrations(): Promise<void> {
  const migrationsPath = config.out ?? "../../.reval";
  const migrationsDir = path.resolve(migrationsPath);

  // Ensure migration directory exists
  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Migration directory does not exist: ${migrationsDir}`);
  }

  try {
    await migrate(db, { migrationsFolder: migrationsDir });
    console.log('Database migrations completed successfully');
  } catch (error) {
    console.error('Failed to run database migrations:', error);
    throw error;
  }
}

export function createDatabase(): void {
  const dbPath = path.resolve("../../.reval/reval.db");
  const dbDir = path.dirname(dbPath);
  
  // Create database directory if it doesn't exist
  fs.mkdirSync(dbDir, { recursive: true });
  
  console.log(`Database directory ensured at: ${dbDir}`);
  console.log(`Database will be created at: ${dbPath}`);
}

export async function initializeDatabase(force = false): Promise<void> {
  const dbPath = path.resolve("../../.reval/reval.db");
  
  if (fs.existsSync(dbPath) && !force) {
    throw new Error(`Database already exists at ${dbPath}. Use --force to overwrite.`);
  }

  // Remove existing database if force is true
  if (force && fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('Existing database removed');
  }

  // Create database directory and run migrations
  createDatabase();
  await runMigrations();
  
  console.log('Database initialized successfully');
}