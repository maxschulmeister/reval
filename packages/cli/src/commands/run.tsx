import type { RunOptions } from "@reval/core";
import { run } from "@reval/core";
import { Box, Text, useApp } from "ink";
import { option } from "pastel";
import { useEffect, useState } from "react";
import zod from "zod";

export const options = zod.object({
  config: zod
    .string()
    .optional()
    .describe(
      option({
        description: "Path to a reval config file",
        alias: "c",
      }),
    ),
  data: zod
    .string()
    .optional()
    .describe(
      option({
        description: "Path to a CSV file or directory",
        alias: "d",
      }),
    ),
  concurrency: zod
    .number()
    .optional()
    .describe(
      option({
        description: "Parallelism for test execution",
        alias: "j",
      }),
    ),
  retries: zod
    .number()
    .optional()
    .describe(
      option({
        description: "Retries for flaky executions",
        alias: "r",
      }),
    ),
  dry: zod
    .boolean()
    .optional()
    .describe("Validate config and inputs without executing"),
  verbose: zod
    .boolean()
    .optional()
    .describe(
      option({
        description: "Increase log verbosity",
        alias: "v",
      }),
    ),
});

interface Props {
  options: zod.infer<typeof options>;
}

export default function Run({ options }: Props) {
  const { exit } = useApp();
  const [status, setStatus] = useState<"running" | "completed" | "error">(
    "running",
  );
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const runBenchmark = async () => {
      try {
        const runOptions: RunOptions = {
          configPath: options.config,
          dataPath: options.data,
          concurrency: options.concurrency,
          retries: options.retries,
          dryRun: options.dry,
        };

        const benchmark = await run(runOptions);
        setResult(benchmark);
        setStatus("completed");
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setStatus("error");
      }
    };

    runBenchmark();
  }, [options]);

  // Exit the app when benchmark completes or errors
  useEffect(() => {
    if (status === "completed" || status === "error") {
      // Small delay to ensure the UI has rendered
      setTimeout(() => {
        process.exit(status === "completed" ? 0 : 1);
      }, 100);
    }
  }, [status]);

  if (status === "running") {
    return (
      <Box flexDirection="column">
        <Text color="blue">Running benchmark...</Text>
        {options.dry && <Text color="gray">(Dry run mode)</Text>}
      </Box>
    );
  }

  if (status === "error") {
    return (
      <Box flexDirection="column">
        <Text color="red">Error running benchmark:</Text>
        <Text>{error}</Text>
      </Box>
    );
  }

  if (!result) {
    return <Text color="red">No result data available</Text>;
  }

  const summary = {
    runId: result.run.id,
    name: result.run.name,
    totalExecutions: result.executions.length,
    successCount: result.executions.filter((e: any) => e.status === "success")
      .length,
    errorCount: result.executions.filter((e: any) => e.status === "error")
      .length,
    avgTime:
      result.executions.reduce((sum: number, e: any) => sum + e.time, 0) /
      result.executions.length,
    avgAccuracy:
      result.executions.reduce((sum: number, e: any) => sum + e.accuracy, 0) /
      result.executions.length,
  };

  const successRate =
    summary.totalExecutions > 0
      ? (summary.successCount / summary.totalExecutions) * 100
      : 0;

  return (
    <Box flexDirection="column">
      <Text color="green">Benchmark completed!</Text>
      <Text></Text>
      <Text color="blue">Run Summary:</Text>
      <Text> ID: {summary.runId}</Text>
      <Text> Name: {summary.name}</Text>
      <Text> Total executions: {summary.totalExecutions}</Text>
      <Text>
        {" "}
        Success: {summary.successCount} ({successRate.toFixed(1)}%)
      </Text>
      <Text> Errors: {summary.errorCount}</Text>
      <Text> Average time: {summary.avgTime.toFixed(2)}ms</Text>
      <Text> Average accuracy: {summary.avgAccuracy.toFixed(2)}</Text>
      <Text></Text>
      <Text color="gray">Results saved to database at: ./.reval/reval.db</Text>
      <Text color="gray">
        Use 'reval show {summary.runId}' to view detailed results
      </Text>
    </Box>
  );
}
