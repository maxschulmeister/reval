import { defineConfig } from '@reval/core';

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
    function: async ({ input, model }: { input: any, model: any }) => {
      // Your function implementation here
      // This is a sample that returns the input with the model name
      return {
        choices: [{
          message: {
            content: `Response from ${model}: ${input}`
          }
        }],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
        }
      };
    },
    args: (context: any) => [{
      input: context.features,
      model: context.variants.model
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