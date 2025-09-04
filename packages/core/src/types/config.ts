import type { InputJsonValue, JsonValue } from "@prisma/client/runtime/library";

export type Primitive = string | number | boolean;
export type Target = Primitive;

export type TFunction = (
  ...args: any[]
) => Promise<InputJsonValue> | InputJsonValue;
export type TData = readonly Record<string, JsonValue>[];
export type TVariants = Record<string, JsonValue[]>;
export type TTarget<D extends TData> = keyof D[number] extends string
  ? keyof D[number]
  : never;

export interface Config<
  F extends TFunction,
  D extends TData,
  V extends TVariants,
  T extends TTarget<D>,
> {
  concurrency?: number;
  retries?: number;
  interval?: number;
  trim?: number;
  dry?: boolean;
  data: D;
  target: T;
  variants: V;
  function: F;
  args: Args<F, D, V>;
  result: (context: ResultContext<F>) => {
    output: JsonValue;
  } & Record<string, JsonValue>;
}

export type Args<F extends TFunction, D extends TData, V extends TVariants> = (
  context: ArgsContext<D, V>,
) => ParametersToArrays<F>;

export type ArgsContext<D extends TData, V extends TVariants> = {
  data: DataToArrays<D>;
  variants: V;
};

export type ResultContext<F extends TFunction> =
  ReturnType<F> extends Promise<infer U> ? U : ReturnType<F>;

type ParametersToArrays<F> = F extends TFunction
  ? ArgsToArrays<Parameters<F>>
  : never;

// TODO: NOT fully type safe. Object allows foreign keys (TS limitation)
export type ArgsToArrays<A> = A extends [infer First, ...infer Rest]
  ? First extends object
    ? [{ [K in keyof First]: First[K][] }, ...ArgsToArrays<Rest>]
    : First extends Primitive
      ? [First[], ...ArgsToArrays<Rest>]
      : never
  : [];

export type ArgsArraysToSingles<A> = A extends [infer First, ...infer Rest]
  ? First extends object
    ? [
        { [K in keyof First]: First[K] extends [infer X] ? X : never },
        ...ArgsArraysToSingles<Rest>,
      ]
    : First extends Primitive
      ? [First extends [infer X] ? X : never, ...ArgsArraysToSingles<Rest>]
      : never
  : [];

export type DataToArrays<D> = D extends (infer U)[]
  ? U extends object
    ? { [K in keyof U]: U[K][] }
    : never
  : never;

export type DataArraysToSingles<D> = D extends (infer U)[]
  ? U extends object
    ? { [K in keyof U]: U[K] extends [infer X] ? X : never }
    : never
  : never;
