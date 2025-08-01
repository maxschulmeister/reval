import { type Config } from "./src/types/config";
import fn from "./test/modifiedOutput";

const revalConfig: Config = {
  concurrency: 10,
  retries: 5,
  interval: 500,
  data: {
    path: "./data/test.csv",
    trim: 10,
    in: "image_path",
    out: "expected_json",
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
        file: context.in,
        model: context.variants.models,
      },
    ],
  },
};

export default revalConfig;
