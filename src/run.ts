import dataForge from "data-forge";
import "data-forge-fs";
import PQueue from "p-queue";
import pRetry from "p-retry";
import { combineArgs } from "./utils";

const run = async () => {
  const configModule = await import("../reval.config");
  const config = configModule.default || configModule;

  let df;
  let dfIn;
  let dfOut;
  if (
    config.data.path &&
    typeof config.data.in === "string" &&
    typeof config.data.out === "string"
  ) {
    df = dataForge.readFileSync(config.data.path).parseCSV();

    if (config.data.trim) {
      df = df.take(config.data.trim);
    }

    dfIn = config.data.in
      ? df.getSeries(config.data.in).toArray()
      : df.getSeries(df.getColumnNames()[0]).toArray();
    dfOut = config.data.out
      ? df.getSeries(config.data.out).toArray()
      : df.getSeries(df.getColumnNames()[1]).toArray();
  } else {
    df = dataForge.fromObject({
      input: config.data.in,
      output: config.data.out,
    });
    dfIn = df.getSeries("input").toArray();
    dfOut = df.getSeries("output").toArray();
  }

  const context = {
    path: config.data.path,
    in: dfIn,
    out: dfOut,
    variants: config.data.variants,
  };

  const args = combineArgs(config.run.args(context));

  console.log(`Generated ${args.length} combinations:`, args.slice(0, 3));

  // Create queue with concurrency control and 1-second interval
  const queue = new PQueue({
    concurrency: config.concurrency ?? 10,
    interval: config.interval ?? 1000,
    intervalCap: 1,
  });

  // Add all tasks to the queue
  const promises = args.map((arg) =>
    queue.add(async () => {
      let retryCount = 0;
      let startTime: number;
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
      const executionTime = endTime - startTime!;

      return {
        result: response || error,
        time: executionTime,
        retries: retryCount,
        state,
      };
    })
  );

  // Wait for all promises to complete
  await Promise.all(promises);
};

run();
