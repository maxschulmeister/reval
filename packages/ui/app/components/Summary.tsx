"use client";

import type { Execution, Run } from "@reval/core";
import jsBeautify from "js-beautify";
import { calculateAverageTime, calculateSuccessRate } from "../lib/grouping";
import { CodeDialog } from "./code-dialog";
import { Button } from "./ui/button";
import { Cell } from "./ui/cell";
import { DD, DT } from "./ui/typography";

interface SummaryProps {
  run: Run;
  filteredExecutions: Execution[];
}

export const Summary = ({ run, filteredExecutions }: SummaryProps) => {
  return (
    <Cell className="border-b border-border">
      {/* Function summary */}
      <dl className="flex gap-x-2 items-center">
        <DT>Function</DT>
        <DD className="mr-8">
          <CodeDialog
            title="Function"
            content={jsBeautify(run.function, {
              indent_size: 4,
              indent_char: " ",
            })}
            trigger={
              <Button
                variant="outline"
                size="sm"
                className="ml-2 rounded-radius border-border shadow-none hover:bg-accent hover:text-accent-foreground"
              >
                Show Code
              </Button>
            }
          />
        </DD>

        {/* Timestamp Summary */}
        <DT>Timestamp</DT>
        <DD className="mr-8">
          {new Date(run.timestamp).toISOString().replace("T", " ").slice(0, 19)}
        </DD>

        {/* Executions Summary */}
        <DT>Executions</DT>
        <DD className="mr-8">{filteredExecutions.length}</DD>

        {/* Success Rate Summary */}
        <DT>Success Rate</DT>
        <DD className="mr-8">{calculateSuccessRate(filteredExecutions)}%</DD>
        {/* Average Time Summary */}
        <DT>Avg Time</DT>
        <DD className="mr-8">{calculateAverageTime(filteredExecutions)}ms</DD>
      </dl>
    </Cell>
  );
};
