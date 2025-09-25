import { getValueAtPath, formatFieldName } from "@rectangle0/reval-core/client";
import type { Run } from "@rectangle0/reval-core/types";
import type { Table } from "@tanstack/react-table";
import Palette from "iwanthue/palette";
import type { AccuracyChartDataItem, VariantChartDataItem } from "./chart-types";

/**
 * Get numeric keys from visible table columns
 */
export function getNumericKeys(table: Table<Run>): string[] {
  return table
    .getVisibleLeafColumns()
    .filter((column) => column.columnDef.meta?.type === "number")
    .map((column) => column.columnDef.id)
    .filter((key): key is string => typeof key === "string");
}

/**
 * Generate variant chart data from runs
 */
export function generateVariantChartData(
  data: Run[],
  numericKeys: string[],
): VariantChartDataItem[] {
  if (!data || data.length === 0) return [];

  // Group runs by variant combinations
  const variantGroups = new Map<string, Run[]>();

  data.forEach((run: Run) => {
    const variantKey = run.variants
      ? Object.entries(run.variants as Record<string, unknown>)
          .map(([key, value]) => `${key}: ${value}`)
          .join(", ")
      : "No variants";

    if (!variantGroups.has(variantKey)) {
      variantGroups.set(variantKey, []);
    }
    variantGroups.get(variantKey)!.push(run);
  });

  // Get unique variant combinations for color palette
  const uniqueVariants = Array.from(variantGroups.keys());

  // Generate color palette for unique variants
  const palette = Palette.generateFromValues("variants", uniqueVariants, {
    defaultColor: "#fff",
  });

  // Create aggregated chart data
  return Array.from(variantGroups.entries()).map(
    ([variantKey, runs], index) => {
      // Calculate mean values for each numeric metric
      const aggregatedMetrics: Record<string, number> = {};

      numericKeys.forEach((key) => {
        const values = runs
          .map((run) => {
            // Use shared utility function for nested object navigation
            const value = getValueAtPath(run as Record<string, unknown>, key);
            return typeof value === "number" ? value : null;
          })
          .filter((value): value is number => value !== null);

        if (values.length > 0) {
          aggregatedMetrics[key] =
            values.reduce((sum, val) => sum + val, 0) / values.length;
        }
      });

      // Use the first run's variants for display
      const firstRun = runs[0];

      return {
        ...aggregatedMetrics,
        variants: firstRun.variants,
        variant: `${variantKey} (${runs.length} runs)`,
        variantDetails: variantKey,
        color: palette.get(variantKey),
        runCount: runs.length,
        sortValue: 0, // Will be set later based on selected sort metric
      };
    },
  );
}

/**
 * Extract accuracy keys from runs data, including nested details
 */
function extractAccuracyKeys(data: Run[]): string[] {
  const accuracyKeys = new Set<string>();

  const extractKeysRecursively = (
    obj: Record<string, unknown>,
    prefix = "",
  ) => {
    Object.entries(obj).forEach(([key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      // Skip the main value field
      if (key === "value") return;

      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        // If it's an object, recurse into it but don't add the object key itself
        extractKeysRecursively(value as Record<string, unknown>, fullKey);
      } else {
        // It's a leaf value (not an object), add it as an accuracy key
        accuracyKeys.add(fullKey);
      }
    });
  };

  data.forEach((run) => {
    if (run.score && typeof run.score === "object") {
      const score = run.score as Record<string, unknown>;
      if (score.accuracy && typeof score.accuracy === "object") {
        const accuracy = score.accuracy as Record<string, unknown>;
        extractKeysRecursively(accuracy);
      }
    }
  });

  return Array.from(accuracyKeys);
}

/**
 * Generate accuracy chart data from runs
 */
export function generateAccuracyChartData(
  data: Run[],
): AccuracyChartDataItem[] {
  if (!data || data.length === 0) return [];

  // Filter for successful runs only
  const successfulRuns = data.filter((run) => run.status === "success");
  if (successfulRuns.length === 0) return [];

  const accuracyKeys = extractAccuracyKeys(successfulRuns);
  if (accuracyKeys.length === 0) return [];

  // Generate color palette for accuracy keys
  const palette = Palette.generateFromValues("accuracy", accuracyKeys, {
    defaultColor: "#fff",
  });

  // Helper function to get nested value from object using dot notation
  const getNestedValue = (
    obj: Record<string, unknown>,
    path: string,
  ): unknown => {
    return path.split(".").reduce((current: unknown, key: string) => {
      if (current && typeof current === "object" && !Array.isArray(current)) {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj as unknown);
  };

  // Create aggregated accuracy data for each key
  return accuracyKeys.map((key) => {
    let totalValue = 0;
    let count = 0;

    successfulRuns.forEach((run) => {
      if (run.score && typeof run.score === "object") {
        const score = run.score as Record<string, unknown>;
        if (score.accuracy && typeof score.accuracy === "object") {
          const accuracy = score.accuracy as Record<string, unknown>;
          const value = getNestedValue(accuracy, key);

          if (value !== undefined && typeof value === "number") {
            totalValue += value;
            count++;
          }
        }
      }
    });

    const averageValue = count > 0 ? totalValue / count : 0;

    // Clean up the key for display - remove "details." prefix and format
    const cleanKey = key.startsWith('details.') ? key.substring(8) : key;
    const displayKey = formatFieldName(cleanKey);
    
    return {
      accuracyKey: displayKey,
      accuracyKeyDetails: displayKey,
      color: palette.get(key),
      runCount: count,
      totalRuns: count,
      averageValue,
      // Keep these for compatibility but they're not used in this context
      successCount: 0,
      errorCount: 0,
      successRate: averageValue,
      errorRate: 100 - averageValue,
    };
  });
}
/**
 * Calculate Y-axis domain based on data values
 */
export function calculateYAxisDomain(
  data: Array<Record<string, unknown>>,
  metricKey: string,
): [number, number] {
  if (data.length === 0) return [0, 1];

  const values = data
    .map((item) => {
      const value = item[metricKey];
      return typeof value === "number" ? value : 0;
    })
    .filter((value) => value > 0);

  if (values.length === 0) return [0, 1];

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  
  // For percentage values (like success/error rates), cap at 100%
  if (metricKey.includes('Rate') || metricKey.includes('rate')) {
    return [0, 100];
  }
  
  // For other metrics, add padding
  const range = maxValue - minValue;
  const padding = range * 0.1; // 10% padding

  return [Math.max(0, minValue - padding), maxValue + padding];
}