"use client";

import { Button } from "@/components/ui/button";
import { Column, ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
// Removed unused dropdown menu imports
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Code from "react-shiki";

export type Execution = {
  id: string;
  runId: string;
  features: Record<string, unknown> | unknown[];
  target: Record<string, unknown> | string;
  result: Record<string, unknown> | string;
  time: number;
  retries: number;
  status: string;
  variant: Record<string, unknown>;
};

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
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="text-xs rounded-radius border-border shadow-none hover:bg-accent hover:text-accent-foreground flex-shrink-0"
          >
            View
          </Button>
        </DialogTrigger>
        <DialogContent className="w-full max-w-[60rem] shadow-none bg-background border-border rounded-radius">
          <DialogHeader>
            <DialogTitle className="capitalize text-foreground">
              {type} Content
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto">
            <Code
              language="typescript"
              theme="github-dark"
              className="max-w-full overflow-auto text-sm"
            >
              {contentStr}
            </Code>
          </div>
        </DialogContent>
      </Dialog>
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
    header: ({ column }: { column: Column<Execution, unknown> }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 text-muted-foreground text-xs uppercase tracking-wide hover:bg-transparent hover:text-primary"
        >
          Feature: {col}
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      );
    },
    cell: ({ getValue }: { getValue: () => unknown }) => (
      <div className="whitespace-nowrap text-sm text-card-foreground">
        {String(getValue())}
      </div>
    ),
  })),
  // Variant columns
  ...variantKeys.map((variantKey) => ({
    accessorFn: (row: Execution) => String(row.variant?.[variantKey] ?? ""),
    id: `variant.${variantKey}`,
    header: ({ column }: { column: Column<Execution, unknown> }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 text-muted-foreground text-xs uppercase tracking-wide hover:bg-transparent hover:text-primary"
        >
          Variant: {variantKey}
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      );
    },
    cell: ({ getValue }: { getValue: () => unknown }) => (
      <div className="whitespace-nowrap text-sm text-card-foreground">
        {String(getValue())}
      </div>
    ),
  })),
  // Target column
  {
    accessorKey: "target",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 text-muted-foreground text-xs uppercase tracking-wide hover:bg-transparent hover:text-primary"
        >
          Target
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="text-sm text-card-foreground min-w-0">
        {renderCollapsibleContent(row.getValue("target"), "target")}
      </div>
    ),
  },
  // Prediction column
  {
    accessorKey: "result",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 text-muted-foreground text-xs uppercase tracking-wide hover:bg-transparent hover:text-primary"
        >
          Prediction
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="text-sm text-card-foreground min-w-0">
        {renderCollapsibleContent(row.getValue("result"), "prediction")}
      </div>
    ),
  },
  // Time column
  {
    accessorKey: "time",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 text-muted-foreground text-xs uppercase tracking-wide hover:bg-transparent hover:text-primary"
        >
          Time
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="whitespace-nowrap text-sm text-card-foreground">
        {row.getValue("time")}ms
      </div>
    ),
  },
  // Retries column
  {
    accessorKey: "retries",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 text-muted-foreground text-xs uppercase tracking-wide hover:bg-transparent hover:text-primary"
        >
          Retries
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="whitespace-nowrap text-sm text-card-foreground">
        {row.getValue("retries")}
      </div>
    ),
  },
  // Status column
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 text-muted-foreground text-xs uppercase tracking-wide hover:bg-transparent hover:text-primary"
        >
          Status
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <span
          className={`px-2 py-0.5 rounded-radius ${
            status === "success"
              ? "bg-success/10 text-success border-success/20"
              : status === "failed"
              ? "bg-destructive/10 text-destructive border-destructive/20"
              : "bg-warning/10 text-warning border-warning/20"
          }`}
        >
          {status}
        </span>
      );
    },
  },
];
