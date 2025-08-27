import fs from "fs";
import { createJiti } from "jiti";
import path from "path";
import { loadConfig as loadTsConfig, register } from "tsconfig-paths";

/**
 * Configuration validation utilities
 * Provides type-safe validation for config properties with clear error messages
 */

import type { Config } from "../types/config";

// Inline the ParametersToArrays type since we need it here
type ParametersToArrays<T> = T extends any[]
  ? {
      [K in keyof T]: T[K] extends object
        ? { [P in keyof T[K]]: T[K][P][] }
        : T[K][];
    }
  : never;

/**
 * Validates concurrency value for p-queue
 * @param value - The concurrency value to validate
 * @returns Valid concurrency value or default (10) if undefined
 * @throws Error if value is invalid
 */

const validateConcurrency = (value: number | undefined): number => {
  if (value === undefined) return 10; // Default when not specified
  if (typeof value !== "number") {
    throw new Error(
      `Invalid concurrency: expected number, got ${typeof value}`,
    );
  }
  if (!Number.isInteger(value)) {
    throw new Error(`Invalid concurrency: expected integer, got ${value}`);
  }
  if (value <= 0) {
    throw new Error(
      `Invalid concurrency: expected positive integer, got ${value}`,
    );
  }
  return value;
};

/**
 * Validates interval value for p-queue
 * @param value - The interval value to validate
 * @returns Valid interval value or default (1000) if undefined
 * @throws Error if value is invalid
 */
const validateInterval = (value: number | undefined): number => {
  if (value === undefined) return 1000; // Default when not specified
  if (typeof value !== "number") {
    throw new Error(`Invalid interval: expected number, got ${typeof value}`);
  }
  if (!Number.isInteger(value)) {
    throw new Error(`Invalid interval: expected integer, got ${value}`);
  }
  if (value < 0) {
    throw new Error(
      `Invalid interval: expected non-negative integer, got ${value}`,
    );
  }
  return value;
};

/**
 * Validates retries value for p-retry
 * @param value - The retries value to validate
 * @returns Valid retries value or default (0) if undefined
 * @throws Error if value is invalid
 */
const validateRetries = (value: number | undefined): number => {
  if (value === undefined) return 0; // Default when not specified
  if (typeof value !== "number") {
    throw new Error(`Invalid retries: expected number, got ${typeof value}`);
  }
  if (!Number.isInteger(value)) {
    throw new Error(`Invalid retries: expected integer, got ${value}`);
  }
  if (value < 0) {
    throw new Error(
      `Invalid retries: expected non-negative integer, got ${value}`,
    );
  }
  return value;
};

/**
 * Validates the entire config object
 * @param config - The configuration object to validate
 * @returns The validated config with proper defaults applied
 * @throws Error if any config property is invalid
 */
export const validateConfig = <F extends (...args: any[]) => Promise<any>>(
  config: Config<F>,
): Config<F> => {
  // Validate top-level properties
  const validatedConcurrency = validateConcurrency(config.concurrency);
  const validatedRetries = validateRetries(config.retries);
  const validatedInterval = validateInterval(config.interval);

  // Return config with validated properties
  return {
    ...config,
    concurrency: validatedConcurrency,
    retries: validatedRetries,
    interval: validatedInterval,
  };
};

/**
 * Type-safe config definition helper
 * @param config - The configuration object to validate and return
 * @returns The same config object with proper typing
 */
export function defineConfig<
  F extends (...args: any[]) => Promise<any>,
  const Features extends string | readonly string[] = string | string[],
>(config: Config<F, Features>) {
  return config;
}

export const loadConfig = async (configPath?: string) => {
  try {
    const configModulePath = path.resolve(
      process.cwd(),
      configPath || "reval.config.ts",
    );

    if (!fs.existsSync(configModulePath)) {
      throw new Error(
        `Configuration file not found: ${configModulePath}\n` +
          `Please ensure 'reval.config.ts' exists in the current directory.\n` +
          `Run 'reval init' to create a new project structure.`,
      );
    }

    // Get the directory where the config file is located
    const configDir = path.dirname(configModulePath);

    // Load TypeScript configuration to get path aliases
    const tsConfig = loadTsConfig(configDir);
    let cleanup: (() => void) | undefined;

    // Register path aliases if tsconfig.json exists and has paths
    if (tsConfig.resultType === "success" && tsConfig.paths) {
      cleanup = register({
        baseUrl: tsConfig.absoluteBaseUrl,
        paths: tsConfig.paths,
      });
    }

    try {
      // Create jiti instance to handle TypeScript files and imports
      const jiti = createJiti(configModulePath, {
        // Enable interopDefault to handle both default and named exports
        interopDefault: true,
        // Disable cache for config files to ensure fresh reloads during development
        fsCache: false,
        moduleCache: false,
      });

      // Use jiti to import the TypeScript config file
      const configModule = (await jiti.import(configModulePath)) as any;
      return configModule.default || configModule;
    } finally {
      // Clean up path alias registration
      if (cleanup) {
        cleanup();
      }
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Configuration file not found")
    ) {
      throw error;
    }
    console.error("Config loading error:", error);
    throw new Error(
      `Failed to load config from "${configPath || "reval.config.ts"}": ${error}`,
    );
  }
};
