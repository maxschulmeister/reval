import type { Run } from "@reval/core/types";
import type { Table } from "@tanstack/react-table";

export interface BaseChartProps {
  data: Run[];
  table: Table<Run>;
}

export interface ChartDataItem {
  [key: string]: unknown;
  color: string;
  runCount: number;
}

export interface VariantChartDataItem extends ChartDataItem {
  variants: unknown;
  variant: string;
  variantDetails: string;
  sortValue: number;
}

export interface AccuracyChartDataItem extends ChartDataItem {
  accuracyKey: string;
  accuracyKeyDetails: string;
  averageValue: number;
  successRate: number;
  errorRate: number;
  totalRuns: number;
  successCount: number;
  errorCount: number;
}

export type SortDirection = "asc" | "desc";

export type AccuracyDisplayMode = "success_rate" | "error_rate";
