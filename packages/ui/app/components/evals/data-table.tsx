"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import type { Reval } from "@reval/core/types";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import { ColumnVisibilityToggle } from "./column-visibility-toggle";
import { HIDDEN_COLUMNS } from "./constants";
import { createColumns } from "./create-columns";
import { DataCharts } from "./data-charts";
import { DataFilter, filterData } from "./data-filter";
import { FormattedCell } from "./formatted-cell";

export const DataTable = ({ eval: evalData, runs }: Reval) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>(
    {},
  );

  // Initialize column visibility with hidden columns set to false
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    () => {
      const initialVisibility: VisibilityState = {};
      HIDDEN_COLUMNS.forEach((columnId) => {
        initialVisibility[columnId] = false;
      });
      return initialVisibility;
    },
  );

  // Memoize column creation - only recreate when runs structure changes
  const columns = useMemo(() => {
    if (runs.length === 0) return [];
    return createColumns(runs);
  }, [runs]);

  // Memoize filtered data with optimized filtering
  const filteredData = useMemo(() => {
    const hasActiveFilters = Object.values(columnFilters).some(
      (filters) => filters.length > 0,
    );

    if (!hasActiveFilters) {
      return runs;
    }

    return filterData(runs, columnFilters);
  }, [runs, columnFilters]);

  // Memoize table configuration
  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnVisibility,
    },
  });

  // Memoize filter change handler
  const handleFilterChange = useCallback(
    (columnId: string, values: string[]) => {
      setColumnFilters((prev) => ({ ...prev, [columnId]: values }));
    },
    [],
  );

  return (
    <section className="mt-8">
      {/* Charts */}
      <DataCharts data={filteredData} table={table} />

      {/* Dynamic Filters */}
      <DataFilter
        data={runs}
        columns={columns}
        eval={evalData}
        columnFilters={columnFilters}
        onFilterChange={handleFilterChange}
        columnVisibilityToggle={<ColumnVisibilityToggle table={table} />}
      />

      {/* Table */}
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    <FormattedCell
                      type={cell.column.columnDef.meta?.type}
                      value={cell.getValue()}
                      header={cell.getContext().column.id}
                      rowIndex={row.index}
                      allRows={filteredData}
                      columnId={cell.column.id}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </section>
  );
};
