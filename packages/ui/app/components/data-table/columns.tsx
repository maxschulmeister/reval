"use client";

import { CodeDialog } from "@/app/components/code-dialog";
import { Button } from "@/app/components/ui/button";
import type { Execution } from "@reval/core";
import { Column, ColumnDef } from "@tanstack/react-table";
import { titleCase } from "text-title-case";
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
      <div className="w-full min-h-4 relative">
        <span className="absolute w-full inset-0 truncate">{contentStr}</span>
      </div>
      {/* <span className="truncate w-auto flex-1">{contentStr}</span> */}
      <CodeDialog
        title={`${type} Content`}
        content={contentStr}
        trigger={
          <Button variant="outline" size="sm">
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
      <SortableHeader column={column} title={`${titleCase(col)}`} />
    ),
    cell: ({ getValue }: { getValue: () => unknown }) => (
      <div className="whitespace-nowrap">{String(getValue())}</div>
    ),
  })),
  // Variant columns
  ...variantKeys.map((variantKey) => ({
    accessorFn: (row: Execution) =>
      String(row.variant?.[variantKey as keyof typeof row.variant] ?? ""),
    id: `variant.${variantKey}`,
    header: ({ column }: { column: Column<Execution, unknown> }) => (
      <SortableHeader column={column} title={`${titleCase(variantKey)}`} />
    ),
    cell: ({ getValue }: { getValue: () => unknown }) => (
      <div className="whitespace-nowrap">{String(getValue())}</div>
    ),
  })),
  // Target column
  {
    accessorKey: "target",
    header: ({ column }) => <SortableHeader column={column} title="Target" />,
    cell: ({ row }) => (
      <div className="min-w-0">
        {renderCollapsibleContent(row.getValue("target"), "target")}
      </div>
    ),
  },
  // Prediction column
  {
    accessorKey: "result",
    header: ({ column }) => (
      <SortableHeader column={column} title="Prediction" />
    ),
    cell: ({ row }) => (
      <div className="min-w-0">
        {renderCollapsibleContent(row.getValue("result"), "prediction")}
      </div>
    ),
  },
  // Time column
  {
    accessorKey: "time",
    header: ({ column }) => <SortableHeader column={column} title="Time" />,
    cell: ({ row }) => (
      <div className="whitespace-nowrap">{row.getValue("time")}ms</div>
    ),
  },
  // Retries column
  {
    accessorKey: "retries",
    header: ({ column }) => <SortableHeader column={column} title="Retries" />,
    cell: ({ row }) => (
      <div className="whitespace-nowrap">{row.getValue("retries")}</div>
    ),
  },
  // Status column
  {
    accessorKey: "status",
    header: ({ column }) => <SortableHeader column={column} title="Status" />,
    cell: ({ row }) => (
      <div>
        <StatusBadge status={row.getValue("status") as string} />
      </div>
    ),
  },
];
