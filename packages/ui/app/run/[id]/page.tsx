import { getRunDetails, listRuns } from "@reval/core";
import type { Run } from "@reval/core/types";
import { notFound, redirect } from "next/navigation";
import { RunPageClient } from "./page.client";

interface RunPageProps {
  params: Promise<{ id: string }>;
}

async function getAllRuns(): Promise<Run[]> {
  try {
    const runs = await listRuns(100); // Get more runs for navigation
    // Get full run details for each run to match the Run type
    const fullRuns = await Promise.all(
      runs.map(async (runSummary) => {
        const fullRun = await getRunDetails(runSummary.id);
        return fullRun ? fullRun.run : null;
      }),
    );
    return fullRuns.filter((run): run is Run => run !== null);
  } catch (error) {
    console.error("Error fetching runs:", error);
    return [];
  }
}

async function getRunData(run_id: string) {
  try {
    return await getRunDetails(run_id);
  } catch (error) {
    console.error("Error fetching run data:", error);
    return null;
  }
}

export default async function RunPage({ params }: RunPageProps) {
  const { id: run_id } = await params;

  // Fetch data on the server
  const [allRuns, runData] = await Promise.all([
    getAllRuns(),
    getRunData(run_id),
  ]);

  // If run not found, redirect to latest run or show not found
  if (!runData) {
    if (allRuns.length > 0) {
      redirect(`/run/${allRuns[0].id}`);
    }
    notFound();
  }

  return (
    <RunPageClient runs={allRuns} runData={runData} currentRunId={run_id} />
  );
}
