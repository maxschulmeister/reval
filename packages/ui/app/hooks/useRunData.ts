"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Run, Execution } from "@reval/core";

type RunWithExecutions = {
  run: Run;
  executions: Execution[];
};

export const useRunData = (runId: string) => {
  const [runs, setRuns] = useState<Run[]>([]);
  const [runData, setRunData] = useState<RunWithExecutions | null>(null);
  const [loading, setLoading] = useState(true);
  const [variantFilters, setVariantFilters] = useState<Record<string, string[]>>({});
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
  const router = useRouter();

  // Fetch all runs on component mount
  useEffect(() => {
    const fetchRuns = async () => {
      try {
        const response = await fetch("/api/runs");
        const data = await response.json();
        setRuns(data);
      } catch (error) {
        console.error("Error fetching runs:", error);
      }
    };
    fetchRuns();
  }, []);

  // Fetch run details when run ID is available
  useEffect(() => {
    if (!runId) return;

    const fetchRunData = async () => {
      try {
        const response = await fetch(`/api/runs/${runId}`);
        if (!response.ok) {
          if (response.status === 404) {
            // Redirect to latest run if this run doesn't exist
            router.push("/run");
            return;
          }
          throw new Error("Failed to fetch run");
        }
        const data = await response.json();
        setRunData(data);

        // Initialize variant filters
        if (data.run.variants) {
          const filters: Record<string, string[]> = {};
          Object.keys(data.run.variants).forEach((key) => {
            filters[key] = [];
          });
          setVariantFilters(filters);
        }
      } catch (error) {
        console.error("Error fetching run data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRunData();
  }, [runId, router]);

  // Filter executions based on current filters
  const filteredExecutions =
    runData?.executions.filter((execution) => {
      // Status filter
      if (statusFilter.length > 0 && !statusFilter.includes(execution.status)) {
        return false;
      }

      // Variant filters
      for (const [variantKey, selectedValues] of Object.entries(variantFilters)) {
        if (selectedValues.length > 0) {
          const executionVariantValue = (execution.variant as any)[variantKey];
          if (!selectedValues.includes(String(executionVariantValue))) {
            return false;
          }
        }
      }

      return true;
    }) || [];

  // Sort executions
  const sortedExecutions = [...filteredExecutions].sort((a, b) => {
    if (!sortColumn) return 0;

    let aValue: unknown;
    let bValue: unknown;

    if (sortColumn.startsWith("variant.")) {
      const variantKey = sortColumn.replace("variant.", "");
      aValue =
        typeof a.variant === "object" &&
        a.variant !== null &&
        !Array.isArray(a.variant)
          ? (a.variant as Record<string, unknown>)[variantKey]
          : "";
      bValue =
        typeof b.variant === "object" &&
        b.variant !== null &&
        !Array.isArray(b.variant)
          ? (b.variant as Record<string, unknown>)[variantKey]
          : "";
    } else if (sortColumn.startsWith("features.")) {
      const featureKey = sortColumn.replace("features.", "");
      if (Array.isArray(a.features)) {
        const index = parseInt(featureKey.replace("feature_", ""));
        aValue = a.features[index];
      } else if (typeof a.features === "object" && a.features !== null) {
        aValue = (a.features as Record<string, unknown>)[featureKey];
      } else {
        aValue = a.features;
      }

      if (Array.isArray(b.features)) {
        const index = parseInt(featureKey.replace("feature_", ""));
        bValue = b.features[index];
      } else if (typeof b.features === "object" && b.features !== null) {
        bValue = (b.features as Record<string, unknown>)[featureKey];
      } else {
        bValue = b.features;
      }
    } else {
      aValue = a[sortColumn as keyof Execution];
      bValue = b[sortColumn as keyof Execution];
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }

    const aStr = String(aValue || "");
    const bStr = String(bValue || "");

    if (sortDirection === "asc") {
      return aStr.localeCompare(bStr);
    } else {
      return bStr.localeCompare(aStr);
    }
  });

  // Get unique values for variant filters
  const getUniqueVariantValues = (variantKey: string): string[] => {
    if (!runData) return [];
    const values = runData.executions.map((e) =>
      String((e.variant as any)[variantKey] || "")
    );
    return [...new Set(values)].filter(Boolean);
  };

  // Get unique status values
  const getUniqueStatusValues = (): string[] => {
    if (!runData) return [];
    const values = runData.executions.map((e) => e.status);
    return [...new Set(values)].filter(Boolean);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleVariantFilterChange = (variantKey: string, values: string[]) => {
    setVariantFilters((prev) => ({ ...prev, [variantKey]: values }));
  };

  return {
    runs,
    runData,
    loading,
    filteredExecutions,
    sortedExecutions,
    variantFilters,
    statusFilter,
    sortColumn,
    sortDirection,
    getUniqueVariantValues,
    getUniqueStatusValues,
    handleSort,
    handleVariantFilterChange,
    setStatusFilter,
  };
};