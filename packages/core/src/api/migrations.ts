import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import fs from "fs";
import path from "path";
import config from "../../drizzle.config";
import { db } from "../db";

export async function runMigrations(customPath?: string): Promise<void> {
  return runMigrationsAtPath(customPath || process.cwd());
}

export async function runMigrationsAtPath(customPath?: string): Promise<void> {
  // Always use current working directory if no custom path provided
  const basePath = customPath || process.cwd();
  const migrationsPath = path.resolve(basePath, ".reval");
  const migrationsDir = path.resolve(migrationsPath);

  // We need to copy migrations from the package to the target directory
  const packageMigrationsDir = path.resolve(config.out ?? "../../.reval");

  // If package migrations don't exist in the config location, 
  // check for them in other common locations
  let sourceMigrationsDir = packageMigrationsDir;
  if (!fs.existsSync(packageMigrationsDir)) {
    // Try to find migrations in parent directories or common locations
    const possiblePaths = [
      path.resolve(basePath, "../.reval"),
      path.resolve(basePath, "../../.reval"),
      path.resolve(process.cwd(), ".reval"),
    ];
    
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath) && fs.readdirSync(possiblePath).some(f => f.endsWith('.sql'))) {
        sourceMigrationsDir = possiblePath;
        break;
      }
    }
    
    if (!fs.existsSync(sourceMigrationsDir)) {
      throw new Error(
        'Could not find database migrations. Please run "npx drizzle-kit generate" in the core package first.',
      );
    }
  }

  if (fs.existsSync(sourceMigrationsDir)) {
    // Copy entire migration structure to the target location
    fs.mkdirSync(migrationsDir, { recursive: true });

    // Copy all files and directories recursively
    const copyRecursive = (src: string, dest: string) => {
      const stat = fs.statSync(src);
      if (stat.isDirectory()) {
        fs.mkdirSync(dest, { recursive: true });
        const files = fs.readdirSync(src);
        for (const file of files) {
          copyRecursive(path.join(src, file), path.join(dest, file));
        }
      } else {
        fs.copyFileSync(src, dest);
      }
    };

    const files = fs.readdirSync(sourceMigrationsDir);
    for (const file of files) {
      if (file !== "reval.db") {
        // Skip the database file
        copyRecursive(
          path.join(sourceMigrationsDir, file),
          path.join(migrationsDir, file),
        );
      }
    }
  } else {
    throw new Error("Could not find or generate database migrations.");
  }

  // Ensure migration directory exists
  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Migration directory does not exist: ${migrationsDir}`);
  }

  // Create a database connection for the target path
  const Database = (await import("better-sqlite3")).default;
  const { drizzle } = await import("drizzle-orm/better-sqlite3");
  const dbPath = path.resolve(basePath, ".reval/reval.db");
  const sqlite = new Database(dbPath);
  const targetDb = drizzle(sqlite);

  try {
    await migrate(targetDb, { migrationsFolder: migrationsDir });
    console.log("Database migrations completed successfully");
  } catch (error) {
    console.error("Failed to run database migrations:", error);
    throw error;
  } finally {
    sqlite.close();
  }
}

export function createDatabase(customPath?: string): void {
  return createDatabaseAtPath(customPath || process.cwd());
}

export function createDatabaseAtPath(customPath?: string): void {
  const basePath = customPath || process.cwd();
  const dbPath = path.resolve(basePath, ".reval/reval.db");
  const dbDir = path.dirname(dbPath);

  // Create database directory if it doesn't exist
  fs.mkdirSync(dbDir, { recursive: true });

  console.log(`Database directory ensured at: ${dbDir}`);
  console.log(`Database will be created at: ${dbPath}`);
}

export async function initializeDatabase(
  force = false,
  customPath?: string,
): Promise<void> {
  const basePath = customPath || process.cwd();
  const dbPath = path.resolve(basePath, ".reval/reval.db");

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
  createDatabaseAtPath(basePath);
  await runMigrationsAtPath(basePath);

  console.log("Database initialized successfully");
}
