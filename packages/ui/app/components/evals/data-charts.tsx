"use client";

import {
  PATH_DELIMITER,
  formatFieldName,
  getValueAtPath,
} from "@reval/core/client";
import type { Run } from "@reval/core/types";
import { type Table } from "@tanstack/react-table";
import Palette from "iwanthue/palette";
import {
  ArrowDownWideNarrow,
  ArrowRightLeft,
  ArrowUpNarrowWide,
} from "lucide-react";
import prettyNum, { PRECISION_SETTING } from "pretty-num";
import { memo, useMemo, useState } from "react";
import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from "recharts";

import { Button } from "../ui/button";
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
  table: Table<Run>;
}

// Memoized chart component with smart re-rendering
const DataChartsComponent = ({ data, table }: DataChartsProps) => {
  const { chartData, numericKeys } = useMemo(() => {
    if (!data || data.length === 0) return { chartData: [], numericKeys: [] };

    // Get numeric keys from columns with number type that are currently visible
    const allNumericKeys = table
      .getVisibleLeafColumns()
      .filter((column) => column.columnDef.meta?.type === "number")
      .map((column) => column.columnDef.id)
      .filter((key): key is string => typeof key === "string");

    // Group runs by variant combinations
    const variantGroups = new Map<string, Run[]>();

    data.forEach((run: Run) => {
      const variantKey = run.variants
        ? Object.entries(run.variants as Record<string, unknown>)
            .map(([key, value]) => `${key}: ${value}`)
            .join(", ")
        : "No variants";

      if (!variantGroups.has(variantKey)) {
        variantGroups.set(variantKey, []);
      }
      variantGroups.get(variantKey)!.push(run);
    });

    // Get unique variant combinations for color palette
    const uniqueVariants = Array.from(variantGroups.keys());

    // Generate color palette for unique variants
    const palette = Palette.generateFromValues("variants", uniqueVariants, {
      defaultColor: "#fff",
    });

    // Create aggregated chart data
    const chartDataWithColors = Array.from(variantGroups.entries()).map(
      ([variantKey, runs], index) => {
        // Calculate mean values for each numeric metric
        const aggregatedMetrics: Record<string, number> = {};

        allNumericKeys.forEach((key) => {
          const values = runs
            .map((run) => {
              // Use shared utility function for nested object navigation
              const value = getValueAtPath(run as Record<string, unknown>, key);
              return typeof value === "number" ? value : null;
            })
            .filter((value): value is number => value !== null);

          if (values.length > 0) {
            aggregatedMetrics[key] =
              values.reduce((sum, val) => sum + val, 0) / values.length;
          }
        });

        // Use the first run's variants for display
        const firstRun = runs[0];

        return {
          ...aggregatedMetrics,
          variants: firstRun.variants,
          variant: `${variantKey} (${runs.length} runs)`,
          variantDetails: variantKey,
          color: palette.get(variantKey),
          runCount: runs.length,
        };
      },
    );

    return { chartData: chartDataWithColors, numericKeys: allNumericKeys };
  }, [data, table]);

  const [selectedMetric, setSelectedMetric] = useState<string>(
    `score${PATH_DELIMITER}accuracy${PATH_DELIMITER}value`,
  );
  const [sortByMetric, setSortByMetric] = useState<string>(
    `score${PATH_DELIMITER}accuracy${PATH_DELIMITER}value`,
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Filter chart data to only include values > 0 for the selected metric
  const filteredChartData = useMemo(() => {
    return chartData
      .filter((item) => {
        // For aggregated data, use direct property access since keys are flattened
        const metricValue = (item as Record<string, unknown>)[selectedMetric];
        return typeof metricValue === "number" && metricValue > 0;
      })
      .sort((a, b) => {
        const aValue = (a as Record<string, unknown>)[sortByMetric] as number;
        const bValue = (b as Record<string, unknown>)[sortByMetric] as number;
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      })
      .map((item) => ({
        ...item,
        sortValue: (item as Record<string, unknown>)[sortByMetric] as number,
      }));
  }, [chartData, selectedMetric, sortByMetric, sortDirection]);

  // Calculate Y-axis domain based on actual data values
  const yAxisDomain = useMemo(() => {
    if (filteredChartData.length === 0) return [0, 1];

    const values = filteredChartData
      .map((item) => {
        const value = (item as Record<string, unknown>)[selectedMetric];
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
        label: formatFieldName(selectedMetric),
        color: "hsl(var(--chart-1))",
      },
    };

    // Add each variant as a config entry with its unique color
    filteredChartData.forEach(
      (
        item: {
          sortValue: number;
          variants: unknown;
          variant: string;
          variantDetails: string;
          color: string;
          runCount: number;
        },
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

  if (filteredChartData.length === 0 || numericKeys.length === 0) {
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
                {formatFieldName(key)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            const temp = selectedMetric;
            setSelectedMetric(sortByMetric);
            setSortByMetric(temp);
          }}
        >
          <ArrowRightLeft className="h-4 w-4" />
        </Button>
        <div className="flex flex-col">
          <H5>Sort by </H5>
        </div>
        <Select value={sortByMetric} onValueChange={setSortByMetric}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {numericKeys.map((key) => (
              <SelectItem key={key} value={key}>
                {formatFieldName(key)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          // size="icon"
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
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
        >
          <YAxis
            domain={yAxisDomain}
            hide={false}
            width={60}
            tickFormatter={(value) =>
              prettyNum(value, {
                precision: 2,
                precisionSetting: PRECISION_SETTING.REDUCE_SIGNIFICANT,
              })
            }
          />
          <XAxis
            dataKey="sortValue"
            tickLine={true}
            tickMargin={10}
            axisLine={true}
            hide={false}
            tickFormatter={(value) =>
              prettyNum(value, {
                precision: 2,
                precisionSetting: PRECISION_SETTING.REDUCE_SIGNIFICANT,
              })
            }
          />
          <ChartTooltip
            cursor={false}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const data = payload[0]?.payload;
              const metricValue = (data as Record<string, unknown>)[
                selectedMetric
              ];
              return (
                <div className="rounded-lg border bg-background p-2 shadow-md">
                  <div className="grid gap-2">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] text-muted-foreground uppercase">
                        {formatFieldName(selectedMetric)}
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
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] text-muted-foreground uppercase">
                        Runs
                      </span>
                      <span className="font-medium">{data?.runCount || 1}</span>
                    </div>
                  </div>
                </div>
              );
            }}
          />
          <Bar dataKey={selectedMetric} radius={4} isAnimationActive={false}>
            {filteredChartData.map(
              (
                entry: {
                  sortValue: number;
                  variants: unknown;
                  variant: string;
                  variantDetails: string;
                  color: string;
                  runCount: number;
                },
                index: number,
              ) => (
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
                  precision: 2,
                  precisionSetting: PRECISION_SETTING.REDUCE_SIGNIFICANT,
                })
              }
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </UICell>
  );
};

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
