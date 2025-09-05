"use client";

import { cn } from "@/app/lib/utils";
import type { Run } from "@reval/core/types";
import type { Table } from "@tanstack/react-table";
import { Check, Columns3Cog } from "lucide-react";
import { memo } from "react";
import { Button } from "../ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

interface ColumnVisibilityToggleProps {
  table: Table<Run>;
}

const ColumnVisibilityToggleComponent = ({ table }: ColumnVisibilityToggleProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Columns3Cog />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="end">
        <Command>
          <CommandInput placeholder="Search columns..." />
          <CommandList>
            <CommandEmpty>No columns found.</CommandEmpty>
            <CommandGroup>
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <CommandItem
                      key={column.id}
                      onSelect={() =>
                        column.toggleVisibility(!column.getIsVisible())
                      }
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          column.getIsVisible() ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span className="capitalize">
                        {column.id.replace(/\./g, " ")}
                      </span>
                    </CommandItem>
                  );
                })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

// Memoized component to prevent unnecessary re-renders
export const ColumnVisibilityToggle = memo(ColumnVisibilityToggleComponent, (prevProps, nextProps) => {
  // Only re-render if the table columns or their visibility state changed
  const prevColumns = prevProps.table.getAllColumns();
  const nextColumns = nextProps.table.getAllColumns();
  
  if (prevColumns.length !== nextColumns.length) {
    return false; // Re-render if column count changed
  }
  
  // Check if any column visibility changed
  for (let i = 0; i < prevColumns.length; i++) {
    if (prevColumns[i].getIsVisible() !== nextColumns[i].getIsVisible()) {
      return false; // Re-render if visibility changed
    }
  }
  
  return true; // Don't re-render if nothing changed
});
