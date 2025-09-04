import { getDb } from "../db";
import type { Eval, EvalDetails, EvalSummary } from "../types";

export async function listEvals(limit = 20): Promise<EvalSummary[]> {
  const prisma = getDb();
  const evalsData = await prisma.eval.findMany({
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

  const evalSummaries = await Promise.all(
    evalsData.map(async (evalData) => {
      const runsData = await prisma.run.findMany({
        where: {
          eval_id: evalData.id,
        },
        select: {
          status: true,
          time: true,
        },
      });

      const totalRuns = runsData.length;
      const successCount = runsData.filter(
        (r) => r.status === "success",
      ).length;
      const errorCount = totalRuns - successCount;
      const successRate = totalRuns > 0 ? (successCount / totalRuns) * 100 : 0;
      const avgTime =
        totalRuns > 0
          ? runsData.reduce((sum, r) => sum + r.time, 0) / totalRuns
          : 0;

      return {
        id: evalData.id,
        name: evalData.name,
        timestamp: evalData.timestamp,
        totalRuns,
        successCount,
        errorCount,
        successRate,
        avgTime,
        notes: evalData.notes || undefined,
      };
    }),
  );

  return evalSummaries;
}

export async function getEvalSummary(
  eval_id: string,
): Promise<EvalSummary | null> {
  const prisma = getDb();
  const evalData = await prisma.eval.findUnique({
    where: { id: eval_id },
  });

  if (!evalData) {
    return null;
  }

  const runsData = await prisma.run.findMany({
    where: { eval_id },
    select: {
      status: true,
      time: true,
    },
  });

  const totalRuns = runsData.length;
  const successCount = runsData.filter((r) => r.status === "success").length;
  const errorCount = totalRuns - successCount;
  const successRate = totalRuns > 0 ? (successCount / totalRuns) * 100 : 0;
  const avgTime =
    totalRuns > 0
      ? runsData.reduce((sum, r) => sum + r.time, 0) / totalRuns
      : 0;

  return {
    id: evalData.id,
    name: evalData.name,
    timestamp: evalData.timestamp,
    totalRuns,
    successCount,
    errorCount,
    successRate,
    avgTime,
    notes: evalData.notes || undefined,
  };
}

export async function getEvalDetails(
  eval_id: string,
): Promise<EvalDetails | null> {
  const prisma = getDb();
  const evalData = await prisma.eval.findUnique({
    where: { id: eval_id },
  });

  if (!evalData) {
    return null;
  }

  const runs = await prisma.run.findMany({
    where: {
      eval_id,
    },
  });

  const eval_: Eval = {
    id: evalData.id,
    name: evalData.name,
    notes: evalData.notes,
    function: evalData.function,
    timestamp: evalData.timestamp,
  };

  const totalRuns = runs.length;
  const successCount = runs.filter((r) => r.status === "success").length;
  const errorCount = totalRuns - successCount;
  const successRate = totalRuns > 0 ? (successCount / totalRuns) * 100 : 0;
  const avgTime =
    totalRuns > 0 ? runs.reduce((sum, r) => sum + r.time, 0) / totalRuns : 0;

  return {
    id: evalData.id,
    name: evalData.name,
    timestamp: evalData.timestamp,
    totalRuns,
    successCount,
    errorCount,
    successRate,
    avgTime,
    notes: evalData.notes || undefined,
    eval: eval_,
    runs,
  };
}

export async function exportEval(
  eval_id: string,
  format: "json" | "csv" = "json",
): Promise<string> {
  const details = await getEvalDetails(eval_id);
  const prisma = getDb();

  if (!details) {
    throw new Error(`Eval with id ${eval_id} not found`);
  }

  if (format === "json") {
    return JSON.stringify(details, null, 2);
  }

  if (format === "csv") {
    const headers = Object.keys(prisma.run.fields);

    const rows = details.runs.map((run) => [...Object.values(details.runs)]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => JSON.stringify(cell)).join(","))
      .join("\n");

    return csvContent;
  }

  throw new Error(`Unsupported format: ${format}`);
}

export async function deleteEval(eval_id: string): Promise<void> {
  const prisma = getDb();

  // Delete the eval (runs will be deleted automatically due to CASCADE)
  const deletedEval = await prisma.eval.delete({
    where: { id: eval_id },
  });

  if (!deletedEval) {
    throw new Error(`Eval with id ${eval_id} not found`);
  }
}

export async function updateEval(
  eval_id: string,
  updates: { name?: string; notes?: string },
): Promise<Eval> {
  const prisma = getDb();

  const updatedEval = await prisma.eval.update({
    where: { id: eval_id },
    data: updates,
  });

  if (!updatedEval) {
    throw new Error(`Eval with id ${eval_id} not found`);
  }

  return updatedEval;
}
