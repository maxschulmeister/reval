import type { JsonValue } from "@prisma/client/runtime/library";
import type { Score } from "../../types";
import { calculateJsonAccuracy } from "./json";
import { calculateNumberAccuracy } from "./number";
import { calculateStringAccuracy } from "./text";

/**
 * Calculates accuracy between target and result values
 * @param target - The expected value
 * @param result - The actual value
 * @returns Accuracy as a percentage (0-100) or null if types don't match
 */
export function getScore(result: JsonValue, target: JsonValue): Score {
  // Check if both values are of the same type
  const resultType = typeof result;
  const targetType = typeof target;

  if (resultType !== targetType) {
    return null;
  }

  // Handle number comparison
  if (resultType === "number" && targetType === "number") {
    return {
      accuracy: calculateNumberAccuracy(result as number, target as number),
    };
  }

  // Handle object comparison
  if (resultType === "object" && targetType === "object") {
    return {
      accuracy: calculateJsonAccuracy(result, target),
      // NOTE: Diffing is quite useless, because the order of the keys is different most of the time.
      // diff: calculateJsonDiffAccuracy(result, target),
    };
  }

  // Handle string comparison
  if (resultType === "string" && targetType === "string") {
    return {
      accuracy: calculateStringAccuracy(result as string, target as string),
    };
  }

  // Handle boolean comparison
  if (resultType === "boolean" && targetType === "boolean") {
    return { accuracy: result === target ? 100 : 0 };
  }

  // For other types, return null (unsupported)
  return null;
}
