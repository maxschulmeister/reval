import { PrismaClient } from "@prisma/client";
import path from "path";
import { NAMESPACE } from "./constants";
import type { Run, Eval } from "./types/db";
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

// Function to save an eval and its runs
export const saveEval = async (eval_: Eval, runs: Run[]) => {
  const prisma = getDb();
  try {
    await prisma.eval.create({
      data: eval_,
    });
    console.debug(`Saved eval ${eval_.id} to database`);
  } catch (error) {
    console.error(`Failed to save eval ${eval_.id} to database`, error);
    throw error;
  }

  try {
    // Then create all Runs (which reference the Eval)
    await Promise.all(
      runs.map((run) =>
        prisma.run.create({
          data: withPrismaJsonNull(run),
        }),
      ),
    );
    console.debug(`Saved ${runs.length} Runs to database`);
  } catch (error) {
    console.error(
      `Failed to save all Runs of eval ${eval_.id} to database`,
      error,
    );
    throw error;
  }
};
