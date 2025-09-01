import type { Status } from "@reval/core";
import { quantile } from "simple-statistics";

export type GroupCategory = 1 | 2 | 3;

/**
 * Groups numeric values into 3 categories: 1 (bad), 2 (ok), 3 (good)
 * Uses quantiles to divide into thirds (bottom third '1', middle '2', top '3')
 * @param values Array of numeric values
 * @param value The specific value to categorize
 * @returns The category for the given value (1=bad, 2=ok, 3=good)
 */
export const categorizeValue = (
  values: number[],
  value: number,
): GroupCategory => {
  if (values.length === 0) return 2;

  // Remove null/undefined values and sort
  const validValues = values
    .filter((v) => v != null && !isNaN(v))
    .sort((a, b) => a - b);

  if (validValues.length === 0) return 2;
  if (validValues.length === 1) return 2;

  // Calculate quantiles (33rd and 67th percentiles)
  const q33 = quantile(validValues, 0.33);
  const q67 = quantile(validValues, 0.67);

  if (value <= q33) return 1;
  if (value >= q67) return 3;
  return 2;
};

/**
 * Groups an array of numeric values into categories
 * @param values Array of numeric values
 * @returns Object with arrays for each category (1=bad, 2=ok, 3=good)
 */
export const groupValues = (values: number[]) => {
  const result = {
    1: [] as number[], // bad
    2: [] as number[], // ok
    3: [] as number[], // good
  };

  values.forEach((value) => {
    const category = categorizeValue(values, value);
    result[category].push(value);
  });

  return result;
};

/**
 * Calculate success rate percentage
 */
export const calculateSuccessRate = (
  executions: Array<{ status: Status }>,
): number => {
  if (executions.length === 0) return 0;
  const successCount = executions.filter((e) => e.status === "success").length;
  return Math.round((successCount / executions.length) * 100);
};

/**
 * Calculate average execution time
 */
export const calculateAverageTime = (
  executions: Array<{ time: number }>,
): number => {
  if (executions.length === 0) return 0;
  const totalTime = executions.reduce((sum, e) => sum + e.time, 0);
  return Math.round(totalTime / executions.length);
};
