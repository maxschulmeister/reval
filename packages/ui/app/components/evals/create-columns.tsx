"use client";

import type { Run } from "@reval/core/types";
import { Status } from "@reval/core/types";
import "@tanstack/react-table";
import type {
  AccessorKeyColumnDef,
  Column,
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

const COLUMN_ORDER = [
  "features",
  "variants",
  "target",
  "result",
  "accuracy",
  "time",
  "retries",
  "status",
] as const;

const createSortableHeader = (title: string) => {
  const SortableHeader = ({ column }: { column: Column<Run, unknown> }) => (
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
  SortableHeader.displayName = `SortableHeader-${title}`;
  return SortableHeader;
};

const getValueAtPath = (
  obj: Record<string, unknown>,
  path: string,
): unknown => {
  return path.split(".").reduce(
    (current: Record<string, unknown> | unknown, key: string) => {
      return (current as Record<string, unknown>)?.[key];
    },
    obj as Record<string, unknown> | unknown,
  );
};

const getColumnOrder = (accessorKey: string): number => {
  // First check for exact match
  const exactIndex = COLUMN_ORDER.indexOf(
    accessorKey as (typeof COLUMN_ORDER)[number],
  );
  if (exactIndex !== -1) return exactIndex;

  // Then check if accessorKey starts with any base column name
  for (let i = 0; i < COLUMN_ORDER.length; i++) {
    if (accessorKey.startsWith(COLUMN_ORDER[i] + ".")) {
      return i;
    }
  }

  return 999; // Put unknown columns at the end
};

const getColumnType = (value: unknown): ColumnMetaType => {
  if (typeof value === "string") {
    if (isStatus(value)) return "status";
    return "string";
  }
  if (typeof value === "object" || typeof value === "function") return "json";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";

  return "string";
};

// Column expansion configuration
// By default, no columns are expanded (depth 0)
// Only explicitly configured columns will be expanded
const COLUMN_EXPANSION_CONFIG = {
  result: 1, // Expand only first level
  features: -1, // Expand infinitely
  variants: -1, // Expand infinitely
} as const;

const flattenObject = (
  obj: Record<string, unknown>,
  prefix = "",
  maxDepth = 0, // Default to no expansion
  currentDepth = 0,
): string[] => {
  return Object.keys(obj).flatMap((key) => {
    const path = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];

    // Get expansion depth for this column (use root key for nested paths)
    const rootKey = prefix ? prefix.split(".")[0] : key;
    const configuredDepth =
      COLUMN_EXPANSION_CONFIG[
        rootKey as keyof typeof COLUMN_EXPANSION_CONFIG
      ] ?? 0;
    const effectiveMaxDepth = maxDepth === 0 ? configuredDepth : maxDepth;

    // Check if we should stop expanding
    const shouldStopExpanding =
      effectiveMaxDepth !== -1 && currentDepth >= effectiveMaxDepth;

    if (shouldStopExpanding || !isObject(value)) {
      return [path];
    }

    return flattenObject(value, path, effectiveMaxDepth, currentDepth + 1);
  });
};

const createColumn = (
  accessorKey: string,
  runs: Run[],
): AccessorKeyColumnDef<Run> => {
  const sampleValue = getValueAtPath(runs[0], accessorKey);
  const title = accessorKey.includes(".")
    ? accessorKey.split(".").slice(1).join(" ")
    : accessorKey;

  return {
    accessorKey,
    id: accessorKey,
    header: createSortableHeader(title),
    meta: { type: getColumnType(sampleValue) },
  };
};

export const createColumns = (runs: Run[]): AccessorKeyColumnDef<Run>[] => {
  if (runs.length === 0) return [];

  // Get all possible column paths by flattening the first run
  const allPaths = flattenObject(runs[0] as Record<string, unknown>);

  // Create columns for all paths (including hidden ones) and sort by predefined order
  return allPaths
    .map((path) => createColumn(path, runs))
    .sort((a, b) => {
      const orderA = getColumnOrder(a.accessorKey);
      const orderB = getColumnOrder(b.accessorKey);
      if (orderA !== orderB) return orderA - orderB;
      return a.accessorKey.localeCompare(b.accessorKey);
    });
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  Object.prototype.toString.call(value) === "[object Object]";

const isJson = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
};

const isStatus = (value: unknown): value is Status =>
  typeof value === "string" && ["success", "error"].includes(value);

// Export only what's needed externally
export { isJson, isObject, isStatus };
