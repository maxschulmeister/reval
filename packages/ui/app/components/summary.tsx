"use client";

import type { Reval } from "@reval/core/types";
import jsBeautify from "js-beautify";
import { useMemo } from "react";
import { calculateAverageTime, calculateSuccessRate } from "../lib/grouping";
import { CodeDialog } from "./code-dialog";
import { Button } from "./ui/button";
import { Cell } from "./ui/cell";
import { H5, Small } from "./ui/typography";

export const Summary = ({ eval: evalData, runs }: Reval) => {
  // Memoize expensive calculations
  const successRate = useMemo(() => calculateSuccessRate(runs), [runs]);
  const averageTime = useMemo(() => calculateAverageTime(runs), [runs]);
  const beautifiedFunction = useMemo(
    () =>
      jsBeautify(evalData.function, {
        indent_size: 4,
        indent_char: " ",
      }),
    [evalData.function],
  );
  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat("en-GB", {
        dateStyle: "long",
        timeStyle: "short",
      }).format(new Date(evalData.timestamp)),
    [evalData.timestamp],
  );

  return (
    <Cell className="border-b border-border">
      {/* Function summary */}
      <dl className="flex items-center gap-x-2">
        <H5 as="dt">Function</H5>
        <Small as="dd" className="mr-8">
          <CodeDialog
            title="Function"
            content={beautifiedFunction}
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
        <H5 as="dt">Date</H5>
        <Small as="dd" className="mr-8">
          {formattedDate}
        </Small>

        {/* Runs Summary */}
        <H5 as="dt">Runs</H5>
        <Small as="dd" className="mr-8">
          {runs.length}
        </Small>

        {/* Success Rate Summary */}
        <H5 as="dt">Success Rate</H5>
        <Small as="dd" className="mr-8">
          {successRate}%
        </Small>
        {/* Average Time Summary */}
        <H5 as="dt">Avg Time</H5>
        <Small as="dd" className="mr-8">
          {averageTime}ms
        </Small>
      </dl>
    </Cell>
  );
};
