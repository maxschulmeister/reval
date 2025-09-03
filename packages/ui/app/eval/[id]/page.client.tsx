"use client";

import { DataTable } from "@/app/components/evals/data-table";
import { Summary } from "@/app/components/summary";
import type { Benchmark, Eval } from "@reval/core/types";
import { Header } from "../../components/header";

interface EvalPageClientProps {
  evals: Eval[];
  evalData: Benchmark;
  currentEvalId: string;
}

export const EvalPageClient = ({
  evals,
  evalData,
  currentEvalId,
}: EvalPageClientProps) => {

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="w-full">
        <Header
          evals={evals}
          currentEvalId={currentEvalId}
          currentEvalName={evalData.eval.name}
        />

        <Summary {...evalData} />

        <DataTable {...evalData} />
      </div>
    </div>
  );
};
