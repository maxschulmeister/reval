"use client";

import { DataTable } from "@/app/components/evals/data-table";
import { Summary } from "@/app/components/summary";
import { useEvalDetails, useEvals } from "@/app/lib/hooks";
import type { Benchmark, Eval } from "@reval/core/types";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Header } from "../../components/header";

interface EvalPageClientProps {
  evals: Eval[];
  evalData: Benchmark;
  currentEvalId: string;
}

export const EvalPageClient = ({
  evals: initialEvals,
  evalData: initialEvalData,
  currentEvalId,
}: EvalPageClientProps) => {
  const router = useRouter();

  // Use SWR for real-time data fetching
  const { evals, isLoading: evalsLoading } = useEvals();
  const { evalData, isLoading: evalLoading } = useEvalDetails(currentEvalId);

  // Use real-time data if available, fallback to initial server data
  const currentEvals =
    evals.length > 0
      ? evals
      : initialEvals.map((evalItem) => ({
          id: evalItem.id,
          name: evalItem.name,
          timestamp: evalItem.timestamp,
          totalRuns: 0,
          successCount: 0,
          errorCount: 0,
          successRate: 0,
          avgTime: 0,
          notes: evalItem.notes,
        }));

  const currentEvalData = evalData || initialEvalData;

  // Check if there's a newer eval and redirect if needed
  useEffect(() => {
    if (evals.length > 0) {
      const latestEval = evals[evals.length - 1];
      const currentEvalExists = evals.find((e) => e.id === currentEvalId);

      // If current eval doesn't exist anymore, redirect to latest
      if (!currentEvalExists && latestEval) {
        router.push(`/eval/${latestEval.id}`);
      }
    }
  }, [evals, currentEvalId, router]);

  // Show loading state only if we don't have any data
  if ((evalsLoading || evalLoading) && !currentEvalData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-foreground"></div>
          <p className="text-muted-foreground">Loading eval data...</p>
        </div>
      </div>
    );
  }

  if (!currentEvalData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">Eval Not Found</h1>
          <p className="text-muted-foreground">
            The requested eval could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="w-full">
        <Header
          evals={currentEvals.map((evalSummary) => ({
            id: evalSummary.id,
            name: evalSummary.name,
            notes: evalSummary.notes || null,
            function: "", // This field might not be available in summary
            timestamp: evalSummary.timestamp,
          }))}
          currentEvalId={currentEvalId}
          currentEvalName={currentEvalData.eval.name}
          currentEval={currentEvalData.eval}
          isLoading={evalsLoading || evalLoading}
        />

        <Summary {...currentEvalData} />

        <DataTable {...currentEvalData} />
      </div>
    </div>
  );
};
