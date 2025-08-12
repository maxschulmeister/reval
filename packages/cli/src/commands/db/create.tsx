import React, { useState, useEffect } from 'react';
import { Text, Box } from 'ink';
import zod from 'zod';
import { initializeDatabase } from '@reval/core';
import fs from 'fs';
import path from 'path';
import { createDrizzleConfig } from '../../utils/drizzle-config';

export const options = zod.object({
  force: zod.boolean().optional().describe('Skip confirmation and overwrite any existing database'),
});

interface Props {
  options: zod.infer<typeof options>;
}

export default function Create({ options }: Props) {
  const [status, setStatus] = useState<'creating' | 'completed' | 'error'>('creating');
  const [error, setError] = useState<string | null>(null);
  const [createdFiles, setCreatedFiles] = useState<string[]>([]);

  useEffect(() => {
    const createDb = async () => {
      try {
        const files: string[] = [];
        
        // Initialize database in current working directory
        await initializeDatabase(options.force, process.cwd());
        files.push('.reval/reval.db');
        
        // Create drizzle.config.ts
        const drizzleConfigPath = path.resolve(process.cwd(), 'drizzle.config.ts');
        const configContent = createDrizzleConfig();
        
        if (!fs.existsSync(drizzleConfigPath) || options.force) {
          fs.writeFileSync(drizzleConfigPath, configContent, 'utf8');
          files.push('drizzle.config.ts');
        }
        
        setCreatedFiles(files);
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
        <Text color="blue">Creating database and configuration files...</Text>
        {options.force && <Text color="yellow">Force mode: overwriting existing files</Text>}
      </Box>
    );
  }

  if (status === 'error') {
    return (
      <Box flexDirection="column">
        <Text color="red">Error creating database:</Text>
        <Text>{error}</Text>
        <Text></Text>
        <Text color="gray">Use --force to overwrite existing files</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text color="green">Database and configuration created successfully!</Text>
      <Text></Text>
      <Text bold>Created files:</Text>
      {createdFiles.map((file, index) => (
        <Text key={index} color="gray">
          • {file}
        </Text>
      ))}
      <Text></Text>
      <Text color="gray">You can now run 'reval run' to execute benchmarks</Text>
      <Text color="gray">Use 'reval db studio' to explore the database in Drizzle Studio</Text>
    </Box>
  );
}