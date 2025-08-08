"use client";

import { DataTable } from "@/app/components/executions/data-table";
import { Summary } from "@/app/components/summary";
import type { Benchmark, Run } from "@reval/core/src/types";
import { useTheme } from "next-themes";
import { Header } from "../../components/header";

interface RunPageClientProps {
  runs: Run[];
  runData: Benchmark;
  currentRunId: string;
}

export const RunPageClient = ({
  runs,
  runData,
  currentRunId,
}: RunPageClientProps) => {
  const { theme, setTheme } = useTheme();

  // const [variantFilters, setVariantFilters] = useState<
  //   Record<string, string[]>
  // >(() => {
  //   // Initialize variant filters
  //   const filters: Record<string, string[]> = {};
  //   if (runData.run.variants) {
  //     Object.keys(runData.run.variants).forEach((key) => {
  //       filters[key] = [];
  //     });
  //   }
  //   return filters;
  // });
  // const [statusFilter, setStatusFilter] = useState<string[]>([]);
  // const [sortColumn, setSortColumn] = useState<string>("");
  // const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // // Filter Executions based on current filters
  // const filteredExecutions = runData.Executions.filter((execution) => {
  //   // Status filter
  //   if (statusFilter.length > 0 && !statusFilter.includes(execution.status)) {
  //     return false;
  //   }

  //   // Variant filters
  //   for (const [variantKey, selectedValues] of Object.entries(variantFilters)) {
  //     if (selectedValues.length > 0) {
  //       const executionVariantValue = (execution.variant as any)[variantKey];
  //       if (!selectedValues.includes(String(executionVariantValue))) {
  //         return false;
  //       }
  //     }
  //   }

  //   return true;
  // });

  // Sort Executions
  // const sortedExecutions = [...filteredExecutions].sort((a, b) => {
  //   if (!sortColumn) return 0;

  //   let aValue: unknown;
  //   let bValue: unknown;

  //   if (sortColumn.startsWith("variant.")) {
  //     const variantKey = sortColumn.replace("variant.", "");
  //     aValue =
  //       typeof a.variant === "object" &&
  //       a.variant !== null &&
  //       !Array.isArray(a.variant)
  //         ? (a.variant as Record<string, unknown>)[variantKey]
  //         : "";
  //     bValue =
  //       typeof b.variant === "object" &&
  //       b.variant !== null &&
  //       !Array.isArray(b.variant)
  //         ? (b.variant as Record<string, unknown>)[variantKey]
  //         : "";
  //   } else if (sortColumn.startsWith("features.")) {
  //     const featureKey = sortColumn.replace("features.", "");
  //     if (Array.isArray(a.features)) {
  //       const index = parseInt(featureKey.replace("feature_", ""));
  //       aValue = a.features[index];
  //     } else if (typeof a.features === "object" && a.features !== null) {
  //       aValue = (a.features as Record<string, unknown>)[featureKey];
  //     } else {
  //       aValue = a.features;
  //     }

  //     if (Array.isArray(b.features)) {
  //       const index = parseInt(featureKey.replace("feature_", ""));
  //       bValue = b.features[index];
  //     } else if (typeof b.features === "object" && b.features !== null) {
  //       bValue = (b.features as Record<string, unknown>)[featureKey];
  //     } else {
  //       bValue = b.features;
  //     }
  //   } else {
  //     aValue = a[sortColumn as keyof Execution];
  //     bValue = b[sortColumn as keyof Execution];
  //   }

  //   if (typeof aValue === "number" && typeof bValue === "number") {
  //     return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
  //   }

  //   const aStr = String(aValue || "");
  //   const bStr = String(bValue || "");

  //   if (sortDirection === "asc") {
  //     return aStr.localeCompare(bStr);
  //   } else {
  //     return bStr.localeCompare(aStr);
  //   }
  // });

  // // Get unique values for variant filters
  // const getUniqueVariantValues = (variantKey: string): string[] => {
  //   const values = runData.Executions.map((e) =>
  //     String((e.variant as any)[variantKey] || "")
  //   );
  //   return [...new Set(values)].filter(Boolean);
  // };

  // // Get unique status values
  // const getUniqueStatusValues = (): string[] => {
  //   const values = runData.Executions.map((e) => e.status);
  //   return [...new Set(values)].filter(Boolean);
  // };

  // const handleSort = (column: string) => {
  //   if (sortColumn === column) {
  //     setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  //   } else {
  //     setSortColumn(column);
  //     setSortDirection("asc");
  //   }
  // };

  // const handleVariantFilterChange = (variantKey: string, values: string[]) => {
  //   setVariantFilters((prev) => ({ ...prev, [variantKey]: values }));
  // };

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="w-full">
        <Header
          runs={runs}
          currentRunId={currentRunId}
          currentRunName={runData.run.name}
          theme={theme}
          onThemeChange={setTheme}
        />

        <Summary {...runData} />

        <DataTable {...runData} />

        {/*
        <RunDataTable
          run={runData.run}
          sortedExecutions={sortedExecutions}
          variantFilters={variantFilters}
          statusFilter={statusFilter}
          onVariantFilterChange={handleVariantFilterChange}
          onStatusFilterChange={setStatusFilter}
          getUniqueVariantValues={getUniqueVariantValues}
          getUniqueStatusValues={getUniqueStatusValues}
        /> */}
      </div>
    </div>
  );
};
