import type { JsonObject, JsonValue } from "@prisma/client/runtime/library";
import { diff } from "json-diff";
import type { Primitive } from "../../types";
import { calculateNumberAccuracy } from "./number";
import { calculateStringAccuracy } from "./text";

/**
 * Calculates accuracy between two JSON objects using structural diff (legacy)
 * @param target - The expected JSON object
 * @param result - The actual JSON object
 * @returns Accuracy as a percentage (0-100)
 */
export function calculateJsonDiffAccuracy(
  target: JsonValue,
  result: JsonValue,
): number {
  // If objects are exactly the same, return 100% accuracy
  if (JSON.stringify(target) === JSON.stringify(result)) {
    return 100;
  }

  // Calculate structural diff
  const diffResult = diff(target, result);

  // If no diff, objects are structurally identical
  if (!diffResult) {
    return 100;
  }

  // Count total properties in both objects to establish baseline
  const countProperties = (obj: any): number => {
    if (obj === null || obj === undefined) return 0;
    if (typeof obj !== "object") return 1;
    if (Array.isArray(obj)) {
      return obj.reduce((sum, item) => sum + countProperties(item), 0);
    }
    return Object.keys(obj).reduce(
      (sum, key) => sum + countProperties(obj[key]),
      Object.keys(obj).length,
    );
  };

  // Count differences in the diff result
  const countDifferences = (diffObj: any): number => {
    if (!diffObj || typeof diffObj !== "object") return 0;

    let differences = 0;

    for (const key in diffObj) {
      const value = diffObj[key];

      // Handle special diff markers
      if (key.endsWith("__added") || key.endsWith("__deleted")) {
        differences += countProperties(value);
      } else if (value && typeof value === "object") {
        // Handle __old/__new pattern
        if (value.__old !== undefined && value.__new !== undefined) {
          differences += 1;
        } else if (Array.isArray(value)) {
          // Handle array diffs
          differences += value.filter(
            (item) =>
              Array.isArray(item) &&
              item.length === 2 &&
              (item[0] === "+" || item[0] === "-" || item[0] === "~"),
          ).length;
        } else {
          // Recursively count nested differences
          differences += countDifferences(value);
        }
      }
    }

    return differences;
  };

  const totalProperties = Math.max(
    countProperties(target),
    countProperties(result),
    1, // Avoid division by zero
  );

  const differences = countDifferences(diffResult);

  // Calculate accuracy as percentage of unchanged properties
  const accuracy = Math.max(0, (1 - differences / totalProperties) * 100);

  return Math.round(accuracy * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculates accuracy between two JSON objects using semantic comparison
 * @param target - The expected JSON object
 * @param result - The actual JSON object
 * @returns Accuracy as a percentage (0-100)
 */
export function calculateJsonAccuracy(
  result: JsonValue,
  target: JsonValue,
): Array<Primitive | JsonObject> {
  const accuracies: Record<string, number> = {};

  // Helper function to recursively compare objects
  const compareValues = (
    targetVal: JsonValue,
    resultVal: JsonValue,
    path: string = "",
  ): void => {
    // Handle null/undefined cases
    if (targetVal === null && resultVal === null) {
      accuracies[path] = 100;
      return;
    }
    if (targetVal === undefined && resultVal === undefined) {
      accuracies[path] = 100;
      return;
    }
    if (
      targetVal === null ||
      targetVal === undefined ||
      resultVal === null ||
      resultVal === undefined
    ) {
      accuracies[path] = 0;
      return;
    }

    // Check if types match
    const targetType = typeof targetVal;
    const resultType = typeof resultVal;

    if (targetType !== resultType) {
      accuracies[path] = 0;
      return;
    }

    // Handle different types
    if (targetType === "string") {
      accuracies[path] = calculateStringAccuracy(
        targetVal as string,
        resultVal as string,
      );
    } else if (targetType === "number") {
      accuracies[path] = calculateNumberAccuracy(
        targetVal as number,
        resultVal as number,
      );
    } else if (targetType === "boolean") {
      accuracies[path] = targetVal === resultVal ? 100 : 0;
    } else if (Array.isArray(targetVal) && Array.isArray(resultVal)) {
      // For arrays, order matters - compare element by element
      const maxLength = Math.max(targetVal.length, resultVal.length);
      for (let i = 0; i < maxLength; i++) {
        const targetItem = i < targetVal.length ? targetVal[i] : null;
        const resultItem = i < resultVal.length ? resultVal[i] : null;
        compareValues(targetItem, resultItem, `${path}[${i}]`);
      }
    } else if (targetType === "object") {
      // For objects, get all unique keys from both objects
      const targetKeys = new Set(Object.keys(targetVal));
      const resultKeys = new Set(Object.keys(resultVal));
      const allKeys = new Set([...targetKeys, ...resultKeys]);

      // Compare each key
      for (const key of allKeys) {
        const targetKeyVal = targetVal[key as keyof typeof targetVal];
        const resultKeyVal = resultVal[key as keyof typeof resultVal];
        compareValues(
          targetKeyVal,
          resultKeyVal,
          path ? `${path}.${key}` : key,
        );
      }
    } else {
      // For other types, use strict equality
      accuracies[path] = targetVal === resultVal ? 100 : 0;
    }
  };

  // Start comparison
  compareValues(target, result);

  // Calculate mean accuracy
  if (accuracies.length === 0) {
    return {
      accuracy: 100,
    }; // Empty objects are considered identical
  }

  const meanAccuracy =
    Object.values(accuracies).reduce((sum, acc) => sum + acc, 0) /
    Object.values(accuracies).length;
  return [Math.round(meanAccuracy * 100) / 100, { details: accuracies }]; // Round to 2 decimal places
}

/**
 * Attempts to parse a string as JSON
 * @param str - String to parse
 * @returns Parsed JSON object or null if parsing fails
 */
export function tryParseJson(str: string): any | null {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}
