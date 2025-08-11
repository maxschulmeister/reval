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

        
      </div>
    </div>
  );
};
