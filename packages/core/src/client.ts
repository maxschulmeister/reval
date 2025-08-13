/**
 * Browser-safe exports from @reval/core
 * This module re-exports types and utilities that are safe to use in client-side environments
 */

// Re-export all types (browser-safe)
export * from "./types";

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