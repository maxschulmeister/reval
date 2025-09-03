import type { JsonValue } from "@prisma/client/runtime/library";
import { calculateJsonAccuracy } from "./json";
import { calculateNumberAccuracy } from "./number";
import { calculateStringAccuracy } from "./text";

/**
 * Calculates accuracy between target and result values
 * @param target - The expected value
 * @param result - The actual value
 * @returns Accuracy as a percentage (0-100) or null if types don't match
 */
export function calculateAccuracy(
  result: JsonValue,
  target: JsonValue,
): number | null {
  // Check if both values are of the same type
  const resultType = typeof result;
  const targetType = typeof target;

  if (resultType !== targetType) {
    return null;
  }

  // Handle number comparison
  if (resultType === "number" && targetType === "number") {
    return calculateNumberAccuracy(result as number, target as number);
  }

  // // If both are valid JSON, use JSON comparison
  // if (targetJson !== null && resultJson !== null) {
  //   return calculateJsonAccuracy(targetJson, resultJson);
  // }
  // Handle object comparison
  if (resultType === "object" && targetType === "object") {
    return calculateJsonAccuracy(result, target);
  }

  // Handle string comparison
  if (resultType === "string" && targetType === "string") {
    return calculateStringAccuracy(result as string, target as string);
  }

  // For other types, return null (unsupported)
  return null;
}
