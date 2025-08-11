import "data-forge-fs";
import { customRandom, random, urlAlphabet } from "nanoid";
import pQueue from "p-queue";
import pRetry from "p-retry";
import { saveRun } from "../db/save-run";
import type { Benchmark, Config, Execution } from "../types";
import { Status } from "../types";
import {
  combineArgs,
  getFeatures,
  getVariant,
  loadConfig,
  loadData,
} from "../utils";

const nanoid = customRandom(urlAlphabet, 24, random);

export interface RunOptions {
  configPath?: string;
  dataPath?: string;
  concurrency?: number;
  retries?: number;
  interval?: number;
  dryRun?: boolean;
}

export async function run(overrides: RunOptions = {}): Promise<Benchmark> {
  const timestamp = Date.now();
  const config = await loadConfig();
  const data = await loadData();
  
  // Apply overrides to config
  const finalConfig = {
    ...config,
    concurrency: overrides.concurrency ?? config.concurrency ?? 10,
    retries: overrides.retries ?? config.retries ?? 0,
    interval: overrides.interval ?? config.interval ?? 1000,
  };

  const context = {
    path: overrides.dataPath || finalConfig.data.path,
    features: data.features,
    target: data.target,
    variants: finalConfig.data.variants,
  };
  
  const fnName = finalConfig.run.function.name;
  const variants = Object.entries(finalConfig.data.variants).map(([key, value]) => {
    if (Array.isArray(value)) {
      return `${value.length}_${key}`;
    }
    return `${key}`;
  });

  // Generate a name based on the function name, variants (and lengths) and timestamp
  const name = `${fnName}-${variants.join("-")}-${timestamp}`;
  const runId = nanoid();

  // If dry run, return early with validation results
  if (overrides.dryRun) {
    const benchmark: Benchmark = {
      run: {
        id: runId,
        name: `[DRY RUN] ${name}`,
        notes: "Dry run - no execution performed",
        function: finalConfig.run.function.toString(),
        features: context.features,
        target: context.target,
        variants: context.variants,
        timestamp,
      },
      executions: [],
    };
    return benchmark;
  }

  // Create queue with concurrency control and interval
  const queue = new pQueue({
    concurrency: finalConfig.concurrency,
    interval: finalConfig.interval,
    intervalCap: 1,
  });

  // Add all tasks to the queue
  const args = combineArgs(finalConfig.run.args(context));
  const promises = args.map((arg) =>
    queue.add(async () => {
      let retryCount = 0;
      let startTime: number = Date.now();
      let status: Status = Status.Success;
      let response: Awaited<ReturnType<typeof finalConfig.run.function>> | null;
      let error: any;

      try {
        response = await pRetry(
          async () => {
            startTime = Date.now();
            return await finalConfig.run.function.apply(null, arg);
          },
          {
            retries: finalConfig.retries,
            onFailedAttempt: (attemptError) => {
              retryCount = attemptError.attemptNumber - 1;
              console.log(
                `Attempt ${
                  attemptError.attemptNumber
                } failed for args ${JSON.stringify(arg)}. ${
                  attemptError.retriesLeft
                } retries left. Error: ${attemptError.message}`,
              );
            },
          },
        );
      } catch (err) {
        status = Status.Error;
        error = err;
        response = null;
      }

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      const variant = getVariant(arg, finalConfig.data.variants);
      const features = getFeatures(arg, context.features);

      const index = context.features.indexOf(features);

      const execution: Execution = {
        id: nanoid(),
        runId,
        features, //TODO: check if works with multiple features
        target: context.target[index],
        result: response ? finalConfig.run.result(response) : null,
        time: executionTime,
        retries:
          finalConfig.run.result["retries" as keyof typeof finalConfig.run.result] ||
          retryCount,
        // TODO:
        // cost: finalConfig.run.result["cost" as keyof typeof finalConfig.run.result] || 0,
        // accuracy:
        //   finalConfig.run.result["accuracy" as keyof typeof finalConfig.run.result] || 0,
        status,
        variant,
      };

      return execution;
    }),
  );

  const executions = (await Promise.all(promises)) as unknown as Execution[];

  // Build run object
  const runData = {
    id: runId,
    name,
    notes: "",
    function: finalConfig.run.function.toString(),
    features: context.features,
    target: context.target,
    variants: context.variants,
    timestamp,
  };
  
  // Wait for all promises to complete
  const benchmark: Benchmark = {
    run: runData,
    executions,
  };

  // Save to db
  await saveRun(runData, executions);

  return benchmark;
}