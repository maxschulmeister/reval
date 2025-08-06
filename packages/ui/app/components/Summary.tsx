"use client";

import type { Execution, Run } from "@reval/core";
import jsBeautify from "js-beautify";
import { calculateAverageTime, calculateSuccessRate } from "../lib/grouping";
import { Button } from "./ui/button";
import { Cell } from "./ui/cell";
import { CodeDialog } from "./code-dialog";

interface SummaryProps {
  run: Run;
  filteredExecutions: Execution[];
}

export const Summary = ({ run, filteredExecutions }: SummaryProps) => {
  return (
    <Cell className="border-b border-border">
      {/* Function summary */}
      <div className="text-sm text-muted-foreground">
        <span className="font-semibold mr-2">Function:</span>
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
      </div>

      {/* Timestamp Summary */}
      <div className="text-sm text-muted-foreground">
        <span className="font-semibold mr-2">Timestamp:</span>
        {new Date(run.timestamp).toLocaleString()}
      </div>

      {/* Executions Summary */}
      <div className="text-sm text-muted-foreground">
        <span className="font-semibold mr-2">Executions:</span>
        {filteredExecutions.length}
      </div>

      {/* Success Rate Summary */}
      <div className="text-sm text-muted-foreground">
        <span className="font-semibold mr-2">Success Rate:</span>
        {calculateSuccessRate(filteredExecutions)}%
      </div>

      {/* Average Time Summary */}
      <div className="text-sm text-muted-foreground">
        <span className="font-semibold mr-2">Avg Time:</span>
        {calculateAverageTime(filteredExecutions)}ms
      </div>
    </Cell>
  );
};
