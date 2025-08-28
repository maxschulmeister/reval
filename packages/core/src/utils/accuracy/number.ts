/**
 * Calculates accuracy between two numbers
 * @param target - The expected number value
 * @param result - The actual number value
 * @returns Accuracy as a percentage (0-100)
 */
export function calculateNumberAccuracy(
  target: number,
  result: number,
): number {
  // If numbers are exactly the same, return 100% accuracy
  if (target === result) {
    return 100;
  }

  // Calculate accuracy based on the difference
  // Use absolute difference and normalize it
  const difference = Math.abs(target - result);
  const maxValue = Math.max(Math.abs(target), Math.abs(result));

  // If both numbers are 0, they're the same
  if (maxValue === 0) {
    return 100;
  }

  // Calculate percentage accuracy (inverse of relative error)
  const relativeError = difference / maxValue;
  const accuracy = Math.max(0, (1 - relativeError) * 100);

  return Math.round(accuracy * 100) / 100; // Round to 2 decimal places
}