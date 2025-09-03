import { execa } from "execa";
import fs from "fs";
import { NAMESPACE } from "../constants";
import { dbOut, dbPath, prismaPath } from "../db";

export async function migrateDb() {
  // Ensure migrations directory exists
  fs.mkdirSync(dbOut, { recursive: true });

  // Use Prisma Migrate to apply migrations
  await execa(
    "npx",
    ["prisma", "migrate", "deploy", `--schema=${prismaPath}`],
    {
      stdio: "inherit",
    },
  );
}

export async function createDb(force = false): Promise<void> {
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
  const localSchemaPath = `${dbOut}/${NAMESPACE}.prisma`;
  const originalSchema = fs.readFileSync(prismaPath, "utf8");

  // // Modify schema for local use
  const localSchema = originalSchema
    .replace(
      `url      = "file:../../.${NAMESPACE}/${NAMESPACE}.db"`,
      `url      = "file:./${NAMESPACE}.db"`,
    )
    .replace(
      'output   = "./node_modules/@prisma/client"',
      'output   = "../node_modules/.prisma/client"',
    );

  fs.writeFileSync(localSchemaPath, localSchema, "utf8");

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
