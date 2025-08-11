import { execa } from 'execa';
import { Box, Text } from 'ink';
import React, { useEffect, useState } from 'react';

export default function UI() {
  const [status, setStatus] = useState<'starting' | 'running' | 'error'>('starting');
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const startUI = async () => {
      try {
        // Start the UI dev server
        const child = execa('npm', ['run', 'dev'], {
          cwd: '../ui',
          detached: true,
        });

        // Give it a moment to start
        setTimeout(() => {
          setUrl('http://localhost:3000');
          setStatus('running');
        }, 3000);

      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setStatus('error');
      }
    };

    startUI();
  }, []);

  if (status === 'starting') {
    return (
      <Box flexDirection="column">
        <Text color="blue">Starting reval UI...</Text>
        <Text color="gray">This may take a moment...</Text>
      </Box>
    );
  }

  if (status === 'error') {
    return (
      <Box flexDirection="column">
        <Text color="red">Error starting UI:</Text>
        <Text>{error}</Text>
        <Text></Text>
        <Text color="gray">Make sure the UI package is available and dependencies are installed</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text color="green">reval UI started!</Text>
      <Text></Text>
      <Text><Text bold>URL:</Text> {url}</Text>
      <Text></Text>
      <Text color="gray">Open this URL in your browser to explore benchmark results</Text>
      <Text color="gray">Press Ctrl+C to stop this command (UI server will continue running)</Text>
    </Box>
  );
}