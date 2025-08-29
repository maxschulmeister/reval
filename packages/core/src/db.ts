import { PrismaClient } from "@prisma/client";
import path from "path";
import { NAMESPACE } from "./constants";
import type { Execution, Run } from "./types/db";

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
        db: {
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
export const saveRun = async (run: Run, allExecutions: Execution[]) => {
  const prisma = getDb();
  try {
    await prisma.run.create({
      data: {
        id: run.id,
        name: run.name,
        notes: run.notes,
        function: run.function,
        features: JSON.stringify(run.features),
        target: JSON.stringify(run.target),
        variants: JSON.stringify(run.variants),
        timestamp: BigInt(run.timestamp),
      },
    });
    console.debug(`Saved run ${run.id} to database`);
  } catch (error) {
    console.error(`Failed to save run ${run.id} to database`, error);
    throw error;
  }

  try {
    await Promise.all(
      allExecutions.map((execution) =>
        prisma.execution.create({
          data: {
            id: execution.id,
            runId: execution.runId,
            features: JSON.stringify(execution.features),
            target: JSON.stringify(execution.target),
            result: execution.result
              ? JSON.stringify(execution.result)
              : undefined,
            time: execution.time,
            retries: execution.retries,
            accuracy: execution.accuracy,
            status: execution.status,
            variant: JSON.stringify(execution.variant),
          },
        }),
      ),
    );
    console.debug(`Saved all Executions of run ${run.id} to database`);
  } catch (error) {
    console.error(
      `Failed to save all Executions of run ${run.id} to database`,
      error,
    );
    throw error;
  }
};
