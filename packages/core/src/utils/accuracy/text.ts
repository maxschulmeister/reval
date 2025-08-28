import { distance } from "fastest-levenshtein";
import { calculateJsonAccuracy, tryParseJson } from "./json";

/**
 * Calculates accuracy between two strings, attempting JSON comparison first
 * @param target - The expected string value
 * @param result - The actual string value
 * @returns Accuracy as a percentage (0-100)
 */
export function calculateStringAccuracy(
  target: string,
  result: string,
): number {
  // If strings are exactly the same, return 100% accuracy
  if (target === result) {
    return 100;
  }

  // Try to parse both strings as JSON
  const targetJson = tryParseJson(target);
  const resultJson = tryParseJson(result);

  // If both are valid JSON, use JSON comparison
  if (targetJson !== null && resultJson !== null) {
    return calculateJsonAccuracy(targetJson, resultJson);
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