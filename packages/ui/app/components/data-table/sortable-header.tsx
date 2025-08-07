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
      className="h-auto p-0! text-sm font-medium hover:bg-transparent"
    >
      {title}
      {column.getIsSorted() === "asc" ? (
        <ArrowUp className="size-3 text-accent-foreground" />
      ) : column.getIsSorted() === "desc" ? (
        <ArrowDown className="size-3 text-accent-foreground" />
      ) : (
        <ArrowDown className="size-3" />
      )}
    </Button>
  );
};
