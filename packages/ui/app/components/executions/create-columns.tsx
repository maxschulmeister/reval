"use client";

import type { Execution } from "@reval/core/types";
import { Status } from "@reval/core/types";
import { getObjectPaths, isObject, getValueByPath } from "@reval/core/client";
import "@tanstack/react-table";
import type {
  AccessorKeyColumnDef,
  ColumnDef,
  RowData,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp } from "lucide-react";
import { titleCase } from "text-title-case";
import { Button } from "../ui/button";

export type ColumnMetaType =
  | "json"
  | "status"
  | "number"
  | "string"
  | "boolean"
  | "";

declare module "@tanstack/react-table" {
  export interface ColumnMeta<TData extends RowData, TValue = unknown> {
    type: ColumnMetaType;
  }
}

// Column configuration
const COLUMN_ORDER = [
  "features",
  "variant",
  "target",
  "result",
  "time",
  "retries",
  "status",
] as const;

/**
 * Creates a basic column definition
 */
const createColumn = (
  key: string,
  title: string,
): AccessorKeyColumnDef<Execution> => ({
  accessorKey: key,
  id: title,
  header: ({ column }) => {
    return (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0! text-sm font-medium hover:bg-transparent"
      >
        {titleCase(title)}
        {column.getIsSorted() === "asc" ? (
          <ArrowUp className="size-3 text-accent-foreground" />
        ) : column.getIsSorted() === "desc" ? (
          <ArrowDown className="size-3 text-accent-foreground" />
        ) : (
          <ArrowDown className="size-3" />
        )}
      </Button>
    );
  },
});

/**
 * Validates that all Executions have consistent structure
 */
const validateExecutions = (executions: Execution[]): void => {
  if (executions.length === 0) return;

  const referenceKeys = Object.keys(executions[0]).sort();

  const hasConsistentStructure = executions.every((execution) => {
    const currentKeys = Object.keys(execution).sort();
    return (
      currentKeys.length === referenceKeys.length &&
      currentKeys.every((key, index) => key === referenceKeys[index])
    );
  });

  if (!hasConsistentStructure) {
    throw new Error("All Executions must have the same keys");
  }
};

/**
 * Sorts columns according to predefined order
 */
const sortColumns = (
  columns: AccessorKeyColumnDef<Execution>[],
): AccessorKeyColumnDef<Execution>[] => {
  return columns.sort((a, b) => {
    const aIndex = COLUMN_ORDER.indexOf(
      a.accessorKey as (typeof COLUMN_ORDER)[number],
    );
    const bIndex = COLUMN_ORDER.indexOf(
      b.accessorKey as (typeof COLUMN_ORDER)[number],
    );

    // Put specified columns first in the defined order
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;

    // For columns not in the specified order, maintain alphabetical order
    return String(a.accessorKey).localeCompare(String(b.accessorKey));
  });
};

/**
 * Expands object columns into separate columns for each property (supports infinite nesting)
 */
const expandObjectColumns = (
  columns: AccessorKeyColumnDef<Execution>[],
  executions: Execution[],
): AccessorKeyColumnDef<Execution>[] => {
  if (executions.length === 0) return columns;

  return columns.flatMap((column) => {
    const sampleValue = executions[0][column.accessorKey as keyof Execution];
    
    if (isObject(sampleValue)) {
      // Use the core utility to get object paths
      const paths = getObjectPaths(sampleValue, String(column.accessorKey));
      return paths.map((pathObj) => createColumn(pathObj.path, pathObj.title));
    }
    
    return [column];
  });
};

/**
 * Generates column definitions for execution data table
 */
export const createColumns = (
  executions: Execution[],
): ColumnDef<Execution>[] => {
  if (executions.length === 0) return [];

  // Validate data structure consistency
  validateExecutions(executions);

  // Create base columns
  const baseColumns = COLUMN_ORDER.map((key) => createColumn(key, key));

  // Sort columns according to predefined order
  const sortedColumns = sortColumns(baseColumns);

  // Expand object columns into individual property columns
  const expandedColumns = expandObjectColumns(sortedColumns, executions);

  // Classify columns
  expandedColumns.forEach((column) => {
    const sampleValue = getValueByPath(
      executions[0] as Record<string, unknown>, 
      String(column.accessorKey)
    );
    let type: ColumnMetaType = "";
    if (typeof sampleValue === "string") {
      type = "string";
      try {
        JSON.parse(sampleValue);
        type = "json";
      } catch {
        // Not JSON, keep as string
      }
      if (isStatus(sampleValue)) {
        type = "status";
      }
    }
    if (typeof sampleValue === "number") {
      type = "number";
    }
    if (typeof sampleValue === "boolean") {
      type = "boolean";
    }

    column.meta = { type };
  });

  return expandedColumns;
};

export const isStatus = (value: unknown): value is Status => {
  return Object.values(Status).includes(value as Status);
};
