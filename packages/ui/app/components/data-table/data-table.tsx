"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import * as React from "react";

// Dropdown menu component not available, removing for now
import { MultiSelect } from "@/app/components/ui/multi-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { Cell } from "../ui/cell";
import { DT } from "../ui/typography";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  variantFilters?: Record<string, string[]>;
  statusFilter?: string[];
  onVariantFilterChange?: (variantKey: string, values: string[]) => void;
  onStatusFilterChange?: (values: string[]) => void;
  getUniqueVariantValues?: (variantKey: string) => string[];
  getUniqueStatusValues?: () => string[];
  variantKeys?: string[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
  variantFilters = {},
  statusFilter = [],
  onVariantFilterChange,
  onStatusFilterChange,
  getUniqueVariantValues,
  getUniqueStatusValues,
  variantKeys = [],
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    // maybe later
    // getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="w-full">
      {/* Filters */}
      <Cell>
        <DT as="h4">Filters</DT>

        <div className="flex flex-wrap items-center gap-4 py-4">
          {/* Status Filter */}
          {getUniqueStatusValues &&
            onStatusFilterChange &&
            getUniqueStatusValues().length > 1 && (
              <div className="flex items-center gap-2">
                <MultiSelect
                  options={getUniqueStatusValues().map((status) => ({
                    label: status,
                    value: status,
                  }))}
                  selected={statusFilter}
                  onChange={onStatusFilterChange}
                  placeholder="Filter by status"
                />
              </div>
            )}

          {/* Variant Filters */}
          {variantKeys.map(
            (variantKey) =>
              getUniqueVariantValues &&
              getUniqueVariantValues(variantKey).length > 1 && (
                <div key={variantKey} className="flex items-center gap-2">
                  <MultiSelect
                    options={
                      getUniqueVariantValues
                        ? getUniqueVariantValues(variantKey).map((value) => ({
                            label: value,
                            value: value,
                          }))
                        : []
                    }
                    selected={variantFilters[variantKey] || []}
                    onChange={(values: string[]) =>
                      onVariantFilterChange?.(variantKey, values)
                    }
                    placeholder={`Filter by ${variantKey}`}
                  />
                </div>
              )
          )}
        </div>
      </Cell>

      {/* Table */}
      <div className="overflow-x-auto border-t border-b border-border rounded-radius">
        <Table className="w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="hover:bg-transparent border-border"
              >
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="border-r last:border-r-0 border-border"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
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
                  className="border-border"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="border-r last:border-r-0 border-border"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {/* Maybe later */}
      {/* <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded-radius border-border shadow-none"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded-radius border-border shadow-none"
          >
            Next
          </Button>
        </div>
      </div> */}
    </div>
  );
}
