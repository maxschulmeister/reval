import * as dataForge from "data-forge";
import fs from "fs";
import type { ArgsContext } from "../types/config";
import { loadConfig } from "./config";

export * from "./config";

export const loadData = async (configPath?: string) => {
  const config = await loadConfig(configPath);
  let df: dataForge.IDataFrame<number, any>;
  let dfFeatures: any;
  let dfTarget: any;

  // Validate basic data configuration
  if (!config.data || Object.keys(config.data).length === 0) {
    throw new Error("Data configuration is required and cannot be empty");
  }

  // Path-based data loading (CSV files)
  if (config.data.path) {
    // Validate file extension
    if (!config.data.path.toLowerCase().endsWith(".csv")) {
      throw new Error(
        "Only CSV files are supported. Please provide a file with .csv extension.",
      );
    }

    // Validate target is required when path is provided (allow empty string as fallback)
    if (!config.data.target) {
      throw new Error(
        "Target column name is required when using path-based data loading",
      );
    }

    // Validate target is not an array when path is provided
    if (Array.isArray(config.data.target)) {
      throw new Error(
        "Target must be a string column name when using path-based data loading, not an array",
      );
    }

    try {
      const csvContent = fs.readFileSync(config.data.path, "utf-8");
      df = dataForge.fromCSV(csvContent);
    } catch (error) {
      throw new Error(`Failed to read CSV file: ${error}`);
    }

    // Validate CSV is not empty
    if (df.count() === 0) {
      throw new Error("CSV file is empty or contains no data rows");
    }

    // Validate target column exists (skip validation for empty string as it's a fallback case)
    const columnNames = df.getColumnNames();
    if (!columnNames.includes(config.data.target)) {
      throw new Error(
        `Target column '${config.data.target}' does not exist in CSV. Available columns: ${columnNames.join(", ")}`,
      );
    }

    // Validate features column exists if specified
    if (config.data.features && typeof config.data.features === "string") {
      if (!columnNames.includes(config.data.features)) {
        throw new Error(
          `Features column '${config.data.features}' does not exist in CSV. Available columns: ${columnNames.join(", ")}`,
        );
      }
    }

    // Validate and apply trim if specified
    if (config.data.trim !== undefined) {
      if (
        typeof config.data.trim !== "number" ||
        !Number.isInteger(config.data.trim)
      ) {
        throw new Error("Trim value must be an integer");
      }
      if (config.data.trim < 0) {
        throw new Error("Trim value cannot be negative");
      }
      if (config.data.trim > df.count()) {
        throw new Error(
          `Trim value (${config.data.trim}) cannot be larger than dataset size (${df.count()})`,
        );
      }
      if (config.data.trim > 0) {
        df = df.take(config.data.trim);
      }
    }

    const dfWithoutTarget = df.dropSeries(config.data.target);
    // Features is single string
    if (config.data.features && typeof config.data.features === "string") {
      dfFeatures = df.getSeries(config.data.features).toArray();

      // Features is array of strings - return as object for easy access
    } else if (config.data.features && Array.isArray(config.data.features)) {
      dfFeatures = {};
      config.data.features.forEach((feature: string) => {
        dfFeatures[feature] = df.getSeries(feature).toArray();
      });
      // Features is not defined and there are more than one column
    } else if (dfWithoutTarget.getColumns().toArray().length > 1) {
      dfFeatures = dfWithoutTarget.toArray();
    } else {
      // Features is not defined and there is only one column
      dfFeatures = dfWithoutTarget
        .toArray()
        .flatMap((feature) => Object.values(feature));
    }

    // Target is single string
    if (config.data.target && typeof config.data.target === "string") {
      dfTarget = df.getSeries(config.data.target).toArray();
    } else {
      // Target is not defined and there are more than one column (fallback)
      dfTarget = df.getSeries(df.getColumnNames()[1]).toArray();
    }
  }
  // Direct data arrays (no path)
  else {
    // Validate target is required
    if (!config.data.target) {
      throw new Error(
        "Target is required when not using path-based data loading",
      );
    }

    // Validate features is required
    if (!config.data.features) {
      throw new Error(
        "Features is required when not using path-based data loading",
      );
    }

    // Validate target is an array
    if (!Array.isArray(config.data.target)) {
      throw new Error(
        "Target must be an array when not using path-based data loading",
      );
    }

    // Validate features is an array or object
    if (
      !Array.isArray(config.data.features) &&
      typeof config.data.features !== "object"
    ) {
      throw new Error(
        "Features must be an array or object when not using path-based data loading",
      );
    }

    // Validate variants when using direct data
    if (!config.data.variants) {
      throw new Error(
        "Variants property is required when not using path-based data loading",
      );
    }

    if (
      typeof config.data.variants !== "object" ||
      Array.isArray(config.data.variants)
    ) {
      throw new Error("Variants must be an object with array values");
    }

    // Validate each variant has array values and is not empty
    for (const [key, value] of Object.entries(config.data.variants)) {
      if (!Array.isArray(value)) {
        throw new Error(
          `Variant '${key}' must be an array, got ${typeof value}`,
        );
      }
      if (value.length === 0) {
        throw new Error(`Variant '${key}' cannot be an empty array`);
      }
    }

    // Create dataframe from direct data
    df = dataForge.fromObject({
      features: config.data.features,
      target: config.data.target,
    });

    dfFeatures = config.data.features;
    dfTarget = config.data.target;
  }

  return { frame: df, features: dfFeatures, target: dfTarget };
};

export const getFeatures = (
  arg: any,
  features: ArgsContext["features"],
): any => {
  let featuresValue: any;

  // Handle features as object (multiple columns)
  if (typeof features === "object" && !Array.isArray(features)) {
    const featureColumns = Object.values(features) as any[][];
    // For object features, find the matching value from any column
    if (Array.isArray(arg)) {
      featuresValue = arg.find((argValue) => {
        if (typeof argValue === "object" && argValue !== null) {
          return Object.values(argValue).some((propValue) =>
            featureColumns.some((column) => column.includes(propValue)),
          );
        }
        return featureColumns.some((column) => column.includes(argValue));
      });

      if (typeof featuresValue === "object" && featuresValue !== null) {
        const matchingInputValue = Object.values(featuresValue).find(
          (propValue) =>
            featureColumns.some((column) => column.includes(propValue)),
        );
        featuresValue = matchingInputValue;
      }
    } else {
      if (typeof arg === "object" && arg !== null) {
        const matchingInputValue = Object.values(arg).find((propValue) =>
          featureColumns.some((column) => column.includes(propValue)),
        );
        featuresValue = matchingInputValue;
      } else {
        const matchingColumn = featureColumns.find((column) =>
          column.includes(arg),
        );
        if (matchingColumn) {
          featuresValue = arg;
        }
      }
    }
  } else if (Array.isArray(features)) {
    // Handle features as array (original behavior)
    if (Array.isArray(arg)) {
      featuresValue = arg.find((argValue) => {
        if (typeof argValue === "object" && argValue !== null) {
          return Object.values(argValue).some((propValue) =>
            features.includes(propValue),
          );
        }
        return features.includes(argValue);
      });

      if (typeof featuresValue === "object" && featuresValue !== null) {
        const matchingInputValue = Object.values(featuresValue).find(
          (propValue) => features.includes(propValue),
        );
        featuresValue = matchingInputValue;
      }
    } else {
      if (typeof arg === "object" && arg !== null) {
        const matchingInputValue = Object.values(arg).find((propValue) =>
          features.includes(propValue),
        );
        featuresValue = matchingInputValue;
      } else if (features.includes(arg)) {
        featuresValue = arg;
      }
    }
  }

  return featuresValue;
};

export const getVariant = (
  arg: any,
  variants: ArgsContext["variants"],
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
            variantArray.includes(propValue),
          );
        }
        // Handle primitive arguments
        return variantArray.includes(argValue);
      });

      if (foundValue !== undefined) {
        // If it's an object, find the specific property that matched
        if (typeof foundValue === "object" && foundValue !== null) {
          const matchingValue = Object.values(foundValue).find((propValue) =>
            variantArray.includes(propValue),
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
          variantArray.includes(propValue),
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

export const combineArgs = (args: Array<any>) => {
  if (args.length === 0) return [];

  const cartesian = (...arrays: any[][]) => {
    return arrays.reduce(
      (acc, curr) => acc.flatMap((x) => curr.map((y) => [...x, y])),
      [[]],
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
