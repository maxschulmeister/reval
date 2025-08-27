/**
 * Specifies the data source for the benchmark.
 */
export interface Config<
  F extends (...args: any[]) => Promise<any>,
  Features extends string | readonly string[] = string | string[],
> {
  /**
   * Maximum number of concurrent Executions to run in parallel.
   * Defaults to the number of CPU cores available.
   */
  concurrency?: number;
  /**
   * Number of times to retry a failed execution before marking it as failed.
   * Defaults to 0 (no retries).
   */
  retries?: number;
  /**
   * Time interval in milliseconds between each execution batch.
   * Useful for rate limiting API calls. Defaults to 0 (no delay).
   */
  interval?: number;
  data: ConfigData & { features?: Features };
  /**
   * Configures the function to be executed for the benchmark.
   */
  run: {
    /**
     * The function to be benchmarked. This is required.
     */
    function: F;
    /**
     * Defines the arguments to be passed to the benchmarked function.
     * Can be a function that receives context with data and variants,
     * or a static array for simple cases.
     * e.g.
     *   args: (context) => [context.data.input, context.variants.model]
     * or
     *   args: (context: any) => [
     *     {
     *       file: context.data.input,
     *       ocrModel: context.variants.models.ocr,
     *       extractModel: context.variants.models.extract,
     *     },
     *   ],
     */
    args: (context: ArgsContext<ConfigData & { features?: Features }>) => any;

    /**
     * Object to map metrics directly to properties of the return type of the function that ran.
     * defaults to OpenAI specification:
     *   (context) => ({
     *     response: context.choices[0].message.content,
     *     token: {
     *       features: context.usage.prompt_tokens,
     *       target: context.usage.completion_tokens,
     *     }
     *   })
     * example:
     * metrics: (context) => ({
     *   response: context.result,
     *   tokens: {
     *     features: context.tokens_in,
     *     target: context.tokens_out,
     *   },
     *   totalTokens: context.tokens_in + context.tokens_out,
     * }),
     */
    result: (context: Awaited<ReturnType<F>>) => {
      prediction: string;
      tokens: {
        in: number;
        out: number;
      };
      [key: string]: any;
    };
  };
}

export interface ConfigData {
  /**
   * Path to the data file (e.g., CSV). Defaults to `data.csv`.
   */
  path?: string;
  /**
   * The column name(s) for the input data. Can be a single column name or an array of column names.
   * When an array is provided, features will be accessible as an object in the context.
   * Defaults to the first column.
   */
  features?: string | string[];
  /**
   * The column name for the expected output. All others are treated as features.
   */
  target?: string;
  /**
   * Defines the variables to be tested. Reval will generate a benchmark for each
   * possible combination of these variants.
   * Can be an object or an array for simpler cases (e.g., `variants: ["gpt-4.1", "gemini-2.5"]`).
   *
   * Example: Test different models for OCR and extraction tasks.
   * Each property must be an array.
   *   models: {
   *     ocr: ["gemini-2.5", "o4-mini-high"],
   *     extract: ["gemini-2.5", "o4-mini-high"],
   *   },
   * Example: Test different prompts.
   *   prompts: [
   *     "create a concise summary of the attached document.",
   *     "create a comprehensive summary of the attached document.",
   *   ],
   * Example: Test a range of temperatures.
   *   temperatures: () => Array.from({ length: 11 }, (_, i) =>
   *     Number((i * 0.1).toFixed(1))
   *   ),
   */
  variants: Record<string, any[]>;
  /**
   * Limits the number of data rows to process from the dataset.
   * Useful for testing with a subset of data. If not specified, all rows are processed.
   */
  trim?: number;
}

// Helper type to extract features type from a config
type ExtractFeatures<T> = T extends { data: { features: infer F } } ? F : never;

// Helper type to create the proper features context type
type FeaturesContextType<F> = F extends readonly string[]
  ? Record<F[number], any[]> // Object for array of feature names with exact keys
  : F extends string
    ? any[] // Array for single feature name
    : Record<string, any[]>; // Default to object for other cases

// Helper type to create ArgsContext from a full config
export type ArgsContextFromConfig<T> = T extends { data: infer D }
  ? D extends ConfigData
    ? Omit<D, "features" | "target"> & {
        features: FeaturesContextType<ExtractFeatures<T>>;
        target: any[];
      }
    : never
  : never;

// this includes the resolved data, so we now have array instead of strings.
export type ArgsContext<T extends ConfigData = ConfigData> = Omit<
  T,
  "features" | "target"
> & {
  features: FeaturesContextType<T["features"]>;
  target: any[];
};

type ParametersToArrays<T> = T extends any[]
  ? {
      [K in keyof T]: T[K] extends object
        ? { [P in keyof T[K]]: T[K][P][] }
        : T[K][];
    }
  : never;
