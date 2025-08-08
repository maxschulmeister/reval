import { Status } from "@reval/core/src/types";
import { quantile } from "simple-statistics";

export type GroupCategory = "good" | "ok" | "bad";

/**
 * Groups numeric values into 3 categories: 'good', 'ok', 'bad'
 * Uses quantiles to divide into thirds (bottom third 'bad', middle 'ok', top 'good')
 * @param values Array of numeric values
 * @param value The specific value to categorize
 * @returns The category for the given value
 */
export const categorizeValue = (
  values: number[],
  value: number,
): GroupCategory => {
  if (values.length === 0) return "ok";

  // Remove null/undefined values and sort
  const validValues = values
    .filter((v) => v != null && !isNaN(v))
    .sort((a, b) => a - b);

  if (validValues.length === 0) return "ok";
  if (validValues.length === 1) return "ok";

  // Calculate quantiles (33rd and 67th percentiles)
  const q33 = quantile(validValues, 0.33);
  const q67 = quantile(validValues, 0.67);

  if (value <= q33) return "bad";
  if (value >= q67) return "good";
  return "ok";
};

/**
 * Groups an array of numeric values into categories
 * @param values Array of numeric values
 * @returns Object with arrays for each category
 */
export const groupValues = (values: number[]) => {
  const result = {
    good: [] as number[],
    ok: [] as number[],
    bad: [] as number[],
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
  executions: Array<{ status: string }>,
): number => {
  if (executions.length === 0) return 0;
  const successCount = executions.filter(
    (e) => e.status === Status.Success,
  ).length;
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
