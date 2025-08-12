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

export async function runMigrationsAtPath(customPath?: string): Promise<void> {
  const migrationsPath = customPath ? path.resolve(customPath, ".reval") : config.out ?? "../../.reval";
  const migrationsDir = path.resolve(migrationsPath);

  // For custom paths, we need to copy migrations from the package
  if (customPath) {
    const packageMigrationsDir = path.resolve(config.out ?? "../../.reval");
    
    // If package migrations don't exist, we need to generate them first
    if (!fs.existsSync(packageMigrationsDir)) {
      console.log('Generating migrations...');
      // Try to generate migrations using drizzle-kit
      try {
         const { execSync } = await import('child_process');
         const corePackagePath = path.resolve(__dirname, '../..');
         execSync('npx drizzle-kit generate', { 
           cwd: corePackagePath,
           stdio: 'inherit'
         });
      } catch (error) {
        console.error('Failed to generate migrations:', error);
        throw new Error('Could not generate database migrations. Please run "npx drizzle-kit generate" in the core package first.');
      }
    }
    
    if (fs.existsSync(packageMigrationsDir)) {
      // Copy entire migration structure to the custom location
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
      
      const files = fs.readdirSync(packageMigrationsDir);
      for (const file of files) {
        if (file !== 'reval.db') { // Skip the database file
          copyRecursive(
            path.join(packageMigrationsDir, file),
            path.join(migrationsDir, file)
          );
        }
      }
    } else {
      throw new Error('Could not find or generate database migrations.');
    }
  }

  // Ensure migration directory exists
  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Migration directory does not exist: ${migrationsDir}`);
  }

  // Create a temporary database connection for the custom path
  if (customPath) {
    const Database = (await import('better-sqlite3')).default;
    const { drizzle } = await import('drizzle-orm/better-sqlite3');
    const dbPath = path.resolve(customPath, ".reval/reval.db");
    const sqlite = new Database(dbPath);
    const customDb = drizzle(sqlite);
    
    try {
      await migrate(customDb, { migrationsFolder: migrationsDir });
      console.log('Database migrations completed successfully');
    } catch (error) {
      console.error('Failed to run database migrations:', error);
      throw error;
    } finally {
      sqlite.close();
    }
  } else {
    try {
      await migrate(db, { migrationsFolder: migrationsDir });
      console.log('Database migrations completed successfully');
    } catch (error) {
      console.error('Failed to run database migrations:', error);
      throw error;
    }
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

export function createDatabaseAtPath(customPath?: string): void {
  const dbPath = customPath ? path.resolve(customPath, ".reval/reval.db") : path.resolve("../../.reval/reval.db");
  const dbDir = path.dirname(dbPath);
  
  // Create database directory if it doesn't exist
  fs.mkdirSync(dbDir, { recursive: true });
  
  console.log(`Database directory ensured at: ${dbDir}`);
  console.log(`Database will be created at: ${dbPath}`);
}

export async function initializeDatabase(force = false, customPath?: string): Promise<void> {
  const dbPath = customPath ? path.resolve(customPath, ".reval/reval.db") : path.resolve("../../.reval/reval.db");
  
  if (fs.existsSync(dbPath) && !force) {
    throw new Error(`Database already exists at ${dbPath}. Use --force to overwrite.`);
  }

  // Remove existing database if force is true
  if (force && fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('Existing database removed');
  }

  // Create database directory and run migrations
  createDatabaseAtPath(customPath);
  await runMigrationsAtPath(customPath);
  
  console.log('Database initialized successfully');
}