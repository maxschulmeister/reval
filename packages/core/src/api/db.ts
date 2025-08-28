import { execa } from "execa";
import fs from "fs";
import { dbOut, dbPath, prismaSchemaPath } from "../../drizzle.config";

export async function runMigrations() {
  // Ensure migrations directory exists
  fs.mkdirSync(dbOut, { recursive: true });

  // Use Prisma Migrate to apply migrations
  await execa("npx", ["prisma", "migrate", "deploy", `--schema=${prismaSchemaPath}`], {
    stdio: "inherit",
  });
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

  // Create database directory
  fs.mkdirSync(dbOut, { recursive: true });

  // Copy Prisma schema to local .reval directory
  const localSchemaPath = `${dbOut}/reval.prisma`;
  const originalSchema = fs.readFileSync(prismaSchemaPath, 'utf8');
  
  // Modify schema for local use
  const localSchema = originalSchema
    .replace('url      = "file:../../.reval/reval.db"', 'url      = "file:./reval.db"')
    .replace('output   = "./node_modules/@prisma/client"', 'output   = "../node_modules/.prisma/client"');
  
  fs.writeFileSync(localSchemaPath, localSchema, 'utf8');

  // Generate Prisma Client using the local schema
  await execa("npx", ["prisma", "generate", `--schema=${localSchemaPath}`], {
    stdio: "inherit",
  });

  // Push schema to database (creates tables)
  await execa("npx", ["prisma", "db", "push", `--schema=${localSchemaPath}`], {
    stdio: "inherit",
  });

  console.log("Database initialized successfully");
}
