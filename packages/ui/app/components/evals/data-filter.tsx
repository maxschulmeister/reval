"use client";

import type { Eval } from "@reval/core/types";
import { ColumnDef } from "@tanstack/react-table";
import { memo, useMemo } from "react";
import { Cell } from "../ui/cell";
import { MultiSelect } from "../ui/multi-select";
import { H5 } from "../ui/typography";
import { HIDDEN_COLUMNS, PATH_DELIMITER } from "./constants";

type FilterConfig = {
  columnId: string;
  options: { label: string; value: string }[];
  selected: string[];
};

interface DataFilterProps<TData> {
  data: TData[];
  eval: Eval;
  columns: ColumnDef<TData, unknown>[];
  columnFilters: Record<string, string[]>;
  onFilterChange: (columnId: string, values: string[]) => void;
  columnVisibilityToggle?: React.ReactNode;
}

const DataFilterComponent = <TData,>({
  data,
  columns,
  eval: evalData,
  columnFilters,
  onFilterChange,
  columnVisibilityToggle,
}: DataFilterProps<TData>) => {
  // Calculate filter eligibility based on data-to-variant ratio
  const shouldCreateFilter = useMemo(
    () => (uniqueValues: number, columnType: string) => {
      // String columns: filter is useful when each variant has enough data points
      // Rule: Each variant should represent at least 2-3 data points on average
      // This ensures filtering actually groups meaningful amounts of data
      const runsCount = data.length;
      const featuresCount = columns.filter((column) =>
        column.id?.startsWith(`features${PATH_DELIMITER}`),
      ).length;

      // NOTE: not sure if this is flawed,
      // but for now we dont want to create filter where the uniqueValues matches exactly the amount of original data
      // (not data.length as this is already cartesian products)
      if (uniqueValues === runsCount / (runsCount / featuresCount)) {
        return false;
      }
      return uniqueValues >= 2 && uniqueValues < runsCount / featuresCount;
    },
    [data.length, columns],
  );

  // Memoize the nested value getter function
  const getNestedValue = useMemo(
    () =>
      (obj: Record<string, unknown>, path: string): unknown => {
        return path
          .split(PATH_DELIMITER)
          .reduce(
            (current: unknown, key) =>
              (current as Record<string, unknown>)?.[key],
            obj,
          );
      },
    [],
  );

  // Generate filter configurations for columns with sufficient unique values
  const filterConfigs = useMemo(() => {
    if (!data.length) return [];

    const configs: FilterConfig[] = [];

    // Check each column for filter eligibility
    columns.forEach((column) => {
      const columnId = column.id as string;
      const type = column.meta?.type;
      if (
        !columnId ||
        (type !== "string" && type !== "status") ||
        (HIDDEN_COLUMNS as readonly string[]).includes(columnId)
      )
        return;

      // Get all unique values for this column
      const values = data
        .map((row) => {
          const value = getNestedValue(
            row as Record<string, unknown>,
            columnId,
          );
          return String(value ?? "");
        })
        .filter(Boolean);

      const uniqueValues = [...new Set(values)];

      // Only create filter if it provides meaningful filtering capability
      if (shouldCreateFilter(uniqueValues.length, type || "string")) {
        configs.push({
          columnId: columnId,
          options: uniqueValues.map((value) => ({
            label: value,
            value,
          })),
          selected: columnFilters[columnId] || [],
        });
      }
    });

    return configs;
  }, [data, columns, shouldCreateFilter, columnFilters, getNestedValue]);

  if (filterConfigs.length === 0) {
    // If no filters but we have a column visibility toggle, show just the toggle
    if (columnVisibilityToggle) {
      return (
        <Cell>
          <div className="flex items-center justify-between">
            <H5 as="h4">Filters</H5>
            {columnVisibilityToggle}
          </div>
        </Cell>
      );
    }
    return null;
  }

  return (
    <Cell>
      <div className="flex items-center justify-between">
        <H5 as="h4">Filters</H5>
      </div>
      <div className="flex grow flex-wrap items-center gap-4 py-4">
        {filterConfigs.map((config) => (
          <div key={config.columnId} className="flex items-center gap-2">
            <MultiSelect
              options={config.options}
              selected={config.selected}
              onChange={(values) => onFilterChange(config.columnId, values)}
              placeholder={`Filter by ${config.columnId.replace(PATH_DELIMITER, " ")}`}
            />
          </div>
        ))}
      </div>
      <div>{columnVisibilityToggle}</div>
    </Cell>
  );
};

// Memoized DataFilter with smart comparison
export const DataFilter = memo(DataFilterComponent, (prevProps, nextProps) => {
  // Re-render if data length, columns, or filters changed
  return (
    prevProps.data.length === nextProps.data.length &&
    prevProps.columns.length === nextProps.columns.length &&
    JSON.stringify(prevProps.columnFilters) ===
      JSON.stringify(nextProps.columnFilters)
  );
}) as <TData>(props: DataFilterProps<TData>) => React.ReactElement | null;

// Helper function to filter data based on selected filters
export const filterData = <TData,>(
  data: TData[],
  columnFilters: Record<string, string[]>,
): TData[] => {
  const hasActiveFilters = Object.values(columnFilters).some(
    (filters) => filters.length > 0,
  );

  if (!hasActiveFilters) {
    return data;
  }

  // Pre-compile filter entries for better performance
  const activeFilters = Object.entries(columnFilters).filter(
    ([, selectedValues]) => selectedValues.length > 0,
  );

  if (activeFilters.length === 0) {
    return data;
  }

  // Memoize the nested value getter to avoid recreating it
  const getNestedValue = (
    obj: Record<string, unknown>,
    path: string,
  ): unknown => {
    return path
      .split(PATH_DELIMITER)
      .reduce(
        (current: unknown, key) => (current as Record<string, unknown>)?.[key],
        obj,
      );
  };

  return data.filter((row) => {
    return activeFilters.every(([columnId, selectedValues]) => {
      const cellValue = String(
        getNestedValue(row as Record<string, unknown>, columnId) ?? "",
      );
      return selectedValues.includes(cellValue);
    });
  });
};
