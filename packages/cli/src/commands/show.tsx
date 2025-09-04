import { getEvalDetails } from "@reval/core";
import { Box, Text } from "ink";
import { argument } from "pastel";
import { useEffect, useState } from "react";
import zod from "zod";

export const args = zod.tuple([
  zod.string().describe(
    argument({
      name: "eval_id",
      description: "ID of the eval to show",
    }),
  ),
]);

export const options = zod.object({
  json: zod.boolean().optional().describe("Output full JSON payload"),
});

interface Props {
  args: zod.infer<typeof args>;
  options: zod.infer<typeof options>;
}

export default function Show({ args, options }: Props) {
  const [details, setDetails] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [eval_id] = args;

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const evalDetails = await getEvalDetails(eval_id);
        if (!evalDetails) {
          setError(`Eval with ID '${eval_id}' not found`);
          return;
        }
        setDetails(evalDetails);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    };

    fetchDetails();
  }, [eval_id]);

  if (error) {
    return (
      <Box flexDirection="column">
        <Text color="red">Error:</Text>
        <Text>{error}</Text>
        <Text></Text>
        <Text color="gray">Use 'reval list' to see available evals</Text>
      </Box>
    );
  }

  if (!details) {
    return <Text color="blue">Loading eval details...</Text>;
  }

  if (options.json) {
    return <Text>{JSON.stringify(details, null, 2)}</Text>;
  }

  const successRate =
    details.totalRuns > 0
      ? (details.successCount / details.totalRuns) * 100
      : 0;

  return (
    <Box flexDirection="column">
      <Text color="blue" bold>
        Eval Details:
      </Text>
      <Text></Text>
      <Text>
        <Text bold>ID:</Text> {details.id}
      </Text>
      <Text>
        <Text bold>Name:</Text> {details.name}
      </Text>
      <Text>
        <Text bold>Timestamp:</Text>{" "}
        {new Date(details.timestamp).toLocaleString()}
      </Text>
      {details.notes && (
        <Text>
          <Text bold>Notes:</Text> {details.notes}
        </Text>
      )}
      <Text></Text>

      <Text color="green" bold>
        Summary:
      </Text>
      <Text> Total runs: {details.totalRuns}</Text>
      <Text>
        {" "}
        Successful: {details.successCount} ({successRate.toFixed(1)}%)
      </Text>
      <Text> Failed: {details.errorCount}</Text>
      <Text> Average time: {details.avgTime.toFixed(2)}ms</Text>
      <Text></Text>

      <Text color="yellow" bold>
        Sample Runs:
      </Text>
      {details.runs.slice(0, 5).map((run: any, index: number) => (
        <Box key={run.id} flexDirection="column" marginLeft={2}>
          <Text>
            <Text bold>{index + 1}.</Text>{" "}
            <Text color={run.status === "success" ? "green" : "red"}>
              {run.status.toUpperCase()}
            </Text>{" "}
            <Text>({run.time}ms)</Text>
            <Text>(score: {run.score.accuracy.value || 0})</Text>
          </Text>
          <Text color="gray"> Target: {JSON.stringify(run.target)}</Text>
          {run.result && (
            <Text color="gray">
              {" "}
              {run.status === "error" && run.result?.error
                ? `Error: ${run.result.error}`
                : `Result: ${JSON.stringify(run.result).slice(0, 100)}...`}
            </Text>
          )}
        </Box>
      ))}

      {details.runs.length > 5 && (
        <Text color="gray"> ... and {details.runs.length - 5} more runs</Text>
      )}

      <Text></Text>
      <Text color="gray">
        Use 'reval export {eval_id}' to export full results
      </Text>
    </Box>
  );
}
