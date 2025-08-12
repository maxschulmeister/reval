"use client";

import type { Run } from "@reval/core/types";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { Cell } from "../ui/cell";
import { MultiSelect } from "../ui/multi-select";
import { H5 } from "../ui/typography";

type FilterConfig = {
  columnId: string;
  options: { label: string; value: string }[];
  selected: string[];
};

interface DataFilterProps<TData> {
  data: TData[];
  run: Run;
  columns: ColumnDef<TData, unknown>[];
  columnFilters: Record<string, string[]>;
  onFilterChange: (columnId: string, values: string[]) => void;
}

export const DataFilter = <TData,>({
  data,
  columns,
  run,
  columnFilters,
  onFilterChange,
}: DataFilterProps<TData>) => {
  const uniquenessThreshold = Array.isArray(run.variants)
    ? run.variants.length
    : Object.values(run.variants as Record<string, string[]>).flat().length;

  // Generate filter configurations for columns with sufficient unique values
  const filterConfigs = useMemo(() => {
    if (!data.length) return [];

    const configs: FilterConfig[] = [];

    // Helper function to get nested value from object
    const getNestedValue = (
      obj: Record<string, unknown>,
      path: string,
    ): unknown => {
      return path
        .split(".")
        .reduce(
          (current: unknown, key) =>
            (current as Record<string, unknown>)?.[key],
          obj,
        );
    };

    // Check each column for filter eligibility
    columns.forEach((column) => {
      const accessorKey = (column as { accessorKey?: string }).accessorKey;
      const type = column.meta?.type;
      if (!accessorKey || (type !== "string" && type !== "status")) return;
      // Get all unique values for this column
      const values = data
        .map((row) => {
          const value = getNestedValue(
            row as Record<string, unknown>,
            accessorKey,
          );
          return String(value ?? "");
        })
        .filter(Boolean);

      const uniqueValues = [...new Set(values)];

      // Only create filter if unique values are equal to or exceed threshold
      if (
        (uniqueValues.length >= uniquenessThreshold && type === "string") ||
        (type === "status" && uniqueValues.length >= 2)
      ) {
        configs.push({
          columnId: accessorKey,
          options: uniqueValues.map((value) => ({ label: value, value })),
          selected: columnFilters[accessorKey] || [],
        });
      }
    });

    return configs;
  }, [data, columns, uniquenessThreshold, columnFilters]);

  if (filterConfigs.length === 0) {
    return null;
  }

  return (
    <Cell>
      <H5 as="h4">Filters</H5>
      <div className="flex flex-wrap items-center gap-4 py-4">
        {filterConfigs.map((config) => (
          <div key={config.columnId} className="flex items-center gap-2">
            <MultiSelect
              options={config.options}
              selected={config.selected}
              onChange={(values) => onFilterChange(config.columnId, values)}
              placeholder={`Filter by ${config.columnId.replace(".", " ")}`}
            />
          </div>
        ))}
      </div>
    </Cell>
  );
};

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

  return data.filter((row) => {
    return Object.entries(columnFilters).every(([columnId, selectedValues]) => {
      if (selectedValues.length === 0) return true;

      const getNestedValue = (
        obj: Record<string, unknown>,
        path: string,
      ): unknown => {
        return path
          .split(".")
          .reduce(
            (current: unknown, key) =>
              (current as Record<string, unknown>)?.[key],
            obj,
          );
      };

      const cellValue = String(
        getNestedValue(row as Record<string, unknown>, columnId) ?? "",
      );
      return selectedValues.includes(cellValue);
    });
  });
};
