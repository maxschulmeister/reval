"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import type { Benchmark } from "@reval/core/src/types";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { createColumns } from "./create-columns";
import { DataFilter, filterData } from "./data-filter";
import { FormattedCell } from "./formatted-cell";

export const DataTable = ({ run, executions }: Benchmark) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>(
    {},
  );

  const columns = useMemo(() => createColumns(executions), [executions]);

  // Filter data based on selected filters
  const filteredData = useMemo(() => {
    return filterData(executions, columnFilters);
  }, [executions, columnFilters]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  const handleFilterChange = (columnId: string, values: string[]) => {
    setColumnFilters((prev) => ({ ...prev, [columnId]: values }));
  };

  return (
    <section className="mt-8">
      {/* Dynamic Filters */}
      <DataFilter
        data={executions}
        columns={columns}
        run={run}
        columnFilters={columnFilters}
        onFilterChange={handleFilterChange}
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
                      value={cell.getValue() as string | number | boolean}
                      header={cell.getContext().column.id}
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
