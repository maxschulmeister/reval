import React, { useState, useEffect } from 'react';
import { Text, Box } from 'ink';
import zod from 'zod';
import { exportRun } from '@reval/core';
import { argument, option } from 'pastel';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

export const args = zod.tuple([
  zod.string().describe(
    argument({
      name: 'runId',
      description: 'ID of the run to export',
    })
  ),
]);

export const options = zod.object({
  format: zod.enum(['json', 'csv']).default('json').describe('Export format'),
  out: zod.string().optional().describe(
    option({
      description: 'Output file path',
      alias: 'o',
    })
  ),
});

interface Props {
  args: zod.infer<typeof args>;
  options: zod.infer<typeof options>;
}

export default function Export({ args, options }: Props) {
  const [status, setStatus] = useState<'exporting' | 'completed' | 'error'>('exporting');
  const [error, setError] = useState<string | null>(null);
  const [outputPath, setOutputPath] = useState<string | null>(null);
  const [runId] = args;

  useEffect(() => {
    const performExport = async () => {
      try {
        const data = await exportRun(runId, options.format, process.cwd());
        
        const fileName = options.out || `reval-export-${runId.slice(0, 8)}.${options.format}`;
        
        // Create parent directories if they don't exist
        const dir = dirname(fileName);
        if (dir !== '.') {
          mkdirSync(dir, { recursive: true });
        }
        
        writeFileSync(fileName, data, 'utf8');
        
        setOutputPath(fileName);
        setStatus('completed');
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setStatus('error');
      }
    };

    performExport();
  }, [runId, options.format, options.out]);

  if (status === 'exporting') {
    return (
      <Box flexDirection="column">
        <Text color="blue">Exporting run {runId}...</Text>
        <Text color="gray">Format: {options.format.toUpperCase()}</Text>
      </Box>
    );
  }

  if (status === 'error') {
    return (
      <Box flexDirection="column">
        <Text color="red">Error exporting run:</Text>
        <Text>{error}</Text>
        <Text></Text>
        <Text color="gray">Use 'reval list' to see available runs</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text color="green">Export completed!</Text>
      <Text></Text>
      <Text><Text bold>Run ID:</Text> {runId}</Text>
      <Text><Text bold>Format:</Text> {options.format.toUpperCase()}</Text>
      <Text><Text bold>Output file:</Text> {outputPath}</Text>
      <Text></Text>
      <Text color="gray">File saved successfully</Text>
    </Box>
  );
}