import { distance } from "fastest-levenshtein";

/**
 * Calculates accuracy between two strings, attempting JSON comparison first
 * @param target - The expected string value
 * @param result - The actual string value
 * @returns Accuracy as a percentage (0-100)
 */
export function calculateStringAccuracy(
  result: string,
  target: string,
): number {
  // If strings are exactly the same, return 100% accuracy
  if (target === result) {
    return 100;
  }

  // Fall back to string comparison using Levenshtein distance
  const editDistance = distance(target, result);
  const maxLength = Math.max(target.length, result.length);

  // If both strings are empty, they're the same
  if (maxLength === 0) {
    return 100;
  }

  // Calculate accuracy as percentage of similarity
  const accuracy = Math.max(0, (1 - editDistance / maxLength) * 100);

  return Math.round(accuracy * 100) / 100; // Round to 2 decimal places
}
