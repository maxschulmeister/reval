import { defineConfig } from "@/utils";
import fn from "./test/modifiedOutput";

const revalConfig = defineConfig({
  concurrency: 100,
  retries: 5,
  interval: 10,
  data: {
    path: "./data/test.csv",
    trim: 10,
    target: "expected_json",
    variants: {
      models: ["gemini-2.5-flash", "deepseek-chat-v3-0324"],
    },
  },
  run: {
    function: fn,
    /**
     * The args function must return an array matching the number and types of parameters expected by the target function.
     *  Note that TypeScript cannot validate this at compile time, so ensure the arguments match your function's signature at runtime.
     */
    args: (context) => [
      {
        file: context.features,
        model: context.variants.models,
      },
    ],

    result: (response) => ({
      prediction: response.content,
      tokens: {
        in: response.tokens.in,
        out: response.tokens.out,
      },
    }),
  },
});

export default revalConfig;
