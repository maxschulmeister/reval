import { FileTree } from '../utils';

export const minimalConfig: FileTree = {
  'reval.config.ts': `import { defineConfig } from '@reval/core';

export default defineConfig({
  concurrency: 2,
  retries: 1,
  interval: 100,
  data: {
    path: './data/sample.csv',
    features: 'input',
    target: 'expected_output',
    variants: {
      model: ['test-model-1', 'test-model-2'],
    },
  },
  run: {
    function: async ({ input, model }) => {
      return {
        choices: [{
          message: {
            content: \`Test response from \${model}: \${input}\`
          }
        }],
        usage: {
          prompt_tokens: input.length,
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
});`,
};

export const sampleData: FileTree = {
  'data': {
    'sample.csv': `input,expected_output
"What is 1+1?","1+1 equals 2"
"What is the capital of France?","The capital of France is Paris"
"Hello","Hello! How can I help you?"`
  }
};

export const completeProject: FileTree = {
  ...minimalConfig,
  ...sampleData,
};