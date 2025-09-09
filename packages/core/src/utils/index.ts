import { Prisma } from "@prisma/client/client";
import type { JsonValue } from "@prisma/client/runtime/library";
import { serializeError } from "serialize-error";
import { getDb } from "../db";
import type {
  Args,
  ArgsContext,
  Config,
  DataToArrays,
  TData,
  TFunction,
  TTarget,
  TVariants,
} from "../types/config";

export * from "./accuracy";
export * from "./chart";
export * from "./config";

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
  argsFn: Args<F, D, V>,
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
      // Not great, but works.
      const args = argsFn(
        proxiedContext as ArgsContext<D, V>,
      ) as unknown as Parameters<F>;

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

export function getArgsContext<
  F extends TFunction,
  D extends TData,
  V extends TVariants,
  T extends TTarget<D>,
>(config: Config<F, D, V, T>): Parameters<Config<F, D, V, T>["args"]>[0] {
  // Transform array of objects to object of arrays
  // Example:
  // input = [{file: stringify, brand: string}, ...]
  // ->
  // input ={file: string[], brand: string[]}

  const data = {} as DataToArrays<D>;
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
  T extends TTarget<D>,
>(config: Config<F, D, V, T>) {
  const { data, target } = config;
  return data.map((item) => item[target as keyof typeof item]);
}

// Helper function to apply JsonNull to nullable JSON fields only
export const withPrismaJsonNull = (obj: any) => {
  const result = { ...obj };

  const prisma = getDb();

  const jsonFields = Object.entries(prisma.run.fields)
    .filter(([_, field]) => field.typeName === "Json")
    .map(([fieldName, _]) => fieldName);

  Object.keys(result).forEach((key) => {
    if (
      jsonFields.includes(key) &&
      (result[key] === null || result[key] === undefined)
    ) {
      result[key] = Prisma.JsonNull;
    }
  });

  return result;
};

export const ensureJson = (obj: any): JsonValue => {
  try {
    return JSON.parse(
      JSON.stringify(obj instanceof Error ? serializeError(obj) : obj),
    );
  } catch (e) {
    throw new Error(`${obj} is not JSON serializable: ${e}`);
  }
};
