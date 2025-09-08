import { getDb } from "../db";
import type { Eval, EvalDetails, EvalSummary } from "../types";
import { PATH_DELIMITER, COLUMN_EXPANSION_CONFIG } from "../constants";
import { flattenObject, getValueAtPath, generateChartSummary, formatFieldName } from "../utils";

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
  format: "json" | "csv" | "md" = "json",
): Promise<string | { runs: string; summary: string }> {
  const details = await getEvalDetails(eval_id);
  const prisma = getDb();

  if (!details) {
    throw new Error(`Eval with id ${eval_id} not found`);
  }

  // Generate chart summary for all formats
  const { chartData, numericKeys } = generateChartSummary(details.runs);
  const enhancedDetails = {
    ...details,
    chartSummary: {
      variantGroups: chartData,
      availableMetrics: numericKeys,
      totalVariants: chartData.length,
    },
  };

  if (format === "json") {
    return JSON.stringify(enhancedDetails, null, 2);
  }

  if (format === "csv") {
    // Generate runs CSV
    const runHeaders = [...new Set(details.runs.flatMap((run) => flattenObject(run as Record<string, unknown>)))];
    const runRows = details.runs.map((run) =>
      runHeaders.map((header) => {
        const value = getValueAtPath(run as Record<string, unknown>, header);
        return value !== null && value !== undefined ? JSON.stringify(value) : "";
      })
    );
    const runsCSV = [runHeaders, ...runRows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    // Generate summary CSV
    const summaryHeaders = ["variant", "runCount", ...numericKeys];
    const summaryRows = chartData.map((item) => [
      item.variantDetails,
      item.runCount,
      ...numericKeys.map((key) => item[key] || 0),
    ]);
    const summaryCSV = [summaryHeaders, ...summaryRows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    return { runs: runsCSV, summary: summaryCSV };
  }

  if (format === "md") {
    const formatDate = (date: Date) => date.toLocaleString();
    const formatNumber = (num: number) => num.toFixed(2);

    let markdown = `# Eval Export Report\n\n`;
    markdown += `**Eval ID:** ${details.id}\n`;
    markdown += `**Name:** ${details.name}\n`;
    markdown += `**Timestamp:** ${formatDate(details.timestamp)}\n`;
    if (details.notes) {
      markdown += `**Notes:** ${details.notes}\n`;
    }
    markdown += `\n`;

    // Summary Statistics
    markdown += `## Summary Statistics\n\n`;
    markdown += `| Metric | Value |\n`;
    markdown += `|--------|-------|\n`;
    markdown += `| Total Runs | ${details.totalRuns} |\n`;
    markdown += `| Success Count | ${details.successCount} |\n`;
    markdown += `| Error Count | ${details.errorCount} |\n`;
    markdown += `| Success Rate | ${formatNumber(details.successRate)}% |\n`;
    markdown += `| Average Time | ${formatNumber(details.avgTime)}ms |\n`;
    markdown += `\n`;

    // Variant Analysis (Chart Summary)
    if (chartData.length > 0) {
      markdown += `## Variant Performance Summary\n\n`;
      markdown += `This section represents the data that would be visualized in the interactive charts.\n\n`;

      // Variant performance table with all metrics
      const tableHeaders = ["Variant", "Run Count", ...numericKeys.map(key => formatFieldName(key))];
      markdown += `| ${tableHeaders.join(" | ")} |\n`;
      markdown += `| ${tableHeaders.map(() => "---").join(" | ")} |\n`;

      chartData.forEach((item) => {
        const row = [
          item.variantDetails,
          item.runCount.toString(),
          ...numericKeys.map((key) => (item[key] ? formatNumber(item[key]) : "N/A")),
        ];
        markdown += `| ${row.join(" | ")} |\n`;
      });
      markdown += `\n`;
    }

    // Detailed Run Data (all runs)
    markdown += `## All Run Data\n\n`;
    markdown += `Complete run data with all available metrics:\n\n`;

    if (details.runs.length > 0) {
      // Get all available fields from the runs data (same logic as UI table)
       const allFields = [...new Set(details.runs.flatMap((run) => flattenObject(run as Record<string, unknown>)))];
       
       // Filter out hidden columns that are typically not shown in UI
       const hiddenColumns = ["args", "dataIndex", "evalId", "id", "eval_id"];
       
       // For markdown, also filter out fields that contain objects (only keep strings and numbers)
       const visibleFields = allFields.filter(field => {
         if (hiddenColumns.includes(field)) return false;
         
         // Check if this field contains objects in any of the runs
         const sampleValue = getValueAtPath(details.runs[0] as Record<string, unknown>, field);
         return typeof sampleValue === "string" || typeof sampleValue === "number" || typeof sampleValue === "boolean";
       });
      
      // Create table headers
        const headers = visibleFields.map(field => formatFieldName(field));
      markdown += `| ${headers.join(" | ")} |\n`;
      markdown += `| ${headers.map(() => "---").join(" | ")} |\n`;
      
      // Add all run data
      details.runs.forEach((run) => {
        const row = visibleFields.map((field) => {
           const value = getValueAtPath(run as Record<string, unknown>, field);
           if (typeof value === "number") return formatNumber(value);
           return String(value || "N/A");
         });
        markdown += `| ${row.join(" | ")} |\n`;
      });
      markdown += `\n`;
    }

    // Export metadata
    markdown += `## Export Information\n\n`;
    markdown += `- **Export Date:** ${formatDate(new Date())}\n`;
    markdown += `- **Format:** Markdown\n`;
    markdown += `- **Total Variants:** ${chartData.length}\n`;
    markdown += `- **Available Metrics:** ${numericKeys.length}\n`;

    return markdown;
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
