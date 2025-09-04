import type { JsonValue } from "@prisma/client/runtime/library";
import { customRandom, random } from "nanoid";
import pQueue from "p-queue";
import pRetry from "p-retry";
import { disconnectDb, getDb } from "../db";
import type {
  ArgsContext,
  Config,
  Eval,
  ResultContext,
  Reval,
  Run,
  TData,
  TFunction,
  TTarget,
  TVariants,
} from "../types";
import { Status } from "../types";
import {
  ensureJson,
  getArgsContext,
  getScore,
  getTargets,
  resolveArgs,
  withPrismaJsonNull,
} from "../utils";
// import { validateConfig } from "../utils/config";

export const runEval = async <
  F extends TFunction,
  D extends TData,
  V extends TVariants,
  T extends TTarget<D>,
>(
  config: Config<F, D, V, T>,
) => {
  const nanoid = customRandom(
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    16,
    random,
  );
  const eval_id = nanoid();
  const timestamp = new Date();

  // And you can now properly type the argContext:
  const argContext: ArgsContext<D, V> = getArgsContext(config);

  const fnName = config.function.name;
  const variants = Object.entries(config.variants).map(([key, value]) => {
    if (Array.isArray(value)) {
      return `${value.length} ${key.endsWith("s") ? key : key + "s"}`;
    }
    return `${key}`;
  });
  const name = `${fnName} ${variants.join(" ")} ${timestamp
    .toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .replace(/\//g, "-")}`;

  // **
  // ** RUNS
  // **

  // Create queue with concurrency control and interval
  const queue = new pQueue({
    concurrency: config.concurrency,
    interval: config.interval,
    intervalCap: 1,
  });
  // Add all tasks to the queue
  const argsCombinations = resolveArgs(config.args, argContext);
  const runPromises = argsCombinations.map(
    ({ args, dataIndex, features, variants }) =>
      queue.add(async () => {
        // Generate unique ID for each run
        const id = nanoid();
        let status: Status = "success";
        let retryCount = 0;
        let result: JsonValue;
        const startTime = Date.now();

        try {
          const response = await pRetry(
            async () => {
              try {
                return await config.function(...args);
              } catch (error) {
                throw error instanceof Error
                  ? error
                  : new Error(JSON.stringify(error));
              }
            },
            {
              retries: config.retries,
              onFailedAttempt: ({ error, attemptNumber, retriesLeft }) => {
                retryCount = attemptNumber - 1;
                console.log(
                  `Attempt ${attemptNumber} failed for args ${JSON.stringify(args)}. ${retriesLeft} retries left. Error: ${error.message}`,
                );
              },
            },
          );
          result = config.result(response as ResultContext<F>);
        } catch (error) {
          console.error(
            `Run failed for args ${JSON.stringify(args)}. Error: ${error instanceof Error ? error.message : error}`,
          );
          status = "error";
          result = { output: ensureJson(error) };
        }

        // try {
        //   const response = await pRetry(
        //     async () => {
        //       try {
        //         return await config.function(...args);
        //       } catch (fnError) {
        //         throw fnError instanceof Error
        //           ? fnError
        //           : new Error(JSON.stringify(fnError));
        //       }
        //     },
        //     {
        //       retries: config.retries,
        //       onFailedAttempt: (attemptError) => {
        //         retryCount = attemptError.attemptNumber - 1;
        //         console.log(
        //           `Attempt ${attemptError.attemptNumber} failed for args ${JSON.stringify(args)}. ${attemptError.retriesLeft} retries left. Error: ${attemptError.message}`,
        //         );
        //       },
        //     },
        //   );
        //   result = config.result(response as ResultContext<F>);
        // } catch (error) {
        //   console.error(
        //     `Run failed for args ${JSON.stringify(args)}. Error: ${error instanceof Error ? error.message : error}`,
        //   );
        //   status = "error";
        //   result = { output: ensureJson(error) };
        // }

        const endTime = Date.now();
        const executionTime = endTime - startTime;

        const target = getTargets(config)[dataIndex];

        const score = result.output ? getScore(result.output, target) : null;

        const run: Run = {
          id,
          eval_id,
          result,
          time: executionTime,
          retries: retryCount,
          status,
          target,
          score,
          args,
          features,
          variants,
          dataIndex,
        };
        return run;
      }),
  );
  const runs = (await Promise.all(runPromises)) as Run[];

  // **
  // ** EVAL
  // **
  const eval_: Eval = {
    id: eval_id,
    name,
    notes: "",
    function: config.function.toString(),
    timestamp,
  };

  const benchmark: Reval = {
    eval: eval_,
    runs,
  };
  // Save to db
  if (!config.dry) {
    await saveEval(eval_, runs);
    await disconnectDb();
  }

  return benchmark;
};

// Function to save an eval and its runs
export const saveEval = async (eval_: Eval, runs: Run[]) => {
  const prisma = getDb();
  try {
    await prisma.eval.create({
      data: eval_,
    });
    console.debug(`Saved eval ${eval_.id} to database`);
  } catch (error) {
    console.error(`Failed to save eval ${eval_.id} to database`, error);
    throw error;
  }

  try {
    // Then create all Runs (which reference the Eval)
    await Promise.all(
      runs.map((run) =>
        prisma.run.create({
          data: withPrismaJsonNull(run),
        }),
      ),
    );
    console.debug(`Saved ${runs.length} Runs to database`);
  } catch (error) {
    console.error(
      `Failed to save all Runs of eval ${eval_.id} to database`,
      error,
    );
    throw error;
  }
};
