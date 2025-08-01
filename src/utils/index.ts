import dataForge from "data-forge";
import "data-forge-fs";
import type { Context } from "../types/config";

export const combineArgs = (input: Array<any>) => {
  if (input.length === 0) return [];

  const cartesian = (...arrays: any[][]) => {
    return arrays.reduce(
      (acc, curr) => acc.flatMap((x) => curr.map((y) => [...x, y])),
      [[]]
    );
  };

  // Handle array of objects with array values
  if (typeof input[0] === "object" && !Array.isArray(input[0])) {
    const keys = Object.keys(input[0]);
    const values = keys.map((key) => input[0][key]);
    const combinations = cartesian(...values);
    return combinations.map((combo) => [
      keys.reduce((obj, key, index) => ({ ...obj, [key]: combo[index] }), {}),
    ]);
  }

  // Handle array of arrays
  return cartesian(...input);
};

export const loadConfig = async () => {
  const configModule = await import("@config");
  return configModule.default || configModule;
};

export const loadData = async () => {
  const config = await loadConfig();
  let df;
  let dfFeatures;
  let dfTarget;
  if (config.data.path && typeof config.data.target === "string") {
    df = dataForge.readFileSync(config.data.path).parseCSV();

    if (config.data.trim) {
      df = df.take(config.data.trim);
    }

    const dfWithoutTarget = df.dropSeries(config.data.target);
    if (config.data.features) {
      dfFeatures = df.getSeries(config.data.features).toArray();
    } else if (dfWithoutTarget.getColumns().toArray().length > 1) {
      dfFeatures = dfWithoutTarget.toArray();
    } else {
      dfFeatures = dfWithoutTarget
        .toArray()
        .flatMap((feature) => Object.values(feature));
    }

    if (config.data.target) {
      dfTarget = df.getSeries(config.data.target).toArray();
    } else {
      dfTarget = df.getSeries(df.getColumnNames()[1]).toArray();
    }
  } else {
    df = dataForge.fromObject({
      input: config.data.features,
      output: config.data.target,
    });
    dfFeatures = df.getSeries("features").toArray();
    dfTarget = df.getSeries("target").toArray();
  }

  console.log("dfFeatures", dfFeatures);
  console.log("dfTarget", dfTarget);

  return { frame: df, features: dfFeatures, target: dfTarget };
};

export const getCurrentVariant = (
  arg: any,
  variants: Context["variants"],
  inputData: Context["features"]
): Record<string, any> & { input?: any } => {
  const variantValues: Record<string, any> = {};
  let inputValue: any;

  // Find the input value that matches with data.features
  if (Array.isArray(arg)) {
    // For array arguments, find the value that exists in inputData
    inputValue = arg.find((argValue) => {
      if (typeof argValue === "object" && argValue !== null) {
        return Object.values(argValue).some((propValue) =>
          inputData.includes(propValue)
        );
      }
      return inputData.includes(argValue);
    });

    // If it's an object, find the specific property that matched
    if (typeof inputValue === "object" && inputValue !== null) {
      const matchingInputValue = Object.values(inputValue).find((propValue) =>
        inputData.includes(propValue)
      );
      inputValue = matchingInputValue;
    }
  } else {
    // Single argument case
    if (typeof arg === "object" && arg !== null) {
      const matchingInputValue = Object.values(arg).find((propValue) =>
        inputData.includes(propValue)
      );
      inputValue = matchingInputValue;
    } else if (inputData.includes(arg)) {
      inputValue = arg;
    }
  }

  // For each variant key, find the corresponding value in the current arg
  Object.entries(variants).forEach(([variantKey, variantArray]) => {
    // Check if arg is an array (multiple parameters)
    if (Array.isArray(arg)) {
      // Find the value that exists in this variant's array
      const foundValue = arg.find((argValue) => {
        // Handle object arguments - check if any property value matches
        if (typeof argValue === "object" && argValue !== null) {
          return Object.values(argValue).some((propValue) =>
            variantArray.includes(propValue)
          );
        }
        // Handle primitive arguments
        return variantArray.includes(argValue);
      });

      if (foundValue !== undefined) {
        // If it's an object, find the specific property that matched
        if (typeof foundValue === "object" && foundValue !== null) {
          const matchingValue = Object.values(foundValue).find((propValue) =>
            variantArray.includes(propValue)
          );
          variantValues[variantKey] = matchingValue;
        } else {
          variantValues[variantKey] = foundValue;
        }
      }
    } else {
      // Single argument case
      if (typeof arg === "object" && arg !== null) {
        const matchingValue = Object.values(arg).find((propValue) =>
          variantArray.includes(propValue)
        );
        if (matchingValue !== undefined) {
          variantValues[variantKey] = matchingValue;
        }
      } else if (variantArray.includes(arg)) {
        variantValues[variantKey] = arg;
      }
    }
  });

  return {
    ...variantValues,
    ...(inputValue !== undefined && { input: inputValue }),
  };
};
