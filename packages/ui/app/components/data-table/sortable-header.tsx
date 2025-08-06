"use client";

import { Button } from "@/app/components/ui/button";
import type { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp } from "lucide-react";

interface SortableHeaderProps {
  column: Column<any, unknown>;
  title: string;
}

export const SortableHeader = ({ column, title }: SortableHeaderProps) => {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="h-auto p-0 text-muted-foreground text-xs uppercase tracking-wide"
    >
      {title}
      {column.getIsSorted() === "asc" ? (
        <ArrowUp className="ml-1 h-3 w-3 text-primary" />
      ) : column.getIsSorted() === "desc" ? (
        <ArrowDown className="ml-1 h-3 w-3 text-primary" />
      ) : (
        <ArrowDown className="ml-1 h-3 w-3" />
      )}
    </Button>
  );
};
