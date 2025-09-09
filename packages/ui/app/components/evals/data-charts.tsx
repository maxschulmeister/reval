"use client";

import type { Run } from "@reval/core/types";
import { type Table } from "@tanstack/react-table";
import { memo, useState } from "react";

import { Cell as UICell } from "../ui/cell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { H5 } from "../ui/typography";
import { AccuracyChart } from "./charts/accuracy-chart";
import { VariantsChart } from "./charts/variants-chart";

interface DataChartsProps {
  data: Run[];
  table: Table<Run>;
}

// Memoized chart component with smart re-rendering
const DataChartsComponent = ({ data, table }: DataChartsProps) => {
  const [activeTab, setActiveTab] = useState("variants");

  // Early return if no data
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <UICell className="flex-col items-start gap-4">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full space-y-4"
      >
        <TabsContent value="variants" className="flex flex-wrap gap-4">
          <ChartTabsList />
          <VariantsChart data={data} table={table} />
        </TabsContent>
        <TabsContent value="accuracy" className="flex flex-wrap gap-4">
          <ChartTabsList />
          <AccuracyChart data={data} table={table} />
        </TabsContent>
      </Tabs>
    </UICell>
  );
};

export const ChartTabsList = () => (
  <TabsList>
    <TabsTrigger value="variants">
      <H5>Variants</H5>
    </TabsTrigger>
    <TabsTrigger value="accuracy">
      <H5>Accuracy</H5>
    </TabsTrigger>
  </TabsList>
);

// Smart re-rendering with memo and custom comparison
export const DataCharts = memo(DataChartsComponent, (prevProps, nextProps) => {
  // Only re-render if data length changes significantly
  const dataLengthChanged = prevProps.data.length !== nextProps.data.length;

  // Check if column visibility changed
  const visibleColumnsChanged =
    prevProps.table.getVisibleLeafColumns().length !==
    nextProps.table.getVisibleLeafColumns().length;

  // Check if first and last data points changed (indicating data refresh)
  const firstDataChanged = prevProps.data[0]?.id !== nextProps.data[0]?.id;
  const lastDataChanged =
    prevProps.data[prevProps.data.length - 1]?.id !==
    nextProps.data[nextProps.data.length - 1]?.id;

  // Re-render only if significant changes occurred
  return (
    !dataLengthChanged &&
    !visibleColumnsChanged &&
    !firstDataChanged &&
    !lastDataChanged
  );
});
