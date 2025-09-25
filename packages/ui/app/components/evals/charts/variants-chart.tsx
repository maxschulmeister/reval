"use client";

import { PATH_DELIMITER, formatFieldName } from "@reval/core/client";
import {
  ArrowDownWideNarrow,
  ArrowRightLeft,
  ArrowUpNarrowWide,
} from "lucide-react";
import prettyNum, { PRECISION_SETTING } from "pretty-num";
import { memo, useMemo, useState } from "react";
import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from "recharts";

import type {
  BaseChartProps,
  SortDirection,
  VariantChartDataItem,
} from "../../../lib/chart-types";
import {
  calculateYAxisDomain,
  generateVariantChartData,
  getNumericKeys,
} from "../../../lib/chart-utils";
import { Button } from "../../ui/button";
import { ChartConfig, ChartContainer, ChartTooltip } from "../../ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { H5 } from "../../ui/typography";

const VariantsChartComponent = ({ data, table }: BaseChartProps) => {
  const { chartData, numericKeys } = useMemo(() => {
    if (!data || data.length === 0) return { chartData: [], numericKeys: [] };

    const allNumericKeys = getNumericKeys(table);
    const variantChartData = generateVariantChartData(data, allNumericKeys);

    return { chartData: variantChartData, numericKeys: allNumericKeys };
  }, [data, table]);

  const [selectedMetric, setSelectedMetric] = useState<string>(
    `score${PATH_DELIMITER}accuracy${PATH_DELIMITER}score`,
  );
  const [sortByMetric, setSortByMetric] = useState<string>(
    `score${PATH_DELIMITER}accuracy${PATH_DELIMITER}score`,
  );
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

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
    return calculateYAxisDomain(filteredChartData, selectedMetric);
  }, [filteredChartData, selectedMetric]);

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {
      [selectedMetric]: {
        label: formatFieldName(selectedMetric),
        color: "hsl(var(--chart-1))",
      },
    };

    // Add each variant as a config entry with its unique color
    filteredChartData.forEach((item: VariantChartDataItem, index: number) => {
      config[`variant${index}`] = {
        label: item.variantDetails,
        color: item.color,
      };
    });

    return config;
  }, [filteredChartData, selectedMetric]);

  if (filteredChartData.length === 0 || numericKeys.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <H5>by </H5>
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
              const data = payload[0]?.payload as VariantChartDataItem;
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
                    typeof data.variants === "object" &&
                    data.variants !== null &&
                    Object.keys(data.variants as Record<string, unknown>)
                      .length > 0
                      ? Object.entries(
                          data.variants as Record<string, unknown>,
                        ).map(([key, value]) => (
                          <div key={key} className="flex flex-col">
                            <span className="text-[0.70rem] text-muted-foreground uppercase">
                              {key}
                            </span>
                            <span className="font-medium">{String(value)}</span>
                          </div>
                        ))
                      : null}
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
              (entry: VariantChartDataItem, index: number) => (
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
    </>
  );
};

// Smart re-rendering with memo and custom comparison
export const VariantsChart = memo(
  VariantsChartComponent,
  (prevProps, nextProps) => {
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
  },
);
