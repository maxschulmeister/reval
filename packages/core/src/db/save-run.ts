import { db } from ".";
import type { Execution, Run } from "../types/db";
import { executions, runs } from "./schema";

export const saveRun = async (run: Run, allExecutions: Execution[]) => {
  try {
    await db.insert(runs).values(run);
    console.debug(`Saved run ${run.id} to database`);
  } catch (error) {
    console.error(`Failed to save run ${run.id} to database`, error);
    throw error;
  }

  try {
    await Promise.all(
      allExecutions.map((execution) => db.insert(executions).values(execution)),
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
