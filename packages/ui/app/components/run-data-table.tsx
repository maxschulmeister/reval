"use client";

import type { Execution, Run } from "@reval/core/src/types";
import { DataTable } from "./executions/data-table";

interface RunDataTableProps {
  run: Run;
  sortedExecutions: Execution[];
}

export const RunDataTable = ({ run, sortedExecutions }: RunDataTableProps) => {
  return (
    <div className="mt-8">
      <DataTable run={run} executions={sortedExecutions} />
    </div>
  );
};
