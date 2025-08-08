import type { Execution } from "@types";
import "data-forge-fs";
import { nanoid } from "nanoid";
import pQueue from "p-queue";
import pRetry from "p-retry";
import { saveRun } from "./db/save-run";
import type { Benchmark } from "./types";
import {
  combineArgs,
  getFeatures,
  getVariant,
  loadConfig,
  loadData,
} from "./utils";
import { validateConfig } from "./utils/config";

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
      let status: "success" | "error" = "success";
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
                } retries left. Error: ${attemptError.message}`
              );
            },
          }
        );
      } catch (err) {
        status = "error";
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
        retries: retryCount,
        status,
        variant,
      };

      return execution;
    })
  );

  const executions = (await Promise.all(promises)) as unknown as Execution[];

  // Build run object
  const run = {
    id: runId,
    name,
    notes: "",
    function: config.run.function.name,
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
