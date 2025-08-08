import "data-forge-fs";
import { customRandom, random, urlAlphabet } from "nanoid";
import pQueue from "p-queue";
import pRetry from "p-retry";
import { saveRun } from "./db/save-run";
import type { Benchmark, Execution } from "./types";
import { Status } from "./types";
import {
  combineArgs,
  getFeatures,
  getVariant,
  loadConfig,
  loadData,
} from "./utils";
import { validateConfig } from "./utils/config";

const nanoid = customRandom(urlAlphabet, 24, random);

const run = async () => {
  const timestamp = Date.now();
  const rawConfig = await loadConfig();
  const config = validateConfig(rawConfig);
  const data = await loadData();
  const context = {
    path: config.data.path,
    features: data.features,
    target: data.target,
    variants: config.data.variants,
  };
  const fnName = config.run.function.name;
  const variants = Object.entries(config.data.variants).map(([key, value]) => {
    if (Array.isArray(value)) {
      return `${value.length}_${key}`;
    }
    return `${key}`;
  });

  // Generate a name based on the function name, variants (and lengths) and timestamp
  const name = `${fnName}-${variants.join("-")}-${timestamp}`;
  const runId = nanoid();

  // Create queue with concurrency control and interval
  const queue = new pQueue({
    concurrency: config.concurrency,
    interval: config.interval,
    intervalCap: 1,
  });

  // Add all tasks to the queue
  const args = combineArgs(config.run.args(context));
  const promises = args.map((arg) =>
    queue.add(async () => {
      let retryCount = 0;
      let startTime: number = Date.now();
      let status: Status = Status.Success;
      let response: Awaited<ReturnType<typeof config.run.function>> | null;
      let error: any;

      try {
        response = await pRetry(
          async () => {
            startTime = Date.now();
            return await config.run.function.apply(null, arg);
          },
          {
            retries: config.retries,
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

      const variant = getVariant(arg, config.data.variants);
      const features = getFeatures(arg, context.features);

      const index = context.features.indexOf(features);

      const execution: Execution = {
        id: nanoid(),
        runId,
        features, //TODO: check if works with multiple features
        target: context.target[index],
        result: response ? config.run.result(response) : null,
        time: executionTime,
        retries:
          config.run.result["retries" as keyof typeof config.run.result] ||
          retryCount,
        // TODO:
        // cost: config.run.result["cost" as keyof typeof config.run.result] || 0,
        // accuracy:
        //   config.run.result["accuracy" as keyof typeof config.run.result] || 0,
        status,
        variant,
      };

      return execution;
    }),
  );

  const executions = (await Promise.all(promises)) as unknown as Execution[];

  // Build run object
  const run = {
    id: runId,
    name,
    notes: "",
    function: config.run.function.toString(),
    features: context.features,
    target: context.target,
    variants: context.variants,
    timestamp,
  };
  // Wait for all promises to complete
  const benchmark: Benchmark = {
    run,
    executions,
  };

  // Save to db
  await saveRun(run, executions);

  return benchmark;
};

run();
