import { PrismaClient } from "@prisma/client";
import path from "path";
import { NAMESPACE } from "./constants";
import type { Execution, Run } from "./types/db";
import { withPrismaJsonNull } from "./utils";

export const dbName = `${NAMESPACE}.db`;
export const dbOut = path.resolve(process.cwd(), `.${NAMESPACE}`);
export const dbPath = path.join(dbOut, dbName);
export const dbSchema = `${NAMESPACE}.prisma`;

const currentFileUrl = new URL(import.meta.url);
const currentDir = path.dirname(currentFileUrl.pathname);
export const prismaPath = path.resolve(currentDir, `../${dbSchema}`);

let prisma: PrismaClient | null = null;
export const getDb = () => {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        RevalDb: {
          url: `file:${dbPath}`,
        },
      },
    });
  }
  return prisma;
};

// Clean disconnect function
export const disconnectDb = async () => {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
};

// Function to save a run and its executions
export const saveRun = async (run: Run, executions: Execution[]) => {
  const prisma = getDb();
  try {
    await prisma.run.create({
      data: run,
    });
    console.debug(`Saved run ${run.id} to database`);
  } catch (error) {
    console.error(`Failed to save run ${run.id} to database`, error);
    throw error;
  }

  try {
    // Then create all Executions (which reference Args)
    await Promise.all(
      executions.map((execution) =>
        prisma.execution.create({
          data: withPrismaJsonNull(execution),
        }),
      ),
    );
    console.debug(`Saved ${executions.length} Executions to database`);
  } catch (error) {
    console.error(
      `Failed to save all Executions of run ${run.id} to database`,
      error,
    );
    throw error;
  }
};
