import type { JsonValue } from "@prisma/client/runtime/library";
import { customRandom, random } from "nanoid";
import pQueue from "p-queue";
import pRetry from "p-retry";
import { disconnectDb, saveRun } from "../db";
import type {
  ArgsContext,
  Benchmark,
  Config,
  Execution,
  ResultContext,
  Run,
  TData,
  TFunction,
  TVariants,
} from "../types";
import { Status } from "../types";
import {
  calculateAccuracy,
  getArgsContext,
  getTargets,
  resolveArgs,
} from "../utils";
// import { validateConfig } from "../utils/config";

export const run = async <
  F extends TFunction,
  D extends TData,
  V extends TVariants,
>(
  config: Config<F, D, V>,
) => {
  const nanoid = customRandom(
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    16,
    random,
  );
  const run_id = nanoid();
  const timestamp = BigInt(Date.now());

  // And you can now properly type the argContext:
  const argContext: ArgsContext<D, V> = getArgsContext(config);

  const fnName = config.function.name;
  const variants = Object.entries(config.variants).map(([key, value]) => {
    if (Array.isArray(value)) {
      return `${value.length}_${key}`;
    }
    return `${key}`;
  });
  const name = `${fnName}-${variants.join("-")}-${timestamp}`;

  // **
  // ** EXECUTIONS
  // **

  // Create queue with concurrency control and interval
  const queue = new pQueue({
    concurrency: config.concurrency,
    interval: config.interval,
    intervalCap: 1,
  });
  // Add all tasks to the queue
  const argsCombinations = resolveArgs(config.args, argContext);
  const executionPromises = argsCombinations.map(
    ({ args, dataIndex, features, variants }) =>
      queue.add(async () => {
        // Generate unique ID for each execution
        const id = nanoid();
        let status: Status = "success";
        let retryCount = 0;
        let result: JsonValue;
        const startTime = Date.now();

        try {
          const response = await pRetry(
            async () => {
              return await config.function(...args);
            },
            {
              retries: config.retries,
              onFailedAttempt: (attemptError) => {
                retryCount = attemptError.attemptNumber - 1;
                console.log(
                  `Attempt ${attemptError.attemptNumber} failed for args ${JSON.stringify(args)}. ${attemptError.retriesLeft} retries left. Error: ${attemptError.message}`,
                );
              },
            },
          );

          result = config.result(response as ResultContext<F>);
        } catch (e) {
          status = "error";
          const error = e instanceof Error ? e : new Error(String(e));
          console.error(
            `Execution failed for args ${JSON.stringify(args)}. Error: ${error.message}`,
          );

          result = {
            error: error.message,
            stack: error.stack,
            name: error.name,
          };
        }

        const endTime = Date.now();
        const executionTime = endTime - startTime;

        const target = getTargets(config)[dataIndex];

        const accuracy = result ? calculateAccuracy(result, target) : null;

        const execution: Execution = {
          id,
          run_id,
          result,
          time: executionTime,
          retries: retryCount,
          status,
          target,
          accuracy,
          args,
          features,
          variants,
          dataIndex,
        };
        return execution;
      }),
  );
  const executions = (await Promise.all(executionPromises)) as Execution[];

  // **
  // ** RUN
  // **
  const run: Run = {
    id: run_id,
    name,
    notes: "",
    function: config.function.toString(),
    timestamp,
  };

  const benchmark: Benchmark = {
    run,
    executions,
  };
  // Save to db
  if (!config.dry) {
    await saveRun(run, executions);
    await disconnectDb();
  }

  return benchmark;
};
