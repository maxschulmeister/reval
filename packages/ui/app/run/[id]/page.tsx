import { db, executions, runs } from "@reval/core";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { RunPageClient } from "./page.client";

interface RunPageProps {
  params: Promise<{ id: string }>;
}

async function getAllRuns() {
  try {
    return await db.select().from(runs).orderBy(runs.timestamp);
  } catch (error) {
    console.error("Error fetching runs:", error);
    return [];
  }
}

async function getRunData(runId: string) {
  try {
    // Get the run details
    const run = await db.select().from(runs).where(eq(runs.id, runId)).limit(1);

    if (run.length === 0) {
      return null;
    }

    // Get all Executions for this run
    const runExecutions = await db
      .select()
      .from(executions)
      .where(eq(executions.runId, runId));

    return {
      run: run[0],
      executions: runExecutions,
    };
  } catch (error) {
    console.error("Error fetching run data:", error);
    return null;
  }
}

export default async function RunPage({ params }: RunPageProps) {
  const { id: runId } = await params;

  // Fetch data on the server
  const [allRuns, runData] = await Promise.all([
    getAllRuns(),
    getRunData(runId),
  ]);

  // If run not found, redirect to latest run or show not found
  if (!runData) {
    if (allRuns.length > 0) {
      redirect(`/run/${allRuns[0].id}`);
    }
    notFound();
  }

  return (
    <RunPageClient runs={allRuns} runData={runData} currentRunId={runId} />
  );
}
