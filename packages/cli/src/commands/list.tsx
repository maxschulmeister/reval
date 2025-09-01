import { listEvals } from "@reval/core";
import { Box, Text } from "ink";
import { option } from "pastel";
import { useEffect, useState } from "react";
import zod from "zod";

export const options = zod.object({
  limit: zod
    .number()
    .optional()
    .default(20)
    .describe(
      option({
        description: "Number of evals to display",
        alias: "n",
      }),
    ),
  json: zod.boolean().optional().describe("Output in JSON format"),
});

interface Props {
  options: zod.infer<typeof options>;
}

export default function List({ options }: Props) {
  const [evals, setEvals] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvals = async () => {
      try {
        const evalsData = await listEvals(options.limit);
        setEvals(evalsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    };

    fetchEvals();
  }, [options.limit]);

  if (error) {
    return (
      <Box flexDirection="column">
        <Text color="red">Error fetching evals:</Text>
        <Text>{error}</Text>
      </Box>
    );
  }

  if (!evals) {
    return <Text color="blue">Loading evals...</Text>;
  }

  if (options.json) {
    return <Text>{JSON.stringify(evals, null, 2)}</Text>;
  }

  if (evals.length === 0) {
    return (
      <Box flexDirection="column">
        <Text>No benchmark evals found.</Text>
        <Text color="gray">
          Run 'reval run' to create your first benchmark.
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text color="blue" bold>
        Recent Evals ({evals.length}):
      </Text>
      <Text></Text>
      {evals.map((evalItem, index) => (
        <Box key={evalItem.id} flexDirection="column" marginBottom={1}>
          <Text>
            <Text color="green">{index + 1}.</Text> <Text bold>{evalItem.name}</Text>{" "}
            <Text color="gray">({evalItem.id.slice(0, 8)})</Text>
          </Text>
          <Text color="gray">
            {" "}
            {new Date(evalItem.timestamp).toLocaleString()} |{evalItem.totalRuns}{" "}
            runs |{evalItem.successRate.toFixed(1)}% success |
            {evalItem.avgTime.toFixed(2)}ms avg
          </Text>
          {evalItem.notes && <Text color="gray"> {evalItem.notes}</Text>}
        </Box>
      ))}
      <Text></Text>
      <Text color="gray">
        Use 'reval show &lt;eval_id&gt;' to view detailed results
      </Text>
    </Box>
  );
}
