import React, { useState, useEffect } from 'react';
import { Text, Box } from 'ink';
import zod from 'zod';
import { initializeDatabase } from '@reval/core';

export const options = zod.object({
  force: zod.boolean().optional().describe('Skip confirmation and overwrite any existing database'),
});

interface Props {
  options: zod.infer<typeof options>;
}

export default function Create({ options }: Props) {
  const [status, setStatus] = useState<'creating' | 'completed' | 'error'>('creating');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createDb = async () => {
      try {
        await initializeDatabase(options.force);
        setStatus('completed');
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setStatus('error');
      }
    };

    createDb();
  }, [options.force]);

  if (status === 'creating') {
    return (
      <Box flexDirection="column">
        <Text color="blue">Creating database...</Text>
        {options.force && <Text color="yellow">Force mode: overwriting existing database</Text>}
      </Box>
    );
  }

  if (status === 'error') {
    return (
      <Box flexDirection="column">
        <Text color="red">Error creating database:</Text>
        <Text>{error}</Text>
        <Text></Text>
        <Text color="gray">Use --force to overwrite an existing database</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text color="green">Database created successfully!</Text>
      <Text></Text>
      <Text color="gray">Location: ./.reval/reval.db</Text>
      <Text color="gray">You can now run 'reval run' to execute benchmarks</Text>
    </Box>
  );
}