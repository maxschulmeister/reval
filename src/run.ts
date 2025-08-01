import "data-forge-fs";
import PQueue from "p-queue";
import pRetry from "p-retry";
import { combineArgs, getCurrentVariant, loadConfig, loadData } from "./utils";

const run = async () => {
  const config = await loadConfig();

  const data = await loadData();

  const context = {
    path: config.data.path,
    in: data.in,
    out: data.out,
    variants: config.data.variants,
  };

  // Generate a runId based on the function name, variants (and lengths) and timestamp
  const fnName = config.run.function.name;
  const variants = Object.entries(config.data.variants).map(([key, value]) => {
    if (Array.isArray(value)) {
      return `${value.length}_${key}`;
    }
    return `${key}`;
  });
  const timestamp = Date.now();
  const runId = `${fnName}-${variants.join("-")}-${timestamp}`;
  console.log(runId);

  // Create queue with concurrency control and 1-second interval
  const queue = new PQueue({
    concurrency: config.concurrency ?? 10,
    interval: config.interval ?? 1000,
    intervalCap: 1,
  });

  // Add all tasks to the queue
  const args = combineArgs(config.run.args(context));
  const promises = args.map((arg) =>
    queue.add(async () => {
      let retryCount = 0;
      let startTime: number = Date.now();
      let state: "success" | "error" | undefined;
      let response: any;
      let error: any;

      try {
        response = await pRetry(
          async () => {
            startTime = Date.now();

            return await config.run.function(...arg);
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
        state = "error";
        error = err;
        response = null;
      }

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      const variant = getCurrentVariant(arg, config.data.variants, context.in);
      console.log(variant);

      return {
        result: response || error,
        runId: runId,
        args: arg,
        time: executionTime,
        retries: retryCount,
        state,
        variant,
      };
    })
  );

  // Wait for all promises to complete
  await Promise.all(promises);
};

run();
