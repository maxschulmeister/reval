"use client";

import type { Eval, Run } from "@reval/core/types";
import { DataTable } from "./evals/data-table";

interface EvalDataTableProps {
  eval: Eval;
  sortedRuns: Run[];
}

export const EvalDataTable = ({
  eval: evalData,
  sortedRuns,
}: EvalDataTableProps) => {
  return (
    <div className="mt-8">
      <DataTable eval={evalData} runs={sortedRuns} />
    </div>
  );
};
