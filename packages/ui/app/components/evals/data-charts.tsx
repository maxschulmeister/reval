"use client";

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
import { titleCase } from "text-title-case";
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
import { PATH_DELIMITER } from "./constants";

interface DataChartsProps {
  data: Run[];
  table: Table<Run>;
}

const getValueAtPath = (
  obj: Record<string, unknown>,
  path: string,
): unknown => {
  return path.split(PATH_DELIMITER).reduce((current: unknown, key: string) => {
    return (current as Record<string, unknown>)?.[key];
  }, obj);
};

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

    // Detect binary columns (columns with exactly 2 unique values)
    const binaryColumns: Record<string, { values: unknown[]; columnName: string }> = {};
    
    table.getVisibleLeafColumns().forEach((column) => {
      const columnId = column.columnDef.id;
      if (!columnId || allNumericKeys.includes(columnId)) return;
      
      const uniqueValues = Array.from(
        new Set(
          data.map((run) => {
            const value = getValueAtPath(run as Record<string, unknown>, columnId);
            return value;
          }).filter((value) => value !== null && value !== undefined)
        )
      );
      
      if (uniqueValues.length === 2) {
        const columnHeader = column.columnDef.header as string || columnId;
        binaryColumns[columnId] = {
          values: uniqueValues,
          columnName: columnHeader
        };
      }
    });

    // Generate binary rate metrics
    const binaryMetricKeys: string[] = [];
    Object.entries(binaryColumns).forEach(([columnId, { values, columnName }]) => {
      values.forEach((value) => {
        const metricKey = `${columnId}_${String(value)}_rate`;
        binaryMetricKeys.push(metricKey);
      });
    });

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

    // Group runs by variant combination for rate calculations
    const variantGroups: Record<string, Run[]> = {};
    data.forEach((run) => {
      const variantKey = run.variants
        ? Object.entries(run.variants as Record<string, unknown>)
            .map(([key, value]) => `${key}: ${value}`)
            .join(", ")
        : "No variants";
      
      if (!variantGroups[variantKey]) {
        variantGroups[variantKey] = [];
      }
      variantGroups[variantKey].push(run);
    });

    // Calculate binary rates for each variant group
    const variantBinaryRates: Record<string, Record<string, number>> = {};
    Object.entries(variantGroups).forEach(([variantKey, runs]) => {
      variantBinaryRates[variantKey] = {};
      
      Object.entries(binaryColumns).forEach(([columnId, { values }]) => {
        values.forEach((targetValue) => {
          const metricKey = `${columnId}_${String(targetValue)}_rate`;
          const matchingCount = runs.filter((run) => {
            const value = getValueAtPath(run as Record<string, unknown>, columnId);
            return value === targetValue;
          }).length;
          
          // Store as numeric value (0-100)
          variantBinaryRates[variantKey][metricKey] = (matchingCount / runs.length) * 100;
        });
      });
    });

    // Create chart data with colors, flattened metric values, and binary rates
    const chartDataWithColors = data.map((run: Run, index: number) => {
      const variantKey = run.variants
        ? Object.entries(run.variants as Record<string, unknown>)
            .map(([key, value]) => `${key}: ${value}`)
            .join(", ")
        : "No variants";

      // Add flattened metric values for chart access
      const flattenedMetrics: Record<string, unknown> = {};
      allNumericKeys.forEach((key) => {
        flattenedMetrics[key] = getValueAtPath(
          run as Record<string, unknown>,
          key,
        );
      });

      // Add binary rate metrics for this variant
      const binaryRates = variantBinaryRates[variantKey] || {};

      return {
        ...run,
        ...flattenedMetrics,
        ...binaryRates,
        variant: `Run ${index + 1}`,
        variantDetails: variantKey,
        color: palette.get(variantKey),
      };
    });

    // Combine numeric keys with binary metric keys
    const allKeys = [...allNumericKeys, ...binaryMetricKeys];

    return { chartData: chartDataWithColors, numericKeys: allKeys };
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
        const metricValue = getValueAtPath(
          item as Record<string, unknown>,
          selectedMetric,
        );
        return typeof metricValue === "number" && metricValue > 0;
      })
      .sort((a, b) => {
        const aValue = getValueAtPath(
          a as Record<string, unknown>,
          sortByMetric,
        ) as number;
        const bValue = getValueAtPath(
          b as Record<string, unknown>,
          sortByMetric,
        ) as number;
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      })
      .map((item, index) => ({
        ...item,
        sortValue: getValueAtPath(
          item as Record<string, unknown>,
          sortByMetric,
        ) as number,
      }));
  }, [chartData, selectedMetric, sortByMetric, sortDirection]);

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
    // Format metric label for chart config
    const getMetricLabel = (metric: string) => {
      if (metric.includes('_rate')) {
        const parts = metric.split('_');
        if (parts.length >= 3 && parts[parts.length - 1] === 'rate') {
          const columnName = parts.slice(0, -2).join('_');
          const value = parts[parts.length - 2];
          return `${titleCase(columnName.replace(PATH_DELIMITER, " "))} ${value} Rate`;
        }
      }
      return metric.charAt(0).toUpperCase() + metric.slice(1);
    };

    const config: ChartConfig = {
      [selectedMetric]: {
        label: getMetricLabel(selectedMetric),
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
            {numericKeys.map((key) => {
              // Format binary rate metric names
              if (key.includes('_rate')) {
                const parts = key.split('_');
                if (parts.length >= 3 && parts[parts.length - 1] === 'rate') {
                  const columnName = parts.slice(0, -2).join('_');
                  const value = parts[parts.length - 2];
                  return (
                    <SelectItem key={key} value={key}>
                      {titleCase(columnName.replace(PATH_DELIMITER, " "))} {value} Rate
                    </SelectItem>
                  );
                }
              }
              // Default formatting for regular numeric keys
              return (
                <SelectItem key={key} value={key}>
                  {titleCase(key.replace(PATH_DELIMITER, " "))}
                </SelectItem>
              );
            })}
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
            {numericKeys.map((key) => {
              // Format binary rate metric names
              if (key.includes('_rate')) {
                const parts = key.split('_');
                if (parts.length >= 3 && parts[parts.length - 1] === 'rate') {
                  const columnName = parts.slice(0, -2).join('_');
                  const value = parts[parts.length - 2];
                  return (
                    <SelectItem key={key} value={key}>
                      {titleCase(columnName.replace(PATH_DELIMITER, " "))} {value} Rate
                    </SelectItem>
                  );
                }
              }
              // Default formatting for regular numeric keys
              return (
                <SelectItem key={key} value={key}>
                  {titleCase(key.replace(PATH_DELIMITER, " "))}
                </SelectItem>
              );
            })}
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
              const metricValue = getValueAtPath(
                data as Record<string, unknown>,
                selectedMetric,
              );
              return (
                <div className="rounded-lg border bg-background p-2 shadow-md">
                  <div className="grid gap-2">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] text-muted-foreground uppercase">
                        {(() => {
                          // Format binary rate metric names in tooltip
                          if (selectedMetric.includes('_rate')) {
                            const parts = selectedMetric.split('_');
                            if (parts.length >= 3 && parts[parts.length - 1] === 'rate') {
                              const columnName = parts.slice(0, -2).join('_');
                              const value = parts[parts.length - 2];
                              return `${titleCase(columnName.replace(PATH_DELIMITER, " "))} ${value} Rate`;
                            }
                          }
                          return selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1);
                        })()}
                      </span>
                      <span className="font-bold text-muted-foreground">
                        {typeof metricValue === "number"
                          ? `${metricValue.toFixed(1)}${selectedMetric.includes('_rate') ? '%' : ''}`
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
                <Cell key={`cell-${index}`} fill={entry.color} />
              ),
            )}
            <LabelList
              position="top"
              offset={12}
              className="fill-foreground"
              fontSize={12}
              formatter={(value: number) => {
                if (selectedMetric.includes('_rate')) {
                  return `${value.toFixed(1)}%`;
                }
                return prettyNum(value, {
                  precision: 2,
                  precisionSetting: PRECISION_SETTING.REDUCE_SIGNIFICANT,
                });
              }}
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
