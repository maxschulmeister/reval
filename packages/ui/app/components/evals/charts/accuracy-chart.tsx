"use client";

import { ArrowDownWideNarrow, ArrowUpNarrowWide } from "lucide-react";
import prettyNum, { PRECISION_SETTING } from "pretty-num";
import { memo, useMemo, useState } from "react";
import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from "recharts";

import type {
  AccuracyChartDataItem,
  BaseChartProps,
  SortDirection,
} from "../../../lib/chart-types";
import {
  calculateYAxisDomain,
  generateAccuracyChartData,
} from "../../../lib/chart-utils";
import { Button } from "../../ui/button";
import { ChartConfig, ChartContainer, ChartTooltip } from "../../ui/chart";

const AccuracyChartComponent = ({ data }: BaseChartProps) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return generateAccuracyChartData(data);
  }, [data]);

  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Filter and sort chart data
  const filteredChartData = useMemo(() => {
    return chartData
      .filter((item) => item.totalRuns > 0) // Only show items with data
      .sort((a, b) => {
        const aValue = a.averageValue;
        const bValue = b.averageValue;
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      });
  }, [chartData, sortDirection]);

  // Calculate Y-axis domain based on actual data values
  const yAxisDomain = useMemo(() => {
    return calculateYAxisDomain(filteredChartData, "averageValue");
  }, [filteredChartData]);

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {
      averageValue: {
        label: "Average Accuracy",
        color: "hsl(var(--chart-1))",
      },
    };

    // Add each accuracy key as a config entry with its unique color
    filteredChartData.forEach((item: AccuracyChartDataItem, index: number) => {
      config[`accuracy${index}`] = {
        label: item.accuracyKeyDetails,
        color: item.color,
      };
    });

    return config;
  }, [filteredChartData]);

  if (filteredChartData.length === 0) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
        <p>No accuracy details found in the data.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() =>
            setSortDirection(sortDirection === "asc" ? "desc" : "asc")
          }
        >
          {sortDirection === "asc" ? (
            <ArrowUpNarrowWide className="h-4 w-4 -rotate-90" />
          ) : (
            <ArrowDownWideNarrow className="h-4 w-4 -rotate-90" />
          )}
        </Button>
      </div>
      <ChartContainer config={chartConfig} className="h-[50vh] w-full">
        <BarChart
          accessibilityLayer
          data={filteredChartData}
          margin={{ top: 40, right: 0, bottom: 0, left: 0 }}
        >
          <YAxis
            domain={yAxisDomain}
            hide={false}
            width={60}
            tickFormatter={(value) =>
              prettyNum(value, {
                precision: 1,
                precisionSetting: PRECISION_SETTING.REDUCE_SIGNIFICANT,
              })
            }
          />
          <XAxis
            dataKey="accuracyKey"
            tickLine={true}
            tickMargin={10}
            axisLine={true}
            hide={false}
            angle={-45}
            textAnchor="end"
            height={120}
            interval={0}
          />
          <ChartTooltip
            cursor={false}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const data = payload[0]?.payload as AccuracyChartDataItem;
              return (
                <div className="rounded-lg border bg-background p-2 shadow-md">
                  <div className="grid gap-2">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] text-muted-foreground uppercase">
                        Accuracy Key
                      </span>
                      <span className="font-bold text-muted-foreground">
                        {data.accuracyKey}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] text-muted-foreground uppercase">
                        Average Accuracy
                      </span>
                      <span className="font-medium text-blue-600">
                        {data.averageValue.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] text-muted-foreground uppercase">
                        Total Runs
                      </span>
                      <span className="font-medium">{data.totalRuns}</span>
                    </div>
                  </div>
                </div>
              );
            }}
          />
          <Bar dataKey="averageValue" radius={4} isAnimationActive={false}>
            {filteredChartData.map(
              (entry: AccuracyChartDataItem, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ),
            )}
            <LabelList
              position="top"
              offset={12}
              className="fill-foreground"
              fontSize={12}
              formatter={(value: number) =>
                prettyNum(value, {
                  precision: 1,
                  precisionSetting: PRECISION_SETTING.REDUCE_SIGNIFICANT,
                })
              }
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </>
  );
};

// Smart re-rendering with memo and custom comparison
export const AccuracyChart = memo(
  AccuracyChartComponent,
  (prevProps, nextProps) => {
    // Only re-render if data length changes significantly
    const dataLengthChanged = prevProps.data.length !== nextProps.data.length;

    // Check if first and last data points changed (indicating data refresh)
    const firstDataChanged = prevProps.data[0]?.id !== nextProps.data[0]?.id;
    const lastDataChanged =
      prevProps.data[prevProps.data.length - 1]?.id !==
      nextProps.data[nextProps.data.length - 1]?.id;

    // Re-render only if significant changes occurred
    return !dataLengthChanged && !firstDataChanged && !lastDataChanged;
  },
);
