import { desc, eq } from "drizzle-orm";
import { getDb } from "../db";
import { executions, runs } from "../db/schema";
import type { Execution, Run } from "../types";

export interface RunSummary {
  id: string;
  name: string;
  timestamp: number;
  totalExecutions: number;
  successCount: number;
  errorCount: number;
  successRate: number;
  avgTime: number;
  notes?: string;
}

export interface RunDetails extends RunSummary {
  run: Run;
  executions: Execution[];
}

export async function listRuns(limit = 20): Promise<RunSummary[]> {
  const db = getDb();
  const runsData = await db
    .select({
      id: runs.id,
      name: runs.name,
      timestamp: runs.timestamp,
      notes: runs.notes,
    })
    .from(runs)
    .orderBy(desc(runs.timestamp))
    .limit(limit);

  const runSummaries = await Promise.all(
    runsData.map(async (run) => {
      const executionsData = await db
        .select({
          status: executions.status,
          time: executions.time,
        })
        .from(executions)
        .where(eq(executions.runId, run.id));

      const totalExecutions = executionsData.length;
      const successCount = executionsData.filter(
        (e) => e.status === "success",
      ).length;
      const errorCount = totalExecutions - successCount;
      const successRate =
        totalExecutions > 0 ? (successCount / totalExecutions) * 100 : 0;
      const avgTime =
        totalExecutions > 0
          ? executionsData.reduce((sum, e) => sum + e.time, 0) / totalExecutions
          : 0;

      return {
        id: run.id,
        name: run.name,
        timestamp: run.timestamp,
        totalExecutions,
        successCount,
        errorCount,
        successRate,
        avgTime,
        notes: run.notes || undefined,
      };
    }),
  );

  return runSummaries;
}

export async function getRunSummary(runId: string): Promise<RunSummary | null> {
  const db = getDb();
  const run = await db.select().from(runs).where(eq(runs.id, runId)).limit(1);

  if (run.length === 0) {
    return null;
  }

  const executionsData = await db
    .select({
      status: executions.status,
      time: executions.time,
    })
    .from(executions)
    .where(eq(executions.runId, runId));

  const totalExecutions = executionsData.length;
  const successCount = executionsData.filter(
    (e) => e.status === "success",
  ).length;
  const errorCount = totalExecutions - successCount;
  const successRate =
    totalExecutions > 0 ? (successCount / totalExecutions) * 100 : 0;
  const avgTime =
    totalExecutions > 0
      ? executionsData.reduce((sum, e) => sum + e.time, 0) / totalExecutions
      : 0;

  return {
    id: run[0].id,
    name: run[0].name,
    timestamp: run[0].timestamp,
    totalExecutions,
    successCount,
    errorCount,
    successRate,
    avgTime,
    notes: run[0].notes || undefined,
  };
}

export async function getRunDetails(runId: string): Promise<RunDetails | null> {
  const db = getDb();
  const runData = await db
    .select()
    .from(runs)
    .where(eq(runs.id, runId))
    .limit(1);

  if (runData.length === 0) {
    return null;
  }

  const executionsData = await db
    .select()
    .from(executions)
    .where(eq(executions.runId, runId));

  const totalExecutions = executionsData.length;
  const successCount = executionsData.filter(
    (e) => e.status === "success",
  ).length;
  const errorCount = totalExecutions - successCount;
  const successRate =
    totalExecutions > 0 ? (successCount / totalExecutions) * 100 : 0;
  const avgTime =
    totalExecutions > 0
      ? executionsData.reduce((sum, e) => sum + e.time, 0) / totalExecutions
      : 0;

  return {
    id: runData[0].id,
    name: runData[0].name,
    timestamp: runData[0].timestamp,
    totalExecutions,
    successCount,
    errorCount,
    successRate,
    avgTime,
    notes: runData[0].notes || undefined,
    run: runData[0],
    executions: executionsData,
  };
}

export async function exportRun(
  runId: string,
  format: "json" | "csv" = "json",
): Promise<string> {
  const details = await getRunDetails(runId);

  if (!details) {
    throw new Error(`Run with id ${runId} not found`);
  }

  if (format === "json") {
    return JSON.stringify(details, null, 2);
  }

  // CSV format
  if (details.executions.length === 0) {
    return "id,runId,features,target,result,time,retries,status,variant\n";
  }

  const headers = [
    "id",
    "runId",
    "features",
    "target",
    "result",
    "time",
    "retries",
    "status",
    "variant",
  ];
  const rows = details.executions.map((execution) => [
    execution.id,
    execution.runId,
    JSON.stringify(execution.features),
    JSON.stringify(execution.target),
    JSON.stringify(execution.result),
    execution.time,
    execution.retries,
    execution.status,
    JSON.stringify(execution.variant),
  ]);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}
