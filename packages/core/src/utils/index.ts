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
    if (
      config.data.target === undefined ||
      config.data.target === null ||
      typeof config.data.target !== "string"
    ) {
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
    if (
      config.data.target !== "" &&
      !columnNames.includes(config.data.target)
    ) {
      throw new Error(
        `Target column '${config.data.target}' does not exist in CSV. Available columns: ${columnNames.join(", ")}`,
      );
    }

    // Validate features column exists if specified
    if (
      config.data.features &&
      typeof config.data.features === "string" &&
      config.data.features !== ""
    ) {
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
    if (config.data.features && config.data.features !== "") {
      dfFeatures = df.getSeries(config.data.features).toArray();
    } else if (dfWithoutTarget.getColumns().toArray().length > 1) {
      dfFeatures = dfWithoutTarget.toArray();
    } else {
      dfFeatures = dfWithoutTarget
        .toArray()
        .flatMap((feature) => Object.values(feature));
    }

    if (config.data.target && config.data.target !== "") {
      dfTarget = df.getSeries(config.data.target).toArray();
    } else {
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

  // Find the features value that matches with data.features
  if (Array.isArray(arg)) {
    // For array arguments, find the value that exists in features
    featuresValue = arg.find((argValue) => {
      if (typeof argValue === "object" && argValue !== null) {
        return Object.values(argValue).some((propValue) =>
          features.includes(propValue),
        );
      }
      return features.includes(argValue);
    });

    // If it's an object, find the specific property that matched
    if (typeof featuresValue === "object" && featuresValue !== null) {
      const matchingInputValue = Object.values(featuresValue).find(
        (propValue) => features.includes(propValue),
      );
      featuresValue = matchingInputValue;
    }
  } else {
    // Single argument case
    if (typeof arg === "object" && arg !== null) {
      const matchingInputValue = Object.values(arg).find((propValue) =>
        features.includes(propValue),
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

// Object expansion utilities for nested object display
// Used by both UI and CLI packages for consistent object display

/**
 * Type guard to check if a value is a plain object
 */
export const isObject = (value: unknown): value is Record<string, unknown> =>
  Object.prototype.toString.call(value) === "[object Object]";

/**
 * Type guard to check if a value is a string
 */
export const isString = (value: unknown): value is string =>
  typeof value === "string";

/**
 * Type guard to check if a value is a number
 */
export const isNumber = (value: unknown): value is number =>
  typeof value === "number";

/**
 * Type guard to check if a value is a boolean
 */
export const isBoolean = (value: unknown): value is boolean =>
  typeof value === "boolean";

/**
 * Type guard to check if a string contains valid JSON
 */
export const isJson = (value: unknown): value is string => {
  if (typeof value !== "string") {
    return false;
  }
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
};

/**
 * Represents a flattened object path with its value
 */
export interface FlattenedPath {
  /** Dot-separated path (e.g., "user.profile.name") */
  path: string;
  /** The value at this path */
  value: unknown;
  /** Display title derived from the path */
  title: string;
}

/**
 * Recursively flattens a nested object into dot-separated paths
 * @param obj - The object to flatten
 * @param prefix - Internal prefix for recursion (leave empty for top-level call)
 * @returns Record with flattened paths as keys and values
 */
export const flattenObject = (
  obj: Record<string, unknown>,
  prefix = "",
): Record<string, unknown> => {
  const result: Record<string, unknown> = {};

  Object.keys(obj).forEach((key) => {
    const path = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];

    if (isObject(value)) {
      // Recursively flatten nested objects
      Object.assign(result, flattenObject(value, path));
    } else {
      result[path] = value;
    }
  });

  return result;
};

/**
 * Gets flattened paths with metadata for display purposes
 * @param obj - The object to process
 * @param prefix - Optional prefix for all paths
 * @returns Array of flattened path objects with titles
 */
export const getObjectPaths = (
  obj: Record<string, unknown>,
  prefix = "",
): FlattenedPath[] => {
  const paths: FlattenedPath[] = [];

  Object.keys(obj).forEach((key) => {
    const path = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];

    // Create display title by removing prefix and joining with spaces
    const title = path.split(".").slice(prefix ? 1 : 0).join(" ");

    if (isObject(value)) {
      // Recursively process nested objects
      paths.push(...getObjectPaths(value, path));
    } else {
      paths.push({ path, value, title });
    }
  });

  return paths;
};

/**
 * Expands object properties in a flat record structure
 * Useful for expanding execution results, variants, etc.
 * @param data - Array of objects to analyze for expansion
 * @returns Array of all possible flattened paths found in the data
 */
export const getExpandableProperties = <T extends Record<string, unknown>>(
  data: T[],
): FlattenedPath[] => {
  if (data.length === 0) return [];

  // Use first item as a reference for structure
  const sample = data[0];
  const expandablePaths: FlattenedPath[] = [];

  Object.keys(sample).forEach((key) => {
    const value = sample[key];
    if (isObject(value)) {
      // This property contains an object, expand its paths
      expandablePaths.push(...getObjectPaths(value, key));
    }
  });

  return expandablePaths;
};

/**
 * Gets a value from an object using a dot-separated path
 * @param obj - The object to query
 * @param path - Dot-separated path (e.g., "user.profile.name")
 * @returns The value at the path, or undefined if not found
 */
export const getValueByPath = (
  obj: Record<string, unknown>,
  path: string,
): unknown => {
  const keys = path.split(".");
  let current: any = obj;

  for (const key of keys) {
    if (current == null || typeof current !== "object") {
      return undefined;
    }
    current = current[key];
  }

  return current;
};
