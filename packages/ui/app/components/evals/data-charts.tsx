"use client";

import type { Reval } from "@reval/core/types";
import Palette from "iwanthue/palette";
import { useMemo, useState } from "react";
import { Bar, BarChart, Cell, LabelList, XAxis } from "recharts";
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

export const DataCharts = ({ eval: evalData, runs }: Reval) => {
  const { chartData, numericKeys } = useMemo(() => {
    if (!runs || runs.length === 0) return { chartData: [], numericKeys: [] };

    // Get numeric keys from the first run
    const allNumericKeys =
      runs.length > 0
        ? Object.keys(runs[0]).filter((key) => {
            // use only numeric values or array where first item is numeric
            const value = runs[0][key as keyof (typeof runs)[0]];
            return (
              typeof value === "number" ||
              (Array.isArray(value) && typeof value[0] === "number")
            );
          })
        : [];

    // Get unique variant combinations
    const uniqueVariants = Array.from(
      new Set(
        runs.map((run) =>
          run.variants
            ? Object.entries(run.variants as Record<string, unknown>)
                .map(([key, value]) => `${key}: ${value}`)
                .join(", ")
            : "No variants",
        ),
      ),
    );

    // Generate color palette
    const palette = Palette.generateFromValues("variants", uniqueVariants, {
      defaultColor: "#fff",
      colorSpace: [0, 360, 0, 30, 70, 100],
    });

    // Create chart data with colors
    const data = runs.map((run, index) => {
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

    return { chartData: data, numericKeys: allNumericKeys };
  }, [runs]);

  const [selectedMetric, setSelectedMetric] = useState<string>("accuracy");

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {
      [selectedMetric]: {
        label: selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1),
        color: "hsl(var(--chart-1))",
      },
    };

    // Add each variant as a config entry with its unique color
    chartData.forEach((item, index) => {
      config[`variant${index}`] = {
        label: item.variantDetails,
        color: item.color,
      };
    });

    return config;
  }, [chartData, selectedMetric]);

  if (chartData.length <= 1 || numericKeys.length === 0) {
    return;
  }

  return (
    <UICell className="flex-col items-start gap-4">
      <div className="flex items-center gap-4">
        <H5>Variants by </H5>
        <Select value={selectedMetric} onValueChange={setSelectedMetric}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {numericKeys.map((key) => (
              <SelectItem key={key} value={key}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <ChartContainer config={chartConfig} className="h-[50vh] w-full">
        <BarChart
          accessibilityLayer
          data={chartData}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
        >
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
              return (
                <div className="rounded-lg border bg-background p-2 shadow-md">
                  <div className="grid gap-2">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] text-muted-foreground uppercase">
                        {selectedMetric.charAt(0).toUpperCase() +
                          selectedMetric.slice(1)}
                      </span>
                      <span className="font-bold text-muted-foreground">
                        {data?.[selectedMetric]?.toFixed(3) || "N/A"}
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
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                className={`animate-bar opacity-0`}
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              />
            ))}
            <LabelList
              position="top"
              offset={12}
              className="fill-foreground"
              fontSize={12}
              formatter={(value: number) => value.toFixed(2)}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </UICell>
  );
};
