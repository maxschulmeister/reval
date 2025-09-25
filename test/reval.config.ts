import { defineConfig } from "@rectangle0/reval-core";
import data from "./sample.json";

export default defineConfig({
  concurrency: 5,
  retries: 2,
  interval: 1000,
  data,
  target: "expected_output",
  variants: {
    model: ["gpt-4", "gpt-3.5-turbo"],
  },
  function: async (question: string, answer: string) => {
    // just return the answer for demo purposes
    return answer;
  },
  // in order to be able to map data to args, we convert data internally to arrays of data values.
  args: (ctx) => [ctx.data.input, ctx.data.expected_output],
  result: (response) => ({
    output: response,
  }),
});
