"use client";

import { CodeDialog } from "@/app/components/code-dialog";
import { Button } from "@/app/components/ui/button";
import type { Execution } from "@reval/core";
import { Column, ColumnDef } from "@tanstack/react-table";
import { Cell } from "./cell";
import { SortableHeader } from "./sortable-header";
import { StatusBadge } from "./status-badge";

const renderCollapsibleContent = (
  content: unknown,
  type: "target" | "prediction"
) => {
  const contentStr =
    typeof content === "string" ? content : JSON.stringify(content, null, 2);

  return (
    <div className="flex items-center gap-2 w-full">
      <span className="flex-1 truncate text-xs text-muted-foreground">
        {contentStr}
      </span>
      <CodeDialog
        title={`${type} Content`}
        content={contentStr}
        trigger={
          <Button
            variant="outline"
            size="sm"
            className="text-xs rounded-radius border-border shadow-none hover:bg-accent hover:text-accent-foreground flex-shrink-0"
          >
            View
          </Button>
        }
      />
    </div>
  );
};

export const createColumns = (
  featureColumns: string[],
  variantKeys: string[]
): ColumnDef<Execution>[] => [
  // Feature columns
  ...featureColumns.map((col) => ({
    accessorFn: (row: Execution) => {
      if (Array.isArray(row.features)) {
        const index = parseInt(col.replace("feature_", ""));
        return row.features[index] ?? "";
      } else if (row.features && typeof row.features === "object") {
        return (row.features as Record<string, unknown>)[col] ?? "";
      }
      return row.features ?? "";
    },
    id: `features.${col}`,
    header: ({ column }: { column: Column<Execution, unknown> }) => (
      <SortableHeader column={column} title={`Feature: ${col}`} />
    ),
    cell: ({ getValue }: { getValue: () => unknown }) => (
      <Cell className="whitespace-nowrap">
        {String(getValue())}
      </Cell>
    ),
  })),
  // Variant columns
  ...variantKeys.map((variantKey) => ({
    accessorFn: (row: Execution) =>
      String(row.variant?.[variantKey as keyof typeof row.variant] ?? ""),
    id: `variant.${variantKey}`,
    header: ({ column }: { column: Column<Execution, unknown> }) => (
      <SortableHeader column={column} title={`Variant: ${variantKey}`} />
    ),
    cell: ({ getValue }: { getValue: () => unknown }) => (
      <Cell className="whitespace-nowrap">
        {String(getValue())}
      </Cell>
    ),
  })),
  // Target column
  {
    accessorKey: "target",
    header: ({ column }) => (
      <SortableHeader column={column} title="Target" />
    ),
    cell: ({ row }) => (
      <Cell className="min-w-0">
        {renderCollapsibleContent(row.getValue("target"), "target")}
      </Cell>
    ),
  },
  // Prediction column
  {
    accessorKey: "result",
    header: ({ column }) => (
      <SortableHeader column={column} title="Prediction" />
    ),
    cell: ({ row }) => (
      <Cell className="min-w-0">
        {renderCollapsibleContent(row.getValue("result"), "prediction")}
      </Cell>
    ),
  },
  // Time column
  {
    accessorKey: "time",
    header: ({ column }) => (
      <SortableHeader column={column} title="Time" />
    ),
    cell: ({ row }) => (
      <Cell className="whitespace-nowrap">
        {row.getValue("time")}ms
      </Cell>
    ),
  },
  // Retries column
  {
    accessorKey: "retries",
    header: ({ column }) => (
      <SortableHeader column={column} title="Retries" />
    ),
    cell: ({ row }) => (
      <Cell className="whitespace-nowrap">
        {row.getValue("retries")}
      </Cell>
    ),
  },
  // Status column
  {
    accessorKey: "status",
    header: ({ column }) => (
      <SortableHeader column={column} title="Status" />
    ),
    cell: ({ row }) => (
      <Cell>
        <StatusBadge status={row.getValue("status") as string} />
      </Cell>
    ),
  },
];
