import React, { useState, useEffect } from 'react';
import { Text, Box } from 'ink';
import zod from 'zod';
import { listRuns } from '@reval/core';
import { option } from 'pastel';

export const options = zod.object({
  limit: zod.number().optional().default(20).describe(
    option({
      description: 'Number of runs to display',
      alias: 'n',
    })
  ),
  json: zod.boolean().optional().describe('Output in JSON format'),
});

interface Props {
  options: zod.infer<typeof options>;
}

export default function List({ options }: Props) {
  const [runs, setRuns] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRuns = async () => {
      try {
        const runsData = await listRuns(options.limit);
        setRuns(runsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    };

    fetchRuns();
  }, [options.limit]);

  if (error) {
    return (
      <Box flexDirection="column">
        <Text color="red">Error fetching runs:</Text>
        <Text>{error}</Text>
      </Box>
    );
  }

  if (!runs) {
    return <Text color="blue">Loading runs...</Text>;
  }

  if (options.json) {
    return <Text>{JSON.stringify(runs, null, 2)}</Text>;
  }

  if (runs.length === 0) {
    return (
      <Box flexDirection="column">
        <Text>No benchmark runs found.</Text>
        <Text color="gray">Run 'reval run' to create your first benchmark.</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text color="blue" bold>Recent Runs ({runs.length}):</Text>
      <Text></Text>
      {runs.map((run, index) => (
        <Box key={run.id} flexDirection="column" marginBottom={1}>
          <Text>
            <Text color="green">{index + 1}.</Text>{' '}
            <Text bold>{run.name}</Text>{' '}
            <Text color="gray">({run.id.slice(0, 8)})</Text>
          </Text>
          <Text color="gray">
            {' '}  {new Date(run.timestamp).toLocaleString()} | 
            {run.totalExecutions} executions | 
            {run.successRate.toFixed(1)}% success | 
            {run.avgTime.toFixed(2)}ms avg
          </Text>
          {run.notes && <Text color="gray">   {run.notes}</Text>}
        </Box>
      ))}
      <Text></Text>
      <Text color="gray">Use 'reval show &lt;runId&gt;' to view detailed results</Text>
    </Box>
  );
}