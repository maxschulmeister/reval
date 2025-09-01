import { Prisma } from "@prisma/client/client";
import type { JsonValue } from "@prisma/client/runtime/library";
import * as dataForge from "data-forge";
import type {
  ArgsContext,
  Config,
  TData,
  TFunction,
  ToArrays,
  TVariants,
} from "../types/config";
import { loadConfig } from "./config";

export * from "./accuracy";
export * from "./config";

export const loadData = async (configPath?: string) => {
  const config = await loadConfig(configPath);

  // Validate basic data configuration
  if (!config.data || Object.keys(config.data).length === 0) {
    throw new Error("Data configuration is required and cannot be empty");
  }

  let df: dataForge.IDataFrame<number, any>;
  try {
    df = dataForge.fromObject(config.data);
  } catch (error) {
    throw new Error(`Failed to create DataFrame: ${error}`);
  }

  // Validate JSON is not empty
  if (df.count() === 0) {
    throw new Error("JSON file is empty or contains no data rows");
  }

  // Validate and apply trim if specified
  if (config.trim !== undefined) {
    if (typeof config.trim !== "number" || !Number.isInteger(config.trim)) {
      throw new Error("Trim value must be an integer");
    }
    if (config.trim < 0) {
      throw new Error("Trim value cannot be negative");
    }
    if (config.trim > df.count()) {
      throw new Error(
        `Trim value (${config.trim}) cannot be larger than dataset size (${df.count()})`,
      );
    }
    if (config.trim > 0) {
      df = df.take(config.trim);
    }
  }

  const dfFeatures = dataForge.fromObject(config.data);
  const dfTarget = dataForge.fromObject(config.target);

  // Validate each variant has array values and is not empty
  for (const [key, value] of Object.entries(config.variants)) {
    if (value.length === 0) {
      throw new Error(`Variant '${key}' cannot be an empty array`);
    }
  }

  return { frame: df, features: dfFeatures, target: dfTarget };
};

type ResolvedArg<F extends TFunction> = {
  args: Parameters<F>;
  dataIndex: number;
  features: Record<string, JsonValue> | null;
  variants: Record<string, JsonValue> | null;
};

export const resolveArgs = <
  F extends TFunction,
  D extends TData,
  V extends TVariants,
>(
  argsFn: (context: ArgsContext<D, V>) => Parameters<F>,
  argContext: ArgsContext<D, V>,
): Array<ResolvedArg<F>> => {
  const results: Array<ResolvedArg<F>> = [];

  // Track what gets accessed during execution
  const usedFeatures = new Set<string>();
  const usedVariants = new Set<string>();

  const dataKeys = Object.keys(argContext.data);
  const variantKeys = Object.keys(argContext.variants);
  const dataLength =
    dataKeys.length > 0 ? argContext.data[dataKeys[0]].length : 0;

  // Create proxies to track access
  const createDataProxy = (rowData: Record<string, JsonValue>) =>
    new Proxy(rowData, {
      get(target, prop) {
        if (typeof prop === "string" && dataKeys.includes(prop)) {
          usedFeatures.add(prop);
        }
        return target[prop as string];
      },
    });

  const createVariantProxy = (variants: Record<string, JsonValue>) =>
    new Proxy(variants, {
      get(target, prop) {
        if (typeof prop === "string" && variantKeys.includes(prop)) {
          usedVariants.add(prop);
        }
        return target[prop as string];
      },
    });

  // Generate variant combinations (start with all, filter later)
  const allVariantCombos =
    variantKeys.length === 0
      ? [{}]
      : variantKeys.reduce(
          (acc, key) =>
            acc.flatMap((combo) =>
              argContext.variants[key].map((value) => ({
                ...combo,
                [key]: value,
              })),
            ),
          [{}] as Array<Record<string, JsonValue>>,
        );

  // Process each data row with each variant combination
  for (let dataIndex = 0; dataIndex < dataLength; dataIndex++) {
    const rowData: Record<string, JsonValue> = {};
    dataKeys.forEach((key) => {
      rowData[key] = argContext.data[key][dataIndex];
    });

    for (const variantCombo of allVariantCombos) {
      // Create proxied context to track access
      const proxiedContext = {
        data: createDataProxy(rowData),
        variants: createVariantProxy(variantCombo),
      };

      // Generate args and track what was accessed
      const args = argsFn(proxiedContext as ArgsContext<D, V>);

      // In the resolveArgs function, update the features and variants creation:

      // Extract only the features and variants that were actually used
      const features: ResolvedArg<F>["features"] = usedFeatures.size
        ? Object.fromEntries(
            Array.from(usedFeatures).map((key) => [key, rowData[key]]),
          )
        : null;

      const variants: ResolvedArg<F>["variants"] = usedVariants.size
        ? Object.fromEntries(
            Array.from(usedVariants).map((key) => [key, variantCombo[key]]),
          )
        : null;

      results.push({ args, dataIndex, features, variants });
    }
  }

  // Filter out duplicate combinations if no variants were actually used
  if (usedVariants.size === 0) {
    // Keep only one result per dataIndex
    const uniqueResults = new Map<number, ResolvedArg<F>>();
    results.forEach((result) => {
      if (!uniqueResults.has(result.dataIndex)) {
        uniqueResults.set(result.dataIndex, result);
      }
    });
    return Array.from(uniqueResults.values());
  }

  return results;
};

// Legacy alias for backward compatibility
export const combineArgs = resolveArgs;

export function getArgsContext<
  F extends TFunction,
  D extends TData,
  V extends TVariants,
>(config: Config<F, D, V>): Parameters<Config<F, D, V>["args"]>[0] {
  // Transform array of objects to object of arrays
  // Example:
  // input = [{file: stringify, brand: string}, ...]
  // ->
  // input ={file: string[], brand: string[]}

  const data = {} as ToArrays<D>;
  config.data.reduce((acc, item) => {
    Object.entries(item).forEach(([key, value]) => {
      if (!acc[key]) {
        acc[key] = [] as (typeof value)[];
      }
      (acc[key] as (typeof value)[]).push(value);
    });
    return acc;
  }, data);

  // Return the context object directly, don't call config.args()
  return {
    data,
    variants: config.variants,
  };
}

export function getTargets<
  F extends TFunction,
  D extends TData,
  V extends TVariants,
>(config: Config<F, D, V>) {
  const { data, target } = config;
  return data.map((item) => ({
    [target]: item[target as keyof typeof item],
  }));
}

// Helper function to apply JsonNull to nullable fields
export const withPrismaJsonNull = (obj: any) => {
  const result = { ...obj };
  Object.keys(result).forEach((key) => {
    if (result[key] === null || result[key] === undefined) {
      result[key] = Prisma.JsonNull;
    }
  });
  return result;
};
