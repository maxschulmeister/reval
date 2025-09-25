import { defineConfig } from '@rectangle0/reval-core';

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
    function: async ({ input, model }: { input: any; model: any }) => {
      // Simple test function
      return {
        choices: [{
          message: {
            content: `Test response from ${model}: ${input}`
          }
        }],
        usage: {
          prompt_tokens: input.length,
          completion_tokens: 20,
        }
      };
    },
    args: (context) => [{
      input: context.features,
      model: context.variants.model,
    }],
    result: (response: any) => ({
      prediction: response.choices[0].message.content,
      tokens: {
        in: response.usage.prompt_tokens,
        out: response.usage.completion_tokens,
      }
    }),
  },
});