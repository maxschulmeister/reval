import { calculateStringAccuracy } from "./text";
import { calculateNumberAccuracy } from "./number";

/**
 * Calculates accuracy between target and result values
 * @param target - The expected value
 * @param result - The actual value
 * @returns Accuracy as a percentage (0-100) or null if types don't match
 */
export function calculateAccuracy(
  target: string | number,
  result: string | number,
): number | null {
  // Check if both values are of the same type
  const targetType = typeof target;
  const resultType = typeof result;

  if (targetType !== resultType) {
    return null;
  }

  // Handle number comparison
  if (targetType === "number" && resultType === "number") {
    return calculateNumberAccuracy(target as number, result as number);
  }

  // Handle string comparison
  if (targetType === "string" && resultType === "string") {
    return calculateStringAccuracy(target as string, result as string);
  }

  // For other types, return null (unsupported)
  return null;
}