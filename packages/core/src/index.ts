import { dirname, resolve } from "path";

export const coreRoot = resolve(
  dirname(new URL(import.meta.url).pathname),
  "../",
);

export * from "./api";
export * from "./constants";
export * from "./db";
export * from "./types";
export * from "./utils";
