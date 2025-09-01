import { loadConfig, runEval } from "@reval/core";
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
        description: "Parallelism for test runs",
        alias: "j",
      }),
    ),
  retries: zod
    .number()
    .optional()
    .describe(
      option({
        description: "Retries for flaky runs",
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

export default function Eval({ options }: Props) {
  const { exit } = useApp();
  const [status, setStatus] = useState<"running" | "completed" | "error">(
    "running",
  );
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const runBenchmark = async () => {
      try {
        const config = await loadConfig();
        const benchmark = await runEval(config);
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
    eval_id: result.eval.id,
    name: result.eval.name,
    totalRuns: result.runs.length,
    successCount: result.runs.filter((r: any) => r.status === "success").length,
    errorCount: result.runs.filter((r: any) => r.status === "error").length,
    avgTime:
      result.runs.reduce((sum: number, r: any) => sum + r.time, 0) /
      result.runs.length,
    avgAccuracy:
      result.runs.reduce((sum: number, r: any) => sum + r.accuracy, 0) /
      result.runs.length,
  };

  const successRate =
    summary.totalRuns > 0
      ? (summary.successCount / summary.totalRuns) * 100
      : 0;

  return (
    <Box flexDirection="column">
      <Text color="green">Benchmark completed!</Text>
      <Text></Text>
      <Text color="blue">Run Summary:</Text>
      <Text> ID: {summary.eval_id}</Text>
      <Text> Name: {summary.name}</Text>
      <Text> Total runs: {summary.totalRuns}</Text>
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
        Use 'reval show {summary.eval_id}' to view detailed results
      </Text>
    </Box>
  );
}
