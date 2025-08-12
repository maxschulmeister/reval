import { describe, expect, it } from "vitest";
import { validateConfig } from "../../src/utils/config";

describe("Config Validation Unit Tests", () => {
  // Using validateConfig function from utils/config.ts

  describe("validateConfig", () => {
    const mockFunction = async () => ({});
    const mockArgs = () => [] as [];
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

  describe("validateConfig with invalid values", () => {
    const mockFunction = async () => ({});
    const mockArgs = () => [] as [];
    const mockResult = (r: any) => r;

    const baseConfig = {
      data: { 
        path: "/tmp/test.csv", 
        target: "y",
        variants: { model: ["test-model"] }
      },
      run: {
        function: mockFunction,
        args: mockArgs,
        result: mockResult,
      },
    };

    it("should throw errors for invalid concurrency values", () => {
      expect(() => validateConfig({ ...baseConfig, concurrency: 0 })).toThrow(
        "Invalid concurrency: expected positive integer, got 0"
      );
      expect(() => validateConfig({ ...baseConfig, concurrency: -1 })).toThrow(
        "Invalid concurrency: expected positive integer, got -1"
      );
      expect(() => validateConfig({ ...baseConfig, concurrency: 1.5 })).toThrow(
        "Invalid concurrency: expected integer, got 1.5"
      );
    });

    it("should throw errors for invalid interval values", () => {
      expect(() => validateConfig({ ...baseConfig, interval: -1 })).toThrow(
        "Invalid interval: expected non-negative integer, got -1"
      );
      expect(() => validateConfig({ ...baseConfig, interval: 1.5 })).toThrow(
        "Invalid interval: expected integer, got 1.5"
      );
    });

    it("should throw errors for invalid retries values", () => {
      expect(() => validateConfig({ ...baseConfig, retries: -1 })).toThrow(
        "Invalid retries: expected non-negative integer, got -1"
      );
      expect(() => validateConfig({ ...baseConfig, retries: 1.5 })).toThrow(
        "Invalid retries: expected integer, got 1.5"
      );
    });

    it("should apply defaults for undefined values", () => {
      const result = validateConfig(baseConfig);
      expect(result.concurrency).toBe(10);
      expect(result.interval).toBe(1000);
      expect(result.retries).toBe(0);
    });

    it("should preserve valid values", () => {
      const configWithValues = {
        ...baseConfig,
        concurrency: 5,
        interval: 500,
        retries: 3,
      };
      const result = validateConfig(configWithValues);
      expect(result.concurrency).toBe(5);
      expect(result.interval).toBe(500);
      expect(result.retries).toBe(3);
    });
  });
});
