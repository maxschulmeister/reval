"use client";

import type { Run } from "@reval/core/types";
import { type AccessorKeyColumnDef } from "@tanstack/react-table";
import Palette from "iwanthue/palette";
import { useMemo, useState } from "react";
import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from "recharts";
import { titleCase } from "text-title-case";
import { Cell as UICell } from "../ui/cell";
import { ChartConfig, ChartContainer, ChartTooltip } from "../ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { H5 } from "../ui/typography";

interface DataChartsProps {
  data: Run[];
  columns: AccessorKeyColumnDef<Run>[];
}

const getValueAtPath = (
  obj: Record<string, unknown>,
  path: string,
): unknown => {
  return path.split(".").reduce((current: unknown, key: string) => {
    return (current as Record<string, unknown>)?.[key];
  }, obj);
};

export const DataCharts = ({ data, columns }: DataChartsProps) => {
  const { chartData, numericKeys } = useMemo(() => {
    if (!data || data.length === 0) return { chartData: [], numericKeys: [] };

    // Get numeric keys from columns with number type
    const allNumericKeys = columns
      .filter((column) => column.meta?.type === "number")
      .map((column) => column.accessorKey)
      .filter((key): key is string => typeof key === "string");

    // Get unique variant combinations from all data
    const uniqueVariants = Array.from(
      new Set(
        data.map((run: Run) =>
          run.variants
            ? Object.entries(run.variants as Record<string, unknown>)
                .map(([key, value]) => `${key}: ${value}`)
                .join(", ")
            : "No variants",
        ),
      ),
    );

    // Generate color palette for unique variants
    const palette = Palette.generateFromValues("variants", uniqueVariants, {
      defaultColor: "#fff",
    });

    // Create chart data with colors for all data
    const chartDataWithColors = data.map((run: Run, index: number) => {
      const variantKey = run.variants
        ? Object.entries(run.variants as Record<string, unknown>)
            .map(([key, value]) => `${key}: ${value}`)
            .join(", ")
        : "No variants";

      return {
        ...run,
        variant: `Run ${index + 1}`,
        variantDetails: variantKey,
        color: palette.get(variantKey),
      };
    });

    return { chartData: chartDataWithColors, numericKeys: allNumericKeys };
  }, [data, columns]);

  const [selectedMetric, setSelectedMetric] = useState<string>(
    "score.accuracy.value",
  );

  // Filter chart data to only include values > 0 for the selected metric
  const filteredChartData = useMemo(() => {
    return chartData
      .filter((item) => {
        const metricValue = getValueAtPath(
          item as Record<string, unknown>,
          selectedMetric,
        );
        return typeof metricValue === "number" && metricValue > 0;
      })
      .sort((a, b) => {
        const aValue = getValueAtPath(
          a as Record<string, unknown>,
          selectedMetric,
        ) as number;
        const bValue = getValueAtPath(
          b as Record<string, unknown>,
          selectedMetric,
        ) as number;
        return bValue - aValue; // Descending order
      });
  }, [chartData, selectedMetric]);

  // Calculate Y-axis domain based on actual data values
  const yAxisDomain = useMemo(() => {
    if (filteredChartData.length === 0) return [0, 1];

    const values = filteredChartData
      .map((item) => {
        const value = getValueAtPath(
          item as Record<string, unknown>,
          selectedMetric,
        );
        return typeof value === "number" ? value : 0;
      })
      .filter((value) => value > 0);

    if (values.length === 0) return [0, 1];

    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue;
    const padding = range * 0.1; // 10% padding

    return [Math.max(0, minValue - padding), maxValue + padding];
  }, [filteredChartData, selectedMetric]);

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {
      [selectedMetric]: {
        label: selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1),
        color: "hsl(var(--chart-1))",
      },
    };

    // Add each variant as a config entry with its unique color
    filteredChartData.forEach(
      (
        item: Run & { variant: string; variantDetails: string; color: string },
        index: number,
      ) => {
        config[`variant${index}`] = {
          label: item.variantDetails,
          color: item.color,
        };
      },
    );

    return config;
  }, [filteredChartData, selectedMetric]);

  if (filteredChartData.length <= 1 || numericKeys.length === 0) {
    return;
  }

  return (
    <UICell className="flex-col items-start gap-4">
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <H5>Variants by </H5>
        </div>
        <Select value={selectedMetric} onValueChange={setSelectedMetric}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {numericKeys.map((key) => (
              <SelectItem key={key} value={key}>
                {titleCase(key.replace(".", " "))}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <ChartContainer config={chartConfig} className="h-[50vh] w-full">
        <BarChart
          accessibilityLayer
          data={filteredChartData}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
        >
          <YAxis
            domain={yAxisDomain}
            hide={false}
            width={60}
            tickFormatter={(value) => value.toFixed(2)}
          />
          <XAxis
            dataKey="variant"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            hide
          />
          <ChartTooltip
            cursor={false}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const data = payload[0]?.payload;
              const metricValue = getValueAtPath(
                data as Record<string, unknown>,
                selectedMetric,
              );
              return (
                <div className="rounded-lg border bg-background p-2 shadow-md">
                  <div className="grid gap-2">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] text-muted-foreground uppercase">
                        {selectedMetric.charAt(0).toUpperCase() +
                          selectedMetric.slice(1)}
                      </span>
                      <span className="font-bold text-muted-foreground">
                        {typeof metricValue === "number"
                          ? metricValue.toString()
                          : "N/A"}
                      </span>
                    </div>
                    {data?.variants &&
                      Object.keys(data.variants).length > 0 &&
                      Object.entries(data.variants).map(([key, value]) => (
                        <div key={key} className="flex flex-col">
                          <span className="text-[0.70rem] text-muted-foreground uppercase">
                            {key}
                          </span>
                          <span className="font-medium">{String(value)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              );
            }}
          />
          <Bar dataKey={selectedMetric} radius={4} isAnimationActive={false}>
            {filteredChartData.map(
              (
                entry: Run & {
                  variant: string;
                  variantDetails: string;
                  color: string;
                },
                index: number,
              ) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  className={`animate-bar opacity-0`}
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                />
              ),
            )}
            <LabelList
              position="top"
              offset={12}
              className="fill-foreground"
              fontSize={12}
              formatter={(value: number) =>
                value.toFixed(
                  Math.min(value.toString().split(".")[1]?.length || 0, 4),
                )
              }
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </UICell>
  );
};
