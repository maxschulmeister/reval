import type { Run } from "../types";
import { PATH_DELIMITER, COLUMN_EXPANSION_CONFIG } from "../constants";
import { titleCase } from "text-title-case";

type ColumnExpansionConfig = typeof COLUMN_EXPANSION_CONFIG;

// Utility function to format field names for display (matches UI table logic)
export function formatFieldName(fieldName: string): string {
  let formatted = fieldName.includes(PATH_DELIMITER)
    ? fieldName.split(PATH_DELIMITER).slice(1).join(" ")
    : fieldName;

  // Replace underscores with spaces and apply title case
  formatted = formatted.replace(/_/g, " ");
  return titleCase(formatted);
}

// Helper function to flatten nested objects for column extraction
export function flattenObject(
  obj: Record<string, unknown>,
  prefix = "",
  maxDepth = 0, // Default to no expansion
  currentDepth = 0,
): string[] {
  return Object.keys(obj).flatMap((key) => {
    const path = prefix ? `${prefix}${PATH_DELIMITER}${key}` : key;
    const value = obj[key];
    // Get expansion depth for this column (use root key for nested paths)
    const rootKey = prefix ? prefix.split(PATH_DELIMITER)[0] : key;
    const config = COLUMN_EXPANSION_CONFIG[rootKey];
    // Check if this specific key should be excluded at the current level
    if (config?.exclude?.includes(key) && prefix === rootKey) {
      return [path]; // Stop expansion here, treat as leaf
    }

    const configuredDepth = config?.depth ?? 0;
    const effectiveMaxDepth = maxDepth === 0 ? configuredDepth : maxDepth;

    // Check if we should stop expanding
    const shouldStopExpanding =
      effectiveMaxDepth !== -1 && currentDepth >= effectiveMaxDepth;

    const isObject = (value: unknown): value is Record<string, unknown> =>
      Object.prototype.toString.call(value) === "[object Object]";

    if (shouldStopExpanding || !isObject(value)) {
      return [path];
    }

    return flattenObject(value, path, effectiveMaxDepth, currentDepth + 1);
  });
}

// Helper function to get value at nested path
export function getValueAtPath(
  obj: Record<string, unknown>,
  path: string,
): unknown {
  return path.split(PATH_DELIMITER).reduce((current: unknown, key: string) => {
    return (current as Record<string, unknown>)?.[key];
  }, obj);
}

// Generate chart summary data (mirrors data-charts.tsx logic)
export function generateChartSummary(runs: Run[]) {
  if (!runs || runs.length === 0) return { chartData: [], numericKeys: [] };

  // Get all numeric keys from flattened run data
  const allPaths = [
    ...new Set(
      runs.flatMap((run) => flattenObject(run as Record<string, unknown>)),
    ),
  ];
  const numericKeys = allPaths.filter((path) => {
    const sampleValue = getValueAtPath(
      runs[0] as Record<string, unknown>,
      path,
    );
    return typeof sampleValue === "number";
  });

  // Group runs by variant combinations
  const variantGroups = new Map<string, Run[]>();

  runs.forEach((run) => {
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

  // Create aggregated chart data
  const chartData = Array.from(variantGroups.entries()).map(
    ([variantKey, variantRuns]) => {
      const aggregatedMetrics: Record<string, number> = {};

      numericKeys.forEach((key) => {
        const values = variantRuns
          .map((run) => {
            const value = getValueAtPath(run as Record<string, unknown>, key);
            return typeof value === "number" ? value : null;
          })
          .filter((value): value is number => value !== null);

        if (values.length > 0) {
          aggregatedMetrics[key] =
            values.reduce((sum, val) => sum + val, 0) / values.length;
        }
      });

      return {
        ...aggregatedMetrics,
        variants: variantRuns[0].variants,
        variantDetails: variantKey,
        runCount: variantRuns.length,
      } as Record<string, any> & {
        variants: any;
        variantDetails: string;
        runCount: number;
      };
    },
  );

  return { chartData, numericKeys };
}
