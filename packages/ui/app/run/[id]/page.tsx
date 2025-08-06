"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Header } from "../../components/Header";
import { RunDataTable } from "../../components/RunDataTable";
import { Summary } from "../../components/Summary";
import { useRunData } from "../../hooks/useRunData";

interface RunPageProps {
  params: Promise<{ id: string }>;
}

export default function RunPage({ params }: RunPageProps) {
  const [runId, setRunId] = useState<string>("");

  const { theme, setTheme } = useTheme();

  // Get run ID from params
  useEffect(() => {
    const getRunId = async () => {
      const resolvedParams = await params;
      setRunId(resolvedParams.id);
    };
    getRunId();
  }, [params]);

  const {
    runs,
    runData,
    loading,
    filteredExecutions,
    sortedExecutions,
    variantFilters,
    statusFilter,
    getUniqueVariantValues,
    getUniqueStatusValues,
    handleVariantFilterChange,
    setStatusFilter,
  } = useRunData(runId);



  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground grid place-items-center">
        Loading run...
      </div>
    );
  }

  if (!runData) {
    return (
      <div className="min-h-screen bg-background text-foreground grid place-items-center">
        Run not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="w-full">
        <Header
          runs={runs}
          currentRunId={runId}
          currentRunName={runData.run.name}
          theme={theme}
          onThemeChange={setTheme}
        />

        <Summary run={runData.run} filteredExecutions={filteredExecutions} />

        <RunDataTable
          run={runData.run}
          sortedExecutions={sortedExecutions}
          variantFilters={variantFilters}
          statusFilter={statusFilter}
          onVariantFilterChange={handleVariantFilterChange}
          onStatusFilterChange={setStatusFilter}
          getUniqueVariantValues={getUniqueVariantValues}
          getUniqueStatusValues={getUniqueStatusValues}
        />


      </div>
    </div>
  );
}
