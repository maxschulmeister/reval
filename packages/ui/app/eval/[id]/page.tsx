import { getEvalDetails, listEvals } from "@rectangle0/reval-core";
import type { Eval } from "@rectangle0/reval-core/types";
import { notFound, redirect } from "next/navigation";
import { EvalPageClient } from "./page.client";

interface EvalPageProps {
  params: Promise<{ id: string }>;
}

async function getAllEvals(): Promise<Eval[]> {
  try {
    const evals = await listEvals(100); // Get more evals for navigation
    // Get full eval details for each eval to match the Eval type
    const fullEvals = await Promise.all(
      evals.map(async (evalSummary) => {
        const fullEval = await getEvalDetails(evalSummary.id);
        return fullEval ? fullEval.eval : null;
      }),
    );
    return fullEvals.filter((evalItem): evalItem is Eval => evalItem !== null);
  } catch (error) {
    console.error("Error fetching evals:", error);
    return [];
  }
}

async function getEvalData(eval_id: string) {
  try {
    return await getEvalDetails(eval_id);
  } catch (error) {
    console.error("Error fetching eval data:", error);
    return null;
  }
}

export default async function EvalPage({ params }: EvalPageProps) {
  const { id: eval_id } = await params;

  // Fetch data on the server
  const [allEvals, evalData] = await Promise.all([
    getAllEvals(),
    getEvalData(eval_id),
  ]);

  // If eval not found, redirect to latest eval or show not found
  if (!evalData) {
    if (allEvals.length > 0) {
      redirect(`/eval/${allEvals[0].id}`);
    }
    notFound();
  }

  return (
    <EvalPageClient
      evals={allEvals}
      evalData={evalData}
      currentEvalId={eval_id}
    />
  );
}
