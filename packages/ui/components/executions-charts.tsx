"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Execution } from "@/lib/db";

interface ExecutionsChartsProps {
  executions: Execution[];
}

const COLORS = {
  success: "#10b981",
  error: "#ef4444",
};

export function ExecutionsCharts({ executions }: ExecutionsChartsProps) {
  const statusData = useMemo(() => {
    const statusCounts = executions.reduce(
      (acc, execution) => {
        acc[execution.status] = (acc[execution.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count,
      color: COLORS[status as keyof typeof COLORS] || "#6b7280",
    }));
  }, [executions]);

  const variantData = useMemo(() => {
    const variantTimes = executions.reduce(
      (acc, execution) => {
        const variantKey = JSON.stringify(execution.variant);
        if (!acc[variantKey]) {
          acc[variantKey] = {
            times: [],
            variant: variantKey,
          };
        }
        acc[variantKey].times.push(execution.time);
        return acc;
      },
      {} as Record<string, { times: number[]; variant: string }>
    );

    return (Object.values(variantTimes) as { variant: string; times: number[] }[]).map(({ variant, times }) => ({
      variant: variant.length > 20 ? variant.substring(0, 20) + "..." : variant,
      avgTime: Math.round(times.reduce((sum: number, time: number) => sum + time, 0) / times.length),
    }));
  }, [executions]);

  if (executions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Charts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            No execution data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center space-x-4 mt-4">
            {statusData.map((entry) => (
              <div key={entry.name} className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm capitalize">
                  {entry.name} ({entry.value})
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Execution Time by Variant */}
      {variantData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Avg Execution Time by Variant</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={variantData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="variant"
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis />
                <Tooltip
                  formatter={(value) => [`${value}ms`, "Avg Time"]}
                  labelFormatter={(label) => `Variant: ${label}`}
                />
                <Bar dataKey="avgTime" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}