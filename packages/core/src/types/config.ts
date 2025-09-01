import type { JsonValue } from "@prisma/client/runtime/library";

export type Primitive = string | number | boolean;
export type Target = Primitive;

export type TFunction = (...args: any[]) => Promise<unknown> | unknown;
export type TData = readonly Record<string, JsonValue>[];
export type TVariants = Record<string, JsonValue[]>;
export type TTarget<D extends TData> = keyof D[number] extends string
  ? keyof D[number]
  : never;

export interface Config<
  F extends TFunction = TFunction,
  D extends TData = TData,
  V extends TVariants = TVariants,
  T extends TTarget<D> = TTarget<D>,
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
  args: (context: ArgsContext<D, V>) => ParametersToArrays<F>;
  result: (context: ResultContext<F>) => {
    output: string;
  } & Record<string, JsonValue>;
}

export type ArgsContext<D extends TData, V extends TVariants> = {
  data: ToArrays<D>;
  variants: V;
};

export type ResultContext<F extends TFunction> =
  ReturnType<F> extends Promise<infer U> ? U : ReturnType<F>;

type ParametersToArrays<T> = T extends TFunction
  ? ToArrays<Parameters<T>>
  : never;

// Works for Tuples (...args) and Arrays
export type ToArrays<T> = T extends [infer First, ...infer Rest]
  ? First extends object
    ? { [K in keyof First]: First[K][] }
    : First extends Primitive
      ? Array<First[]>
      : [never, ...ToArrays<Rest>]
  : T extends (infer U)[]
    ? U extends object
      ? { [K in keyof U]: U[K][] }
      : never
    : never;
