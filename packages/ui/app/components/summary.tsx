"use client";

import type { Benchmark } from "@reval/core/types";
import jsBeautify from "js-beautify";
import { calculateAverageTime, calculateSuccessRate } from "../lib/grouping";
import { CodeDialog } from "./code-dialog";
import { Button } from "./ui/button";
import { Cell } from "./ui/cell";
import { H5, Small } from "./ui/typography";

export const Summary = ({ run, executions }: Benchmark) => {
  return (
    <Cell className="border-b border-border">
      {/* Function summary */}
      <dl className="flex items-center gap-x-2">
        <H5 as="dt">Function</H5>
        <Small as="dd" className="mr-8">
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
                className="rounded-radius ml-2 border-border shadow-none hover:bg-accent hover:text-accent-foreground"
              >
                Show Code
              </Button>
            }
          />
        </Small>

        {/* Timestamp Summary */}
        <H5 as="dt">Timestamp</H5>
        <Small as="dd" className="mr-8">
          {new Intl.DateTimeFormat("en-GB", {
            dateStyle: "long",
            timeStyle: "short",
            // timeZoneName: "short",
          }).format(Number(run.timestamp))}
        </Small>

        {/* Executions Summary */}
        <H5 as="dt">Executions</H5>
        <Small as="dd" className="mr-8">
          {executions.length}
        </Small>

        {/* Success Rate Summary */}
        <H5 as="dt">Success Rate</H5>
        <Small as="dd" className="mr-8">
          {calculateSuccessRate(executions)}%
        </Small>
        {/* Average Time Summary */}
        <H5 as="dt">Avg Time</H5>
        <Small as="dd" className="mr-8">
          {calculateAverageTime(executions)}ms
        </Small>
      </dl>
    </Cell>
  );
};
