"use client";

import type { Execution, Run } from "@reval/core/src/types";
import { createColumns } from "./data-table/columns";
import { DataTable } from "./data-table/data-table";

interface RunDataTableProps {
  run: Run;
  sortedExecutions: Execution[];
  variantFilters: Record<string, string[]>;
  statusFilter: string[];
  onVariantFilterChange: (variantKey: string, values: string[]) => void;
  onStatusFilterChange: (values: string[]) => void;
  getUniqueVariantValues: (variantKey: string) => string[];
  getUniqueStatusValues: () => string[];
}

export const RunDataTable = ({
  run,
  sortedExecutions,
  variantFilters,
  statusFilter,
  onVariantFilterChange,
  onStatusFilterChange,
  getUniqueVariantValues,
  getUniqueStatusValues,
}: RunDataTableProps) => {
  // Get dynamic feature columns
  const getFeatureColumns = (): string[] => {
    if (!sortedExecutions.length) return [];
    const firstExecution = sortedExecutions[0];
    if (Array.isArray(firstExecution.features)) {
      return firstExecution.features.map(
        (_: unknown, index: number) => `feature_${index}`,
      );
    }
    if (
      typeof firstExecution.features === "object" &&
      firstExecution.features
    ) {
      return Object.keys(firstExecution.features);
    }
    return ["features"];
  };

  return (
    <div className="mt-8">
      <DataTable
        columns={createColumns(
          getFeatureColumns(),
          Object.keys(run.variants || {}),
        )}
        data={sortedExecutions}
        variantFilters={variantFilters}
        onVariantFilterChange={onVariantFilterChange}
        statusFilter={statusFilter}
        onStatusFilterChange={onStatusFilterChange}
        getUniqueVariantValues={getUniqueVariantValues}
        getUniqueStatusValues={getUniqueStatusValues}
        variantKeys={Object.keys(run.variants || {})}
      />
    </div>
  );
};
