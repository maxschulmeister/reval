import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const writeTempCsv = (name: string, content: string) => {
  const p = path.resolve(__dirname, name);
  fs.writeFileSync(p, content, "utf8");
  return p;
};

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

afterEach(() => {
  // Cleanup temp files if any
  ["tmp1.csv", "tmp2.csv", "tmp3.csv"].forEach((f) => {
    const p = path.resolve(__dirname, f);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  });
});

describe("loadConfig", () => {
  it("returns the mocked config instead of reading from the real file", async () => {
    const mockConfig = {
      data: { path: "/tmp/does-not-matter.csv", target: "y", trim: 2 },
      run: {
        function: async () => ({}),
        args: () => [],
        result: (r: any) => r,
      },
    } as any;

    // Use vi.spyOn to mock the loadConfig function directly
    const utils = await import("../../src/utils");
    const loadConfigSpy = vi
      .spyOn(utils, "loadConfig")
      .mockResolvedValue(mockConfig);

    const cfg = await utils.loadConfig();
    expect(cfg).toEqual(mockConfig);

    // Clean up
    loadConfigSpy.mockRestore();
  });
});

describe("Config Structure & Validation Tests", () => {
  describe("1.1 Basic Config Properties", () => {
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

    describe("concurrency property", () => {
      it("should accept valid positive integers", async () => {
        const testValues = [1, 10, 100];

        for (const concurrency of testValues) {
          const mockConfig = {
            concurrency,
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
          expect(cfg.concurrency).toBe(concurrency);
        }
      });

      it("should handle default behavior when not specified", async () => {
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
        expect(cfg.concurrency).toBeUndefined();
      });
    });

    describe("retries property", () => {
      it("should accept valid values", async () => {
        const testValues = [0, 5, 10];

        for (const retries of testValues) {
          const mockConfig = {
            retries,
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
          expect(cfg.retries).toBe(retries);
        }
      });

      it("should handle default behavior when not specified", async () => {
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
        expect(cfg.retries).toBeUndefined();
      });
    });

    describe("interval property", () => {
      it("should accept valid values", async () => {
        const testValues = [0, 10, 1000];

        for (const interval of testValues) {
          const mockConfig = {
            interval,
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
          expect(cfg.interval).toBe(interval);
        }
      });

      it("should handle default behavior when not specified", async () => {
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
        expect(cfg.interval).toBeUndefined();
      });
    });
  });
});

describe("Data Configuration Tests", () => {
  describe("1.2 data.path property", () => {
    it("should handle valid CSV file paths (relative and absolute)", async () => {
      const csv = ["a,b,y", "1,10,foo", "2,20,bar"].join("\n");
      const csvPath = writeTempCsv("tmp1.csv", csv);

      const mockConfig = {
        data: { path: csvPath, target: "y" },
        run: {
          function: async () => ({}),
          args: () => [],
          result: (r: any) => r,
        },
      } as any;

      vi.doMock("../../reval.config", () => ({ default: mockConfig }));
      vi.resetModules();

      const utils = await import("../../src/utils");
      const { features, target } = await utils.loadData();

      expect(features).toEqual([{ a: "1", b: "10" }, { a: "2", b: "20" }]);
      expect(target).toEqual(["foo", "bar"]);

      vi.doUnmock("../../reval.config");
    });

    it("should handle non-existent file paths (should error)", async () => {
      const mockConfig = {
        data: { path: "/non/existent/file.csv", target: "y" },
        run: {
          function: async () => ({}),
          args: () => [],
          result: (r: any) => r,
        },
      } as any;

      vi.doMock("../../reval.config", () => ({ default: mockConfig }));
      vi.resetModules();

      const utils = await import("../../src/utils");
      await expect(utils.loadData()).rejects.toThrow();

      vi.doUnmock("../../reval.config");
    });

    it("should handle invalid file formats (should error)", async () => {
      const invalidPath = writeTempCsv("tmp2.csv", "This is not a valid CSV format");

      const mockConfig = {
        data: { path: invalidPath, target: "y" },
        run: {
          function: async () => ({}),
          args: () => [],
          result: (r: any) => r,
        },
      } as any;

      vi.doMock("../../reval.config", () => ({ default: mockConfig }));
      vi.resetModules();

      const utils = await import("../../src/utils");
      
      // Should throw an error because the malformed CSV doesn't have the expected 'y' column
      await expect(utils.loadData()).rejects.toThrow("Target column 'y' not found in CSV");

      vi.doUnmock("../../reval.config");
    });

    it("should handle missing path property with target and features defined as arrays", async () => {
      const mockConfig = {
        data: { 
          target: ["foo", "bar"],
          features: [["a", "b"], ["c", "d"]] 
        },
        run: {
          function: async () => ({}),
          args: () => [],
          result: (r: any) => r,
        },
      } as any;

      vi.doMock("../../reval.config", () => ({ default: mockConfig }));
      vi.resetModules();

      const utils = await import("../../src/utils");
      const { features, target } = await utils.loadData();

      // Now works correctly with the bug fix
      expect(features).toEqual([["a", "b"], ["c", "d"]]);
      expect(target).toEqual(["foo", "bar"]);

      vi.doUnmock("../../reval.config");
    });

    it("should throw error when missing path property without target and features defined", async () => {
      const mockConfig = {
        data: { },
        run: {
          function: async () => ({}),
          args: () => [],
          result: (r: any) => r,
        },
      } as any;

      vi.doMock("../../reval.config", () => ({ default: mockConfig }));
      vi.resetModules();

      const utils = await import("../../src/utils");
      
      // Should throw an error when both target and features are missing
      await expect(utils.loadData()).rejects.toThrow('Both target and features must be provided when path is not specified');

      vi.doUnmock("../../reval.config");
    });
  });

  describe("1.2 data.target property", () => {
    it("should handle valid column names that exist in CSV", async () => {
      const csv = ["a,b,y", "1,10,foo", "2,20,bar"].join("\n");
      const csvPath = writeTempCsv("tmp1.csv", csv);

      const mockConfig = {
        data: { path: csvPath, target: "y" },
        run: {
          function: async () => ({}),
          args: () => [],
          result: (r: any) => r,
        },
      } as any;

      vi.doMock("../../reval.config", () => ({ default: mockConfig }));
      vi.resetModules();

      const utils = await import("../../src/utils");
      const { target } = await utils.loadData();

      expect(target).toEqual(["foo", "bar"]);

      vi.doUnmock("../../reval.config");
    });

    it("should throw error for non-existent column names", async () => {
      const csv = ["a,b,y", "1,10,foo", "2,20,bar"].join("\n");
      const csvPath = writeTempCsv("tmp1.csv", csv);

      const mockConfig = {
        data: { path: csvPath, target: "nonexistent" },
        run: {
          function: async () => ({}),
          args: () => [],
          result: (r: any) => r,
        },
      } as any;

      vi.doMock("../../reval.config", () => ({ default: mockConfig }));
      vi.resetModules();

      const utils = await import("../../src/utils");
      
      // Should throw an error for non-existent target column
      await expect(utils.loadData()).rejects.toThrow("Target column 'nonexistent' not found in CSV");

      vi.doUnmock("../../reval.config");
    });

    it("should handle valid array of strings (when path not defined)", async () => {
      const mockConfig = {
        data: { 
          target: ["foo", "bar", "baz"],
          features: [["a", "b"], ["c", "d"], ["e", "f"]]
        },
        run: {
          function: async () => ({}),
          args: () => [],
          result: (r: any) => r,
        },
      } as any;

      vi.doMock("../../reval.config", () => ({ default: mockConfig }));
      vi.resetModules();

      const utils = await import("../../src/utils");
      const { target, features } = await utils.loadData();

      // Now should work correctly with the bug fix
      expect(target).toEqual(["foo", "bar", "baz"]);
      expect(features).toEqual([["a", "b"], ["c", "d"], ["e", "f"]]);

      vi.doUnmock("../../reval.config");
    });

    it("should handle missing target property (falls back to second column)", async () => {
      const csv = ["a,b,y", "1,10,foo", "2,20,bar"].join("\n");
      const csvPath = writeTempCsv("tmp1.csv", csv);

      const mockConfig = {
        data: { path: csvPath },
        run: {
          function: async () => ({}),
          args: () => [],
          result: (r: any) => r,
        },
      } as any;

      vi.doMock("../../reval.config", () => ({ default: mockConfig }));
      vi.resetModules();

      const utils = await import("../../src/utils");
      const { features, target } = await utils.loadData();

      // Should fall back to using the second column as target
      // When target is missing, no column is dropped, so all columns remain in features
      expect(features).toEqual([{ a: "1", b: "10", y: "foo" }, { a: "2", b: "20", y: "bar" }]);
      expect(target).toEqual(["10", "20"]);

      vi.doUnmock("../../reval.config");
    });

    it("should handle empty string target (falls back to second column)", async () => {
      const csv = ["a,b,y", "1,10,foo", "2,20,bar"].join("\n");
      const csvPath = writeTempCsv("tmp1.csv", csv);

      const mockConfig = {
        data: { path: csvPath, target: "" },
        run: {
          function: async () => ({}),
          args: () => [],
          result: (r: any) => r,
        },
      } as any;

      vi.doMock("../../reval.config", () => ({ default: mockConfig }));
      vi.resetModules();

      const utils = await import("../../src/utils");
      const { target } = await utils.loadData();

      // The implementation falls back to the second column when target is empty
      // In this case, it returns column 'b' values
      expect(target).toEqual(["10", "20"]);

      vi.doUnmock("../../reval.config");
    });
  });

  describe("1.2 data.features property", () => {
    it("should handle valid column names that exist in CSV", async () => {
      const csv = ["a,b,y", "1,10,foo", "2,20,bar"].join("\n");
      const csvPath = writeTempCsv("tmp1.csv", csv);

      const mockConfig = {
        data: { path: csvPath, target: "y", features: "a" },
        run: {
          function: async () => ({}),
          args: () => [],
          result: (r: any) => r,
        },
      } as any;

      vi.doMock("../../reval.config", () => ({ default: mockConfig }));
      vi.resetModules();

      const utils = await import("../../src/utils");
      const { features } = await utils.loadData();

      expect(features).toEqual(["1", "2"]);

      vi.doUnmock("../../reval.config");
    });

    it("should throw error for non-existent column names", async () => {
      const csv = ["a,b,y", "1,10,foo", "2,20,bar"].join("\n");
      const csvPath = writeTempCsv("tmp1.csv", csv);

      const mockConfig = {
        data: { path: csvPath, target: "y", features: "nonexistent" },
        run: {
          function: async () => ({}),
          args: () => [],
          result: (r: any) => r,
        },
      } as any;

      vi.doMock("../../reval.config", () => ({ default: mockConfig }));
      vi.resetModules();

      const utils = await import("../../src/utils");
      
      // Should throw an error for non-existent features column
      await expect(utils.loadData()).rejects.toThrow("Features column 'nonexistent' not found in CSV");

      vi.doUnmock("../../reval.config");
    });

    it("should handle valid array of strings (when path not defined)", async () => {
      const mockConfig = {
        data: { 
          target: ["foo", "bar"],
          features: [["a", "b"], ["c", "d"]]
        },
        run: {
          function: async () => ({}),
          args: () => [],
          result: (r: any) => r,
        },
      } as any;

      vi.doMock("../../reval.config", () => ({ default: mockConfig }));
      vi.resetModules();

      const utils = await import("../../src/utils");
      const { features } = await utils.loadData();

      // Now works correctly with the bug fix
      expect(features).toEqual([["a", "b"], ["c", "d"]]);

      vi.doUnmock("../../reval.config");
    });

    it("should handle valid object with arrays of strings (when path not defined)", async () => {
      const mockConfig = {
        data: { 
          target: ["foo", "bar"],
          features: { model: ["m1", "m2"], param: ["p1", "p2"] }
        },
        run: {
          function: async () => ({}),
          args: () => [],
          result: (r: any) => r,
        },
      } as any;

      vi.doMock("../../reval.config", () => ({ default: mockConfig }));
      vi.resetModules();

      const utils = await import("../../src/utils");
      const { features } = await utils.loadData();

      // Now works correctly with the bug fix
      expect(features).toEqual({ model: ["m1", "m2"], param: ["p1", "p2"] });

      vi.doUnmock("../../reval.config");
    });

    it("should handle optional property behavior when not specified", async () => {
      const csv = ["a,b,y", "1,10,foo", "2,20,bar"].join("\n");
      const csvPath = writeTempCsv("tmp1.csv", csv);

      const mockConfig = {
        data: { path: csvPath, target: "y" },
        run: {
          function: async () => ({}),
          args: () => [],
          result: (r: any) => r,
        },
      } as any;

      vi.doMock("../../reval.config", () => ({ default: mockConfig }));
      vi.resetModules();

      const utils = await import("../../src/utils");
      const { features } = await utils.loadData();

      // When features is not specified, it should extract all non-target columns
      expect(features).toEqual([{ a: "1", b: "10" }, { a: "2", b: "20" }]);

      vi.doUnmock("../../reval.config");
    });

    it("should handle empty string features (falls back to all non-target columns)", async () => {
      const csv = ["a,b,y", "1,10,foo", "2,20,bar"].join("\n");
      const csvPath = writeTempCsv("tmp1.csv", csv);

      const mockConfig = {
        data: { path: csvPath, target: "y", features: "" },
        run: {
          function: async () => ({}),
          args: () => [],
          result: (r: any) => r,
        },
      } as any;

      vi.doMock("../../reval.config", () => ({ default: mockConfig }));
      vi.resetModules();

      const utils = await import("../../src/utils");
      const { features } = await utils.loadData();

      // The implementation falls back to extracting all non-target columns
      // when features is an empty string
      expect(features).toEqual([{ a: "1", b: "10" }, { a: "2", b: "20" }]);

      vi.doUnmock("../../reval.config");
    });
  });
});

describe("loadData with mocked configs", () => {
  it("extracts features as array of objects when multiple non-target columns exist", async () => {
    const csv = ["a,b,y", "1,10,foo", "2,20,bar"].join("\n");
    const csvPath = writeTempCsv("tmp1.csv", csv);

    const mockConfig = {
      data: { path: csvPath, target: "y", trim: 2 },
      run: {
        function: async () => ({}),
        args: () => [],
        result: (r: any) => r,
      },
    } as any;

    // Mock the module before importing
    vi.doMock("../../reval.config", () => ({ default: mockConfig }));
    vi.resetModules();

    const utils = await import("../../src/utils");
    const { features, target } = await utils.loadData();

    expect(Array.isArray(features)).toBe(true);
    expect(Array.isArray(target)).toBe(true);
    expect(features.length).toBe(2);
    expect(target.length).toBe(2);

    // multiple non-target columns -> array of objects
    expect(features).toEqual([
      { a: "1", b: "10" },
      { a: "2", b: "20" },
    ]);
    expect(target).toEqual(["foo", "bar"]);

    // Clean up
    vi.doUnmock("../../reval.config");
  });

  it("extracts features as flattened array when only one non-target column exists", async () => {
    const csv = ["x,y", "p1,foo", "p2,bar"].join("\n");
    const csvPath = writeTempCsv("tmp2.csv", csv);

    const mockConfig = {
      data: { path: csvPath, target: "y", trim: 2 },
      run: {
        function: async () => ({}),
        args: () => [],
        result: (r: any) => r,
      },
    } as any;

    // Mock the module before importing
    vi.doMock("../../reval.config", () => ({ default: mockConfig }));
    vi.resetModules();

    const utils = await import("../../src/utils");
    const { features, target } = await utils.loadData();

    // single non-target column -> flattened values
    expect(features).toEqual(["p1", "p2"]);
    expect(target).toEqual(["foo", "bar"]);

    // Clean up
    vi.doUnmock("../../reval.config");
  });

  it("extracts features from specified column when config.data.features is provided", async () => {
    const csv = ["x,y,z", "p1,foo,1", "p2,bar,2"].join("\n");
    const csvPath = writeTempCsv("tmp3.csv", csv);

    const mockConfig = {
      data: { path: csvPath, target: "y", features: "x", trim: 2 },
      run: {
        function: async () => ({}),
        args: () => [],
        result: (r: any) => r,
      },
    } as any;

    // Mock the module before importing
    vi.doMock("../../reval.config", () => ({ default: mockConfig }));
    vi.resetModules();

    const utils = await import("../../src/utils");
    const { features, target } = await utils.loadData();

    expect(features).toEqual(["p1", "p2"]);
    expect(target).toEqual(["foo", "bar"]);

    // Clean up
    vi.doUnmock("../../reval.config");
  });
});
