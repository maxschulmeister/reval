import type { JsonObject, JsonValue } from "@prisma/client/runtime/library";
import { diff } from "json-diff-ts";
import { calculateNumberAccuracy } from "./number";
import { calculateStringAccuracy } from "./text";

/**
 * Calculates accuracy between two JSON objects using structural diff (legacy)
 * @param target - The expected JSON object
 * @param result - The actual JSON object
 * @returns Accuracy as a percentage (0-100)
 */
export function calculateJsonDiffAccuracy(
  result: JsonValue,
  target: JsonValue,
) {
  // If objects are exactly the same, return 100% accuracy
  if (JSON.stringify(target) === JSON.stringify(result)) {
    return {
      score: 100,
      object: { old: target, new: result, changes: [] },
    };
  }

  // Calculate structural diff using json-diff-ts
  const diffResult = diff(target, result);

  // If no diff, objects are structurally identical
  if (!diffResult || diffResult.length === 0) {
    return {
      score: 100,
      object: { old: target, new: result, changes: [] },
    };
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

  // Count differences in the diff result from json-diff-ts
  const countDifferences = (changes: any[]): number => {
    if (!changes || !Array.isArray(changes)) return 0;

    let differences = 0;

    for (const change of changes) {
      if (change.type === "ADD" || change.type === "DELETE") {
        differences += countProperties(change.value);
      } else if (change.type === "UPDATE") {
        differences += 1;
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

  return {
    score: Math.round(accuracy * 100) / 100,
    object: { old: target, new: result, changes: diffResult },
  }; // Round to 2 decimal places
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
): { value: number; details: JsonObject } {
  const allAccuracies: number[] = [];

  // Helper function to recursively compare objects
  const compareValues = (
    targetVal: JsonValue,
    resultVal: JsonValue,
  ): JsonValue => {
    // Handle null/undefined cases
    if (targetVal === null && resultVal === null) {
      allAccuracies.push(100);
      return 100;
    }
    if (targetVal === undefined && resultVal === undefined) {
      allAccuracies.push(100);
      return 100;
    }
    if (
      targetVal === null ||
      targetVal === undefined ||
      resultVal === null ||
      resultVal === undefined
    ) {
      allAccuracies.push(0);
      return 0;
    }

    // Check if types match
    const targetType = typeof targetVal;
    const resultType = typeof resultVal;

    if (targetType !== resultType) {
      allAccuracies.push(0);
      return 0;
    }

    // Handle different types
    if (targetType === "string") {
      const accuracy = calculateStringAccuracy(
        targetVal as string,
        resultVal as string,
      );
      allAccuracies.push(accuracy);
      return accuracy;
    } else if (targetType === "number") {
      const accuracy = calculateNumberAccuracy(
        targetVal as number,
        resultVal as number,
      );
      allAccuracies.push(accuracy);
      return accuracy;
    } else if (targetType === "boolean") {
      const accuracy = targetVal === resultVal ? 100 : 0;
      allAccuracies.push(accuracy);
      return accuracy;
    } else if (Array.isArray(targetVal) && Array.isArray(resultVal)) {
      // For arrays, order matters - compare element by element
      const maxLength = Math.max(targetVal.length, resultVal.length);
      const arrayAccuracies = [];
      for (let i = 0; i < maxLength; i++) {
        const targetItem = i < targetVal.length ? targetVal[i] : null;
        const resultItem = i < resultVal.length ? resultVal[i] : null;
        arrayAccuracies[i] = compareValues(targetItem, resultItem);
      }
      return arrayAccuracies;
    } else if (targetType === "object") {
      // For objects, get all unique keys from both objects
      const targetKeys = new Set(Object.keys(targetVal));
      const resultKeys = new Set(Object.keys(resultVal));
      const allKeys = new Set([...targetKeys, ...resultKeys]);

      const objectAccuracies: Record<string, JsonValue> = {};
      for (const key of allKeys) {
        const targetKeyVal = targetVal[key as keyof typeof targetVal];
        const resultKeyVal = resultVal[key as keyof typeof resultVal];
        objectAccuracies[key] = compareValues(targetKeyVal, resultKeyVal);
      }
      return objectAccuracies;
    } else {
      // For other types, use strict equality
      const accuracy = targetVal === resultVal ? 100 : 0;
      allAccuracies.push(accuracy);
      return accuracy;
    }
  };

  // Start comparison
  const details = compareValues(target, result);

  // Calculate mean accuracy
  if (allAccuracies.length === 0) {
    return {
      value: 100,
      details: {},
    }; // Empty objects are considered identical
  }

  const meanAccuracy =
    allAccuracies.reduce((sum, acc) => sum + acc, 0) / allAccuracies.length;
  return {
    value: Math.round(meanAccuracy * 100) / 100,
    details: details as JsonObject,
  };
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
