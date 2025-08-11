import React, { useState, useEffect } from 'react';
import { Text, Box } from 'ink';
import { runMigrations } from '@reval/core';

export default function Migrate() {
  const [status, setStatus] = useState<'migrating' | 'completed' | 'error'>('migrating');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const migrate = async () => {
      try {
        await runMigrations();
        setStatus('completed');
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setStatus('error');
      }
    };

    migrate();
  }, []);

  if (status === 'migrating') {
    return (
      <Box flexDirection="column">
        <Text color="blue">Running database migrations...</Text>
      </Box>
    );
  }

  if (status === 'error') {
    return (
      <Box flexDirection="column">
        <Text color="red">Error running migrations:</Text>
        <Text>{error}</Text>
        <Text></Text>
        <Text color="gray">Ensure the database exists and migration files are available</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text color="green">Database migrations completed!</Text>
      <Text></Text>
      <Text color="gray">Database schema is now up to date</Text>
    </Box>
  );
}