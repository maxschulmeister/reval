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
          runId: run.id,
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

export async function getRunSummary(runId: string): Promise<RunSummary | null> {
  const prisma = getDb();
  const run = await prisma.run.findUnique({
    where: { id: runId },
  });

  if (!run) {
    return null;
  }

  const executionsData = await prisma.execution.findMany({
    where: { runId },
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

export async function getRunDetails(runId: string): Promise<RunDetails | null> {
  const prisma = getDb();
  const runData = await prisma.run.findUnique({
    where: { id: runId },
  });

  if (!runData) {
    return null;
  }

  const executionsData = await prisma.execution.findMany({
    where: { runId },
  });

  // Convert JSON strings back to objects for compatibility
  const run: Run = {
    id: runData.id,
    name: runData.name,
    notes: runData.notes,
    function: runData.function,
    features: JSON.parse(runData.features as string),
    target: JSON.parse(runData.target as string),
    variants: JSON.parse(runData.variants as string),
    timestamp: Number(runData.timestamp),
  };

  const executions: Execution[] = executionsData.map((exec) => ({
    id: exec.id,
    runId: exec.runId,
    features: JSON.parse(exec.features as string),
    target: JSON.parse(exec.target as string),
    result: exec.result ? JSON.parse(exec.result as string) : null,
    time: exec.time,
    retries: exec.retries,
    accuracy: exec.accuracy ?? 0,
    status: exec.status,
    variant: JSON.parse(exec.variant as string),
  }));

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
    run,
    executions,
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
    return "id,runId,features,target,result,time,retries,accuracy,status,variant,error\n";
  }

  const headers = [
    "id",
    "runId",
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
    execution.runId,
    JSON.stringify(execution.features),
    JSON.stringify(execution.target),
    JSON.stringify(execution.result),
    execution.time,
    execution.retries,
    execution.accuracy,
    execution.status,
    JSON.stringify(execution.variant),
    execution.status === "error" && execution.result?.error
      ? execution.result.error
      : "",
  ]);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}
