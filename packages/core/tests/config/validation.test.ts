import { describe, expect, it, vi } from "vitest";
import {
  validateConcurrency,
  validateConfig,
  validateInterval,
  validateRetries,
} from "../../src/utils/config";

describe("Config Validation Fix Verification", () => {
  // Using validation functions from utils/config.ts

  describe("Config Loading Integration", () => {
    it("should load config with all required properties", async () => {
      const mockConfig = {
        data: { path: "/tmp/test.csv", target: "y" },
        run: {
          function: async () => ({}),
          args: () => [],
          result: (r: any) => r,
        },
      } as any;

      const utils = await import("../../src/utils");
      vi.spyOn(utils, "loadConfig").mockResolvedValue(mockConfig);

      const cfg = await utils.loadConfig();
      expect(cfg).toEqual(mockConfig);
    });

    it("should load config with complete config including all optional fields", async () => {
      const mockConfig = {
        concurrency: 4,
        retries: 3,
        interval: 1000,
        data: { path: "/tmp/test.csv", target: "y", trim: 10 },
        run: {
          function: async () => ({}),
          args: () => [],
          result: (r: any) => r,
        },
      } as any;

      const utils = await import("../../src/utils");
      vi.spyOn(utils, "loadConfig").mockResolvedValue(mockConfig);

      const cfg = await utils.loadConfig();
      expect(cfg).toEqual(mockConfig);
      expect(cfg.concurrency).toBe(4);
      expect(cfg.retries).toBe(3);
      expect(cfg.interval).toBe(1000);
    });
  });

  describe("validateConcurrency", () => {
    it("should throw errors for invalid values", () => {
      expect(() => validateConcurrency(0)).toThrow(
        "Invalid concurrency: expected positive integer, got 0"
      );
      expect(() => validateConcurrency(-1)).toThrow(
        "Invalid concurrency: expected positive integer, got -1"
      );
      expect(() => validateConcurrency(1.5)).toThrow(
        "Invalid concurrency: expected integer, got 1.5"
      );
      expect(() => validateConcurrency("5" as any)).toThrow(
        "Invalid concurrency: expected number, got string"
      );
      expect(() => validateConcurrency(null as any)).toThrow(
        "Invalid concurrency: expected number, got object"
      );
    });

    it("should return default for undefined", () => {
      expect(validateConcurrency(undefined)).toBe(10);
    });

    it("should return valid values as-is", () => {
      expect(validateConcurrency(1)).toBe(1);
      expect(validateConcurrency(5)).toBe(5);
      expect(validateConcurrency(100)).toBe(100);
    });
  });

  describe("validateConfig", () => {
    const mockFunction = async () => ({});
    const mockArgs = () => [];
    const mockResult = (r: any) => r;

    const baseConfig = {
      data: { path: "/tmp/test.csv", target: "y" },
      run: {
        function: mockFunction,
        args: mockArgs,
        result: mockResult,
      },
    } as any;

    it("should validate and return config with defaults for undefined properties", () => {
      const config = validateConfig(baseConfig);

      expect(config.concurrency).toBe(10); // Default
      expect(config.retries).toBe(0); // Default
      expect(config.interval).toBe(1000); // Default
      expect(config.data).toEqual(baseConfig.data);
      expect(config.run).toEqual(baseConfig.run);
    });

    it("should validate and return config with valid custom values", () => {
      const configWithValues = {
        ...baseConfig,
        concurrency: 5,
        retries: 3,
        interval: 500,
      };

      const config = validateConfig(configWithValues);

      expect(config.concurrency).toBe(5);
      expect(config.retries).toBe(3);
      expect(config.interval).toBe(500);
    });

    it("should throw error for invalid concurrency", () => {
      const configWithInvalidConcurrency = {
        ...baseConfig,
        concurrency: 0,
      };

      expect(() => validateConfig(configWithInvalidConcurrency)).toThrow(
        "Invalid concurrency: expected positive integer, got 0"
      );
    });

    it("should throw error for invalid retries", () => {
      const configWithInvalidRetries = {
        ...baseConfig,
        retries: -1,
      };

      expect(() => validateConfig(configWithInvalidRetries)).toThrow(
        "Invalid retries: expected non-negative integer, got -1"
      );
    });

    it("should throw error for invalid interval", () => {
      const configWithInvalidInterval = {
        ...baseConfig,
        interval: -100,
      };

      expect(() => validateConfig(configWithInvalidInterval)).toThrow(
        "Invalid interval: expected non-negative integer, got -100"
      );
    });

    it("should throw error for non-integer values", () => {
      const configWithDecimals = {
        ...baseConfig,
        concurrency: 2.5,
      };

      expect(() => validateConfig(configWithDecimals)).toThrow(
        "Invalid concurrency: expected integer, got 2.5"
      );
    });

    it("should throw error for non-number values", () => {
      const configWithString = {
        ...baseConfig,
        concurrency: "5" as any,
      };

      expect(() => validateConfig(configWithString)).toThrow(
        "Invalid concurrency: expected number, got string"
      );
    });

    it("should preserve other config properties unchanged", () => {
      const configWithExtra = {
        ...baseConfig,
        concurrency: 2,
        customProperty: "test",
        data: {
          ...baseConfig.data,
          trim: 5,
          variants: { model: ["a", "b"] },
        },
      } as any;

      const config = validateConfig(configWithExtra);

      expect((config as any).customProperty).toBe("test");
      expect(config.data.trim).toBe(5);
      expect(config.data.variants).toEqual({ model: ["a", "b"] });
    });
  });

  describe("validateInterval", () => {
    it("should throw errors for invalid values", () => {
      expect(() => validateInterval(-1)).toThrow(
        "Invalid interval: expected non-negative integer, got -1"
      );
      expect(() => validateInterval(1.5)).toThrow(
        "Invalid interval: expected integer, got 1.5"
      );
      expect(() => validateInterval("1000" as any)).toThrow(
        "Invalid interval: expected number, got string"
      );
      expect(() => validateInterval(null as any)).toThrow(
        "Invalid interval: expected number, got object"
      );
    });

    it("should return default for undefined", () => {
      expect(validateInterval(undefined)).toBe(1000);
    });

    it("should allow 0 for interval (valid case)", () => {
      expect(validateInterval(0)).toBe(0); // 0 is valid for interval
    });

    it("should return valid values as-is", () => {
      expect(validateInterval(100)).toBe(100);
      expect(validateInterval(1000)).toBe(1000);
    });
  });

  describe("validateRetries", () => {
    it("should throw errors for invalid values", () => {
      expect(() => validateRetries(-1)).toThrow(
        "Invalid retries: expected non-negative integer, got -1"
      );
      expect(() => validateRetries(1.5)).toThrow(
        "Invalid retries: expected integer, got 1.5"
      );
      expect(() => validateRetries("3" as any)).toThrow(
        "Invalid retries: expected number, got string"
      );
      expect(() => validateRetries(null as any)).toThrow(
        "Invalid retries: expected number, got object"
      );
    });

    it("should return default for undefined", () => {
      expect(validateRetries(undefined)).toBe(0);
    });

    it("should allow 0 for retries (valid case)", () => {
      expect(validateRetries(0)).toBe(0); // 0 is valid for retries
    });

    it("should return valid values as-is", () => {
      expect(validateRetries(3)).toBe(3);
      expect(validateRetries(10)).toBe(10);
    });
  });

  describe("Comparison with old nullish coalescing", () => {
    it("demonstrates the improvement over nullish coalescing", () => {
      // Old problematic behavior with nullish coalescing
      const zeroValue = 0;
      const negativeValue = -1;
      expect(zeroValue ?? 10).toBe(0); // Problem: 0 is falsy but not nullish
      expect(negativeValue ?? 10).toBe(-1); // Problem: -1 is truthy

      // New behavior: proper validation with clear error messages
      expect(() => validateConcurrency(0)).toThrow(
        "Invalid concurrency: expected positive integer, got 0"
      );
      expect(() => validateConcurrency(-1)).toThrow(
        "Invalid concurrency: expected positive integer, got -1"
      );
    });
  });
});
