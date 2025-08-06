"use client";

import type { Run } from "@reval/core";
import Code from "react-shiki";

import jsBeautify from "js-beautify";
import { useEffect, useState } from "react";

import { useTheme } from "next-themes";
import {
  createColumns,
  type Execution,
} from "../components/data-table/columns";
import { DataTable } from "../components/data-table/data-table";
import {
  ThemeSwitcher,
  type ThemeSwitcherProps,
} from "../components/theme-switcher";
import { Button } from "../components/ui/button";
import { Cell } from "../components/ui/cell";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "../components/ui/select";
import { calculateAverageTime, calculateSuccessRate } from "../lib/grouping";

// Accent color selection (Tailwind): lime
// Base monochrome palette via gray scale, subtle borders, and soft shadows
// Design adjustments per request:
// - Fluid layout
// - Gapless columns with 0.5px light borders
// - Stealth select: show run name as h1 with chevron
// - Small border radius for buttons/badges
// - No shadows
// - Unique highlight color: lime

type RunWithExecutions = {
  run: Run;
  executions: Execution[];
};

export default function Home() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>("");
  const [runData, setRunData] = useState<RunWithExecutions | null>(null);
  const [loading, setLoading] = useState(true);
  const [variantFilters, setVariantFilters] = useState<
    Record<string, string[]>
  >({});
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [collapsedCells, setCollapsedCells] = useState<Record<string, boolean>>(
    {}
  );
  const [dialogContent, setDialogContent] = useState<{
    type: "target" | "prediction";
    content: string;
  } | null>(null);

  const { theme, setTheme } = useTheme();

  // Fetch all runs on component mount
  useEffect(() => {
    const fetchRuns = async () => {
      try {
        const response = await fetch("/api/runs");
        const data = await response.json();
        setRuns(data);
        if (data.length > 0) {
          setSelectedRunId(data[0].id);
        }
      } catch (error) {
        console.error("Error fetching runs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRuns();
  }, []);

  // Fetch run details when selected run changes
  useEffect(() => {
    if (!selectedRunId) return;

    const fetchRunData = async () => {
      try {
        const response = await fetch(`/api/runs/${selectedRunId}`);
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
      }
    };
    fetchRunData();
  }, [selectedRunId]);

  const handleRunChange = (runId: string) => {
    setSelectedRunId(runId);
    setVariantFilters({});
    setStatusFilter([]);
    setSortColumn("");
    setCollapsedCells({});
  };

  const handleVariantFilterChange = (variantKey: string, values: string[]) => {
    setVariantFilters((prev) => ({ ...prev, [variantKey]: values }));
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const toggleCollapse = (cellId: string) => {
    setCollapsedCells((prev) => ({ ...prev, [cellId]: !prev[cellId] }));
  };

  const openDialog = (type: "target" | "prediction", content: string) => {
    setDialogContent({ type, content });
  };

  const closeDialog = () => {
    setDialogContent(null);
  };

  // Filter executions based on current filters
  const filteredExecutions =
    runData?.executions.filter((execution) => {
      // Status filter
      if (statusFilter.length > 0 && !statusFilter.includes(execution.status)) {
        return false;
      }

      // Variant filters
      for (const [variantKey, selectedValues] of Object.entries(
        variantFilters
      )) {
        if (selectedValues.length > 0) {
          const executionVariantValue = execution.variant[variantKey];
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
      String(e.variant[variantKey] || "")
    );
    return [...new Set(values)].filter(Boolean);
  };

  // Get unique status values
  const getUniqueStatusValues = (): string[] => {
    if (!runData) return [];
    const values = runData.executions.map((e) => e.status);
    return [...new Set(values)].filter(Boolean);
  };

  // Get dynamic feature columns
  const getFeatureColumns = (): string[] => {
    if (!runData?.executions.length) return [];
    const firstExecution = runData.executions[0];
    if (Array.isArray(firstExecution.features)) {
      return firstExecution.features.map((_, index) => `feature_${index}`);
    }
    if (
      typeof firstExecution.features === "object" &&
      firstExecution.features
    ) {
      return Object.keys(firstExecution.features);
    }
    return ["features"];
  };

  const renderSortArrow = (column: string) => {
    if (sortColumn !== column) return null;
    return sortDirection === "asc" ? " ↑" : " ↓";
  };

  const renderCollapsibleContent = (
    content: unknown,
    cellId: string,
    type: "target" | "prediction"
  ) => {
    const contentStr =
      typeof content === "string" ? content : JSON.stringify(content, null, 2);

    return (
      <div className="flex items-center gap-2 w-full">
        <span className="flex-1 truncate text-xs text-muted-foreground">
          {contentStr}
        </span>
        <Button
          onClick={() => openDialog(type, contentStr)}
          variant="outline"
          size="sm"
          className="text-xs rounded-radius border-border shadow-none hover:bg-accent hover:text-accent-foreground flex-shrink-0"
        >
          View {type}
        </Button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground grid place-items-center">
        Loading runs...
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="min-h-screen bg-background text-foreground grid place-items-center">
        No runs found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="w-full">
        {/* Header Section */}
        <div className="flex items-center justify-between border-b border-border">
          <Cell borderRight>
            <Select value={selectedRunId} onValueChange={handleRunChange}>
              <SelectTrigger
                aria-label="Change run"
                className="h-auto w-auto p-0 border-0 bg-transparent hover:bg-transparent focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none data-[state=open]:text-primary text-muted-foreground gap-1.5 rounded-none"
              >
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  {runs.find((r) => r.id === selectedRunId)?.name ||
                    "Select a run"}
                </h1>
              </SelectTrigger>
              <SelectContent className="border border-border shadow-none rounded-radius bg-popover">
                {runs.map((run) => (
                  <SelectItem key={run.id} value={run.id}>
                    {run.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Cell>
          <div className="flex items-center gap-0">
            <Cell borderLeft>
              <ThemeSwitcher
                defaultValue="system"
                onChange={setTheme}
                value={theme as ThemeSwitcherProps["value"]}
              />
              <Button
                variant="outline"
                onClick={() => window.open("https://www.github.com", "_blank")}
                className="rounded-radius border-border hover:text-primary shadow-none"
              >
                GitHub
              </Button>
              <Button
                onClick={() => window.open("https://www.google.com", "_blank")}
                className="rounded-radius bg-primary hover:bg-primary/90 text-primary-foreground shadow-none"
              >
                Documentation
              </Button>
            </Cell>
          </div>
        </div>

        {runData && (
          <>
            {/* Summary Row */}
            <Cell className="border-b border-border">
              {/* Function summary */}
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold mr-2">Function:</span>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-2 rounded-radius border-border shadow-none hover:bg-accent hover:text-accent-foreground"
                    >
                      Show Code
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-full max-w-[60rem] shadow-none bg-background border-border rounded-radius">
                    <DialogHeader>
                      <DialogTitle className="text-foreground">
                        Function:
                      </DialogTitle>
                    </DialogHeader>
                    <div className="mt-4 overflow-hidden">
                      <Code
                        language="typescript"
                        theme="github-dark"
                        className="max-w-full overflow-auto text-sm"
                      >
                        {jsBeautify(runData.run.function, {
                          indent_size: 4,
                          indent_char: " ",
                        })}
                      </Code>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Timestamp Summary */}
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold mr-2">Timestamp:</span>
                {new Date(runData.run.timestamp).toLocaleString()}
              </div>

              {/* Executions Summary */}
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold mr-2">Executions:</span>
                {filteredExecutions.length}
              </div>

              {/* Success Rate Summary */}
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold mr-2">Success Rate:</span>
                {calculateSuccessRate(filteredExecutions)}%
              </div>

              {/* Average Time Summary */}
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold mr-2">Avg Time:</span>
                {calculateAverageTime(filteredExecutions)}ms
              </div>
            </Cell>

            {/* Main Grid Table */}
            <div className="mt-8">
              {/* Filter Section */}
              <div
                className="grid bg-card "
                style={{
                  gridTemplateColumns: `auto ${
                    Object.keys(runData.run.variants || {}).filter(
                      (variantKey) =>
                        getUniqueVariantValues(variantKey).length > 1
                    ).length > 0
                      ? "repeat(" +
                        (Object.keys(runData.run.variants || {}).filter(
                          (variantKey) =>
                            getUniqueVariantValues(variantKey).length > 1
                        ).length +
                          (getUniqueStatusValues().length > 1 ? 1 : 0)) +
                        ", 1fr)"
                      : getUniqueStatusValues().length > 1
                      ? "1fr"
                      : ""
                  }`,
                }}
              ></div>

              <DataTable
                columns={createColumns(
                  getFeatureColumns(),
                  Object.keys(runData.run.variants || {})
                )}
                data={sortedExecutions}
                variantFilters={variantFilters}
                onVariantFilterChange={(
                  variantKey: string,
                  values: string[]
                ) => {
                  setVariantFilters((prev) => ({
                    ...prev,
                    [variantKey]: values,
                  }));
                }}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                getUniqueVariantValues={getUniqueVariantValues}
                getUniqueStatusValues={getUniqueStatusValues}
                variantKeys={Object.keys(runData.run.variants || {})}
              />
            </div>

            {/* Target/Prediction Dialog */}
            {dialogContent && (
              <Dialog
                open={!!dialogContent}
                onOpenChange={(open) => !open && closeDialog()}
              >
                <DialogContent className="w-full max-w-[60rem] shadow-none bg-background border-border rounded-radius">
                  <DialogHeader>
                    <DialogTitle className="capitalize text-foreground">
                      {dialogContent.type} Content
                    </DialogTitle>
                  </DialogHeader>
                  <div className="max-h-[60vh] overflow-auto">
                    <Code
                      language="json"
                      theme="github-dark"
                      className="text-sm"
                    >
                      {dialogContent.content}
                    </Code>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </>
        )}
      </div>
    </div>
  );
}
