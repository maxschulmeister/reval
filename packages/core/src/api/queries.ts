import { getDb } from "../db";
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
  const prisma = getDb();
  const runsData = await prisma.run.findMany({
    select: {
      id: true,
      name: true,
      timestamp: true,
      notes: true,
    },
    orderBy: {
      timestamp: "desc",
    },
    take: limit,
  });

  const runSummaries = await Promise.all(
    runsData.map(async (run) => {
      const executionsData = await prisma.execution.findMany({
        where: {
          run_id: run.id,
        },
        select: {
          status: true,
          time: true,
        },
      });

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
        timestamp: Number(run.timestamp),
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

export async function getRunSummary(
  run_id: string,
): Promise<RunSummary | null> {
  const prisma = getDb();
  const run = await prisma.run.findUnique({
    where: { id: run_id },
  });

  if (!run) {
    return null;
  }

  const executionsData = await prisma.execution.findMany({
    where: { run_id },
    select: {
      status: true,
      time: true,
    },
  });

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
    timestamp: Number(run.timestamp),
    totalExecutions,
    successCount,
    errorCount,
    successRate,
    avgTime,
    notes: run.notes || undefined,
  };
}

export async function getRunDetails(
  run_id: string,
): Promise<RunDetails | null> {
  const prisma = getDb();
  const runData = await prisma.run.findUnique({
    where: { id: run_id },
  });

  if (!runData) {
    return null;
  }

  const executions = await prisma.execution.findMany({
    where: { run_id },
  });

  // Convert JSON strings back to objects for compatibility
  const run: Run = {
    id: runData.id,
    name: runData.name,
    notes: runData.notes,
    function: runData.function,
    timestamp: BigInt(runData.timestamp),
  };

  const totalExecutions = executions.length;
  const successCount = executions.filter((e) => e.status === "success").length;
  const errorCount = totalExecutions - successCount;
  const successRate =
    totalExecutions > 0 ? (successCount / totalExecutions) * 100 : 0;
  const avgTime =
    totalExecutions > 0
      ? executions.reduce((sum, e) => sum + e.time, 0) / totalExecutions
      : 0;

  return {
    id: run.id,
    name: run.name,
    timestamp: Number(run.timestamp),
    totalExecutions,
    successCount,
    errorCount,
    successRate,
    avgTime,
    notes: run.notes || undefined,
    run,
    executions,
  };
}

export async function exportRun(
  run_id: string,
  format: "json" | "csv" = "json",
): Promise<string> {
  const details = await getRunDetails(run_id);

  if (!details) {
    throw new Error(`Run with id ${run_id} not found`);
  }

  if (format === "json") {
    return JSON.stringify(details, null, 2);
  }

  // CSV format
  if (details.executions.length === 0) {
    return "id,run_id,features,target,result,time,retries,accuracy,status,variant,error\n";
  }

  const headers = [
    "id",
    "run_id",
    "features",
    "target",
    "result",
    "time",
    "retries",
    "accuracy",
    "status",
    "variant",
    "error",
  ];
  const rows = details.executions.map((execution) => [
    execution.id,
    execution.run_id,
    execution.target,
    execution.result,
    execution.time,
    execution.retries,
    execution.accuracy,
    execution.status,
  ]);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}
