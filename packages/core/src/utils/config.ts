/**
 * Configuration validation utilities
 * Provides type-safe validation for config properties with clear error messages
 */

import type { Config } from "../types/config";

/**
 * Validates concurrency value for p-queue
 * @param value - The concurrency value to validate
 * @returns Valid concurrency value or default (10) if undefined
 * @throws Error if value is invalid
 */
export const validateConcurrency = (value: number | undefined): number => {
  if (value === undefined) return 10; // Default when not specified
  if (typeof value !== 'number') {
    throw new Error(`Invalid concurrency: expected number, got ${typeof value}`);
  }
  if (!Number.isInteger(value)) {
    throw new Error(`Invalid concurrency: expected integer, got ${value}`);
  }
  if (value <= 0) {
    throw new Error(`Invalid concurrency: expected positive integer, got ${value}`);
  }
  return value;
};

/**
 * Validates interval value for p-queue
 * @param value - The interval value to validate
 * @returns Valid interval value or default (1000) if undefined
 * @throws Error if value is invalid
 */
export const validateInterval = (value: number | undefined): number => {
  if (value === undefined) return 1000; // Default when not specified
  if (typeof value !== 'number') {
    throw new Error(`Invalid interval: expected number, got ${typeof value}`);
  }
  if (!Number.isInteger(value)) {
    throw new Error(`Invalid interval: expected integer, got ${value}`);
  }
  if (value < 0) {
    throw new Error(`Invalid interval: expected non-negative integer, got ${value}`);
  }
  return value;
};

/**
 * Validates retries value for p-retry
 * @param value - The retries value to validate
 * @returns Valid retries value or default (0) if undefined
 * @throws Error if value is invalid
 */
export const validateRetries = (value: number | undefined): number => {
  if (value === undefined) return 0; // Default when not specified
  if (typeof value !== 'number') {
    throw new Error(`Invalid retries: expected number, got ${typeof value}`);
  }
  if (!Number.isInteger(value)) {
    throw new Error(`Invalid retries: expected integer, got ${value}`);
  }
  if (value < 0) {
    throw new Error(`Invalid retries: expected non-negative integer, got ${value}`);
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
  config: Config<F>
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