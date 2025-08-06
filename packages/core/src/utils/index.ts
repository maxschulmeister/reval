import * as dataForge from "data-forge";
import "data-forge-fs";
import type { ArgsContext } from "../types/config";
import { Config } from "../types/config";

export const combineArgs = (args: Array<any>) => {
  if (args.length === 0) return [];

  const cartesian = (...arrays: any[][]) => {
    return arrays.reduce(
      (acc, curr) => acc.flatMap((x) => curr.map((y) => [...x, y])),
      [[]]
    );
  };

  // Handle array of objects with array values
  if (typeof args[0] === "object" && !Array.isArray(args[0])) {
    const keys = Object.keys(args[0]);
    const values = keys.map((key) => args[0][key]);
    const combinations = cartesian(...values);
    return combinations.map((combo) => [
      keys.reduce((obj, key, index) => ({ ...obj, [key]: combo[index] }), {}),
    ]);
  }

  // Handle array of arrays
  return cartesian(...args);
};

export const loadConfig = async () => {
  try {
    const configModule = await import("../../reval.config");
    return configModule.default || configModule;
  } catch (error) {
    console.error('Config loading error:', error);
    throw new Error(`Failed to load config: ${error}`);
  }
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
      features: config.data.features,
      output: config.data.target,
    });
    dfFeatures = df.getSeries("features").toArray();
    dfTarget = df.getSeries("target").toArray();
  }

  console.log("dfFeatures", dfFeatures);
  console.log("dfTarget", dfTarget);

  return { frame: df, features: dfFeatures, target: dfTarget };
};

export const getFeatures = (
  arg: any,
  features: ArgsContext["features"]
): any => {
  let featuresValue: any;

  // Find the features value that matches with data.features
  if (Array.isArray(arg)) {
    // For array arguments, find the value that exists in features
    featuresValue = arg.find((argValue) => {
      if (typeof argValue === "object" && argValue !== null) {
        return Object.values(argValue).some((propValue) =>
          features.includes(propValue)
        );
      }
      return features.includes(argValue);
    });

    // If it's an object, find the specific property that matched
    if (typeof featuresValue === "object" && featuresValue !== null) {
      const matchingInputValue = Object.values(featuresValue).find(
        (propValue) => features.includes(propValue)
      );
      featuresValue = matchingInputValue;
    }
  } else {
    // Single argument case
    if (typeof arg === "object" && arg !== null) {
      const matchingInputValue = Object.values(arg).find((propValue) =>
        features.includes(propValue)
      );
      featuresValue = matchingInputValue;
    } else if (features.includes(arg)) {
      featuresValue = arg;
    }
  }

  return featuresValue;
};

export const getVariant = (
  arg: any,
  variants: ArgsContext["variants"]
): Record<string, any> => {
  const variantValues: Record<string, any> = {};

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

  return variantValues;
};

export function defineConfig<F extends (args: any) => Promise<any>>(
  config: Config<F>
) {
  return config;
}
