import React, { useState, useEffect } from 'react';
import { Text, Box } from 'ink';
import zod from 'zod';
import { getRunDetails } from '@reval/core';
import { argument } from 'pastel';

export const args = zod.tuple([
  zod.string().describe(
    argument({
      name: 'runId',
      description: 'ID of the run to show',
    })
  ),
]);

export const options = zod.object({
  json: zod.boolean().optional().describe('Output full JSON payload'),
});

interface Props {
  args: zod.infer<typeof args>;
  options: zod.infer<typeof options>;
}

export default function Show({ args, options }: Props) {
  const [details, setDetails] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [runId] = args;

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const runDetails = await getRunDetails(runId, process.cwd());
        if (!runDetails) {
          setError(`Run with ID '${runId}' not found`);
          return;
        }
        setDetails(runDetails);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    };

    fetchDetails();
  }, [runId]);

  if (error) {
    return (
      <Box flexDirection="column">
        <Text color="red">Error:</Text>
        <Text>{error}</Text>
        <Text></Text>
        <Text color="gray">Use 'reval list' to see available runs</Text>
      </Box>
    );
  }

  if (!details) {
    return <Text color="blue">Loading run details...</Text>;
  }

  if (options.json) {
    return <Text>{JSON.stringify(details, null, 2)}</Text>;
  }

  const successRate = details.totalExecutions > 0 ? (details.successCount / details.totalExecutions) * 100 : 0;

  return (
    <Box flexDirection="column">
      <Text color="blue" bold>Run Details:</Text>
      <Text></Text>
      <Text><Text bold>ID:</Text> {details.id}</Text>
      <Text><Text bold>Name:</Text> {details.name}</Text>
      <Text><Text bold>Timestamp:</Text> {new Date(details.timestamp).toLocaleString()}</Text>
      {details.notes && <Text><Text bold>Notes:</Text> {details.notes}</Text>}
      <Text></Text>
      
      <Text color="green" bold>Summary:</Text>
      <Text>  Total executions: {details.totalExecutions}</Text>
      <Text>  Successful: {details.successCount} ({successRate.toFixed(1)}%)</Text>
      <Text>  Failed: {details.errorCount}</Text>
      <Text>  Average time: {details.avgTime.toFixed(2)}ms</Text>
      <Text></Text>
      
      <Text color="yellow" bold>Sample Executions:</Text>
      {details.executions.slice(0, 5).map((execution: any, index: number) => (
        <Box key={execution.id} flexDirection="column" marginLeft={2}>
          <Text>
            <Text bold>{index + 1}.</Text>{' '}
            <Text color={execution.status === 'success' ? 'green' : 'red'}>
              {execution.status.toUpperCase()}
            </Text>{' '}
            <Text>({execution.time}ms)</Text>
          </Text>
          <Text color="gray">   Target: {JSON.stringify(execution.target)}</Text>
          {execution.result && (
            <Text color="gray">   Result: {JSON.stringify(execution.result).slice(0, 100)}...</Text>
          )}
        </Box>
      ))}
      
      {details.executions.length > 5 && (
        <Text color="gray">   ... and {details.executions.length - 5} more executions</Text>
      )}
      
      <Text></Text>
      <Text color="gray">Use 'reval export {runId}' to export full results</Text>
    </Box>
  );
}