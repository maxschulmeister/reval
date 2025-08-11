import React, { useState, useEffect } from 'react';
import { Text, Box } from 'ink';
import zod from 'zod';
import { initializeDatabase } from '@reval/core';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';

export const options = zod.object({
  force: zod.boolean().optional().describe('Skip confirmation and overwrite existing files and database'),
});

interface Props {
  options: zod.infer<typeof options>;
}

const sampleConfig = `import { defineConfig } from '@reval/core';

export default defineConfig({
  concurrency: 5,
  retries: 2,
  interval: 1000,
  data: {
    path: './data/sample.csv',
    features: 'input',
    target: 'expected_output',
    variants: {
      model: ['gpt-4', 'gpt-3.5-turbo'],
    },
  },
  run: {
    function: async ({ input, model }) => {
      // Your function implementation here
      // This is a sample that returns the input with the model name
      return {
        choices: [{
          message: {
            content: \`Response from \${model}: \${input}\`
          }
        }],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
        }
      };
    },
    result: (response) => ({
      prediction: response.choices[0].message.content,
      tokens: {
        in: response.usage.prompt_tokens,
        out: response.usage.completion_tokens,
      }
    }),
  },
});
`;

const sampleData = `input,expected_output
"What is the capital of France?","Paris is the capital of France."
"Explain photosynthesis","Photosynthesis is the process by which plants convert sunlight into energy."
"What is 2+2?","2+2 equals 4."
`;

export default function Init({ options }: Props) {
  const [status, setStatus] = useState<'initializing' | 'completed' | 'error'>('initializing');
  const [error, setError] = useState<string | null>(null);
  const [createdFiles, setCreatedFiles] = useState<string[]>([]);

  useEffect(() => {
    const initialize = async () => {
      try {
        const files: string[] = [];

        // Check for existing files
        const configExists = existsSync('reval.config.ts');
        const dataDir = 'data';
        const dataDirExists = existsSync(dataDir);
        const dataFileExists = existsSync('data/sample.csv');

        if ((configExists || dataFileExists) && !options.force) {
          throw new Error('Configuration or data files already exist. Use --force to overwrite.');
        }

        // Create config file
        if (!configExists || options.force) {
          writeFileSync('reval.config.ts', sampleConfig, 'utf8');
          files.push('reval.config.ts');
        }

        // Create data directory and sample data
        if (!dataDirExists) {
          mkdirSync(dataDir, { recursive: true });
        }
        
        if (!dataFileExists || options.force) {
          writeFileSync('data/sample.csv', sampleData, 'utf8');
          files.push('data/sample.csv');
        }

        // Initialize database
        await initializeDatabase(options.force);
        files.push('.reval/reval.db (database)');

        setCreatedFiles(files);
        setStatus('completed');
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setStatus('error');
      }
    };

    initialize();
  }, [options.force]);

  if (status === 'initializing') {
    return (
      <Box flexDirection="column">
        <Text color="blue">Initializing reval project...</Text>
        {options.force && <Text color="yellow">Force mode: overwriting existing files</Text>}
      </Box>
    );
  }

  if (status === 'error') {
    return (
      <Box flexDirection="column">
        <Text color="red">Error initializing project:</Text>
        <Text>{error}</Text>
        <Text></Text>
        <Text color="gray">Use --force to overwrite existing files</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text color="green">Project initialized successfully!</Text>
      <Text></Text>
      <Text bold>Created files:</Text>
      {createdFiles.map((file, index) => (
        <Text key={index} color="gray">  • {file}</Text>
      ))}
      <Text></Text>
      <Text bold>Next steps:</Text>
      <Text color="blue">1. Edit reval.config.ts to customize your benchmark</Text>
      <Text color="blue">2. Update data/sample.csv with your test data</Text>
      <Text color="blue">3. Run 'reval run' to execute your first benchmark</Text>
      <Text color="blue">4. Use 'reval ui' to explore results in the web interface</Text>
      <Text></Text>
      <Text color="gray">Happy benchmarking! 🎯</Text>
    </Box>
  );
}