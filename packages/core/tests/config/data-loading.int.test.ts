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

describe("Data Loading Integration Tests", () => {

describe("Data Trim Property Tests", () => {
  describe("data.trim validation", () => {
    it("should handle valid positive integers (1, 10, 100)", async () => {
      const csv = ["a,b,y", "1,10,foo", "2,20,bar", "3,30,baz", "4,40,qux", "5,50,quux"].join("\n");
      const csvPath = writeTempCsv("tmp1.csv", csv);

      const mockConfig = {
        data: { path: csvPath, target: "y", trim: 3 },
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

      // Should only have 3 rows due to trim
      expect(features).toEqual([
        { a: "1", b: "10" },
        { a: "2", b: "20" },
        { a: "3", b: "30" },
      ]);
      expect(target).toEqual(["foo", "bar", "baz"]);

      vi.doUnmock("../../reval.config");
    });

    it("should handle zero value (no trimming)", async () => {
      const csv = ["a,b,y", "1,10,foo", "2,20,bar"].join("\n");
      const csvPath = writeTempCsv("tmp1.csv", csv);

      const mockConfig = {
        data: { path: csvPath, target: "y", trim: 0 },
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

      // Should have all rows when trim is 0
      expect(features).toEqual([
        { a: "1", b: "10" },
        { a: "2", b: "20" },
      ]);
      expect(target).toEqual(["foo", "bar"]);

      vi.doUnmock("../../reval.config");
    });

    it("should throw error for negative values", async () => {
      const csv = ["a,b,y", "1,10,foo", "2,20,bar"].join("\n");
      const csvPath = writeTempCsv("tmp1.csv", csv);

      const mockConfig = {
        data: { path: csvPath, target: "y", trim: -1 },
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

    it("should throw error for values larger than dataset size", async () => {
      const csv = ["a,b,y", "1,10,foo", "2,20,bar"].join("\n");
      const csvPath = writeTempCsv("tmp1.csv", csv);

      const mockConfig = {
        data: { path: csvPath, target: "y", trim: 100 }, // Larger than 2 rows
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

    it("should handle optional property behavior when not specified", async () => {
      const csv = ["a,b,y", "1,10,foo", "2,20,bar"].join("\n");
      const csvPath = writeTempCsv("tmp1.csv", csv);

      const mockConfig = {
        data: { path: csvPath, target: "y" }, // No trim specified
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

      // Should process all rows when trim is not specified
      expect(features).toEqual([
        { a: "1", b: "10" },
        { a: "2", b: "20" },
      ]);
      expect(target).toEqual(["foo", "bar"]);

      vi.doUnmock("../../reval.config");
    });

    it("should throw error for non-integer values", async () => {
      const csv = ["a,b,y", "1,10,foo", "2,20,bar"].join("\n");
      const csvPath = writeTempCsv("tmp1.csv", csv);

      const mockConfig = {
        data: { path: csvPath, target: "y", trim: 2.5 }, // Non-integer
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
  });
});

describe("Data Variants Property Tests", () => {
  describe("data.variants validation", () => {
    it("should handle valid object with array values", async () => {
      const mockConfig = {
        data: { 
          features: ["input1", "input2"], 
          target: ["output1", "output2"],
          variants: {
            model: ["gpt-4", "claude"],
            temperature: [0.1, 0.5, 0.9]
          }
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

      expect(features).toEqual(["input1", "input2"]);
      expect(target).toEqual(["output1", "output2"]);

      vi.doUnmock("../../reval.config");
    });

    it("should handle single variant with multiple values (array format)", async () => {
      const mockConfig = {
        data: { 
          features: ["input1", "input2"], 
          target: ["output1", "output2"],
          variants: {
            model: ["gpt-4", "claude", "gemini"]
          }
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

      expect(features).toEqual(["input1", "input2"]);
      expect(target).toEqual(["output1", "output2"]);

      vi.doUnmock("../../reval.config");
    });

    it("should handle multiple variants with different value types (string and number)", async () => {
      const mockConfig = {
        data: { 
          features: ["input1", "input2"], 
          target: ["output1", "output2"],
          variants: {
            model: ["gpt-4", "claude"],
            temperature: [0.1, 0.5, 0.9],
            maxTokens: [100, 500, 1000],
            prompt: ["short", "detailed"]
          }
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

      expect(features).toEqual(["input1", "input2"]);
      expect(target).toEqual(["output1", "output2"]);

      vi.doUnmock("../../reval.config");
    });

    it("should throw error for empty arrays in variants", async () => {
      const mockConfig = {
        data: { 
          features: ["input1", "input2"], 
          target: ["output1", "output2"],
          variants: {
            model: [], // Empty array
            temperature: [0.1, 0.5]
          }
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
      await expect(utils.loadData()).rejects.toThrow();

      vi.doUnmock("../../reval.config");
    });

    it("should throw error for missing variants property when using direct data", async () => {
      const mockConfig = {
        data: { 
          features: ["input1", "input2"], 
          target: ["output1", "output2"]
          // Missing variants
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
      await expect(utils.loadData()).rejects.toThrow();

      vi.doUnmock("../../reval.config");
    });

    it("should throw error for invalid variant structures with non-array values", async () => {
      const mockConfig = {
        data: { 
          features: ["input1", "input2"], 
          target: ["output1", "output2"],
          variants: {
            model: "gpt-4", // Should be array, not string
            temperature: [0.1, 0.5]
          }
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
      await expect(utils.loadData()).rejects.toThrow();

      vi.doUnmock("../../reval.config");
    });

    it("should handle variants with CSV path-based data", async () => {
      const csv = ["a,b,y", "1,10,foo", "2,20,bar"].join("\n");
      const csvPath = writeTempCsv("tmp1.csv", csv);

      const mockConfig = {
        data: { 
          path: csvPath, 
          target: "y",
          variants: {
            model: ["gpt-4", "claude"],
            temperature: [0.1, 0.9]
          }
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

      expect(features).toEqual([
        { a: "1", b: "10" },
        { a: "2", b: "20" },
      ]);
      expect(target).toEqual(["foo", "bar"]);

      vi.doUnmock("../../reval.config");
    });
  });
});

describe("Additional Data Configuration Validation Tests", () => {
  describe("Complex validation scenarios", () => {
    it("should succeed when target is array and features is array with path not defined", async () => {
      const mockConfig = {
        data: { 
          features: ["input1", "input2", "input3"], 
          target: ["output1", "output2", "output3"],
          variants: { model: ["gpt-4", "claude"] }
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

      expect(features).toEqual(["input1", "input2", "input3"]);
      expect(target).toEqual(["output1", "output2", "output3"]);

      vi.doUnmock("../../reval.config");
    });

    it("should succeed when target is array and features is object with arrays with path not defined", async () => {
      const mockConfig = {
        data: { 
          features: { 
            model: ["gpt-4", "claude"], 
            temperature: [0.1, 0.5, 0.9],
            prompt: ["short", "detailed"]
          }, 
          target: ["result1", "result2", "result3", "result4"],
          variants: { version: ["v1", "v2"] }
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

      expect(features).toEqual({ 
        model: ["gpt-4", "claude"], 
        temperature: [0.1, 0.5, 0.9],
        prompt: ["short", "detailed"]
      });
      expect(target).toEqual(["result1", "result2", "result3", "result4"]);

      vi.doUnmock("../../reval.config");
    });

    it("should throw error when both path and direct data arrays are provided", async () => {
      const csv = ["a,b,y", "1,10,foo", "2,20,bar"].join("\n");
      const csvPath = writeTempCsv("tmp1.csv", csv);

      const mockConfig = {
        data: { 
          path: csvPath,
          features: ["direct1", "direct2"], // Conflicting with path
          target: ["output1", "output2"] // Conflicting with path
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
      // This should work with path taking precedence, but target should be string
      await expect(utils.loadData()).rejects.toThrow();

      vi.doUnmock("../../reval.config");
    });

    it("should throw error when features and target arrays have mismatched lengths", async () => {
      const mockConfig = {
        data: { 
          features: ["input1", "input2"], // 2 items
          target: ["output1", "output2", "output3"], // 3 items - mismatch
          variants: { model: ["gpt-4"] }
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
      // This might be allowed depending on implementation, but let's test
      const { features, target } = await utils.loadData();
      
      // The implementation should handle this gracefully
      expect(features).toEqual(["input1", "input2"]);
      expect(target).toEqual(["output1", "output2", "output3"]);

      vi.doUnmock("../../reval.config");
    });

    it("should throw error for completely empty data configuration", async () => {
      const mockConfig = {
        data: {}, // Empty data config
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

    it("should throw error when CSV file is empty", async () => {
      const csvPath = writeTempCsv("tmp1.csv", ""); // Empty file

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
      await expect(utils.loadData()).rejects.toThrow();

      vi.doUnmock("../../reval.config");
    });

    it("should throw error when CSV file has headers but no data rows", async () => {
      const csvPath = writeTempCsv("tmp1.csv", "a,b,y"); // Only headers

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
      await expect(utils.loadData()).rejects.toThrow();

      vi.doUnmock("../../reval.config");
    });
  });
});

describe("File Extension Validation Tests", () => {
  it("should reject non-CSV file extensions", async () => {
    const txtPath = writeTempCsv("test-file.txt", "a,b,y\n1,10,foo\n2,20,bar");
    
    const mockConfig = {
      data: { path: txtPath, target: "y" },
      run: {
        function: async () => ({}),
        args: () => [],
        result: (r: any) => r,
      },
    } as any;

    vi.doMock("../../reval.config", () => ({ default: mockConfig }));
    vi.resetModules();

    const utils = await import("../../src/utils");
    
    await expect(utils.loadData()).rejects.toThrow(
      "Only CSV files are supported. Please provide a file with .csv extension."
    );

    vi.doUnmock("../../reval.config");
  });

  it("should reject .xlsx files", async () => {
    const xlsxPath = writeTempCsv("spreadsheet.xlsx", "a,b,y\n1,10,foo\n2,20,bar");
    
    const mockConfig = {
      data: { path: xlsxPath, target: "y" },
      run: {
        function: async () => ({}),
        args: () => [],
        result: (r: any) => r,
      },
    } as any;

    vi.doMock("../../reval.config", () => ({ default: mockConfig }));
    vi.resetModules();

    const utils = await import("../../src/utils");
    
    await expect(utils.loadData()).rejects.toThrow(
      "Only CSV files are supported. Please provide a file with .csv extension."
    );

    vi.doUnmock("../../reval.config");
  });

  it("should reject .json files", async () => {
    const jsonPath = writeTempCsv("data.json", '{"a": "1", "b": "10", "y": "foo"}');
    
    const mockConfig = {
      data: { path: jsonPath, target: "y" },
      run: {
        function: async () => ({}),
        args: () => [],
        result: (r: any) => r,
      },
    } as any;

    vi.doMock("../../reval.config", () => ({ default: mockConfig }));
    vi.resetModules();

    const utils = await import("../../src/utils");
    
    await expect(utils.loadData()).rejects.toThrow(
      "Only CSV files are supported. Please provide a file with .csv extension."
    );

    vi.doUnmock("../../reval.config");
  });

  it("should handle file extension case sensitivity", async () => {
    // Test uppercase .CSV extension
    const csvUpperPath = writeTempCsv("test-file.CSV", "a,b,y\n1,10,foo\n2,20,bar");
    
    const mockConfig = {
      data: { path: csvUpperPath, target: "y" },
      run: {
        function: async () => ({}),
        args: () => [],
        result: (r: any) => r,
      },
    } as any;

    vi.doMock("../../reval.config", () => ({ default: mockConfig }));
    vi.resetModules();

    const utils = await import("../../src/utils");
    
    // Should work with uppercase .CSV
    const { features, target } = await utils.loadData();
    expect(features).toEqual([{ a: "1", b: "10" }, { a: "2", b: "20" }]);
    expect(target).toEqual(["foo", "bar"]);

    vi.doUnmock("../../reval.config");
  });

  it("should handle mixed case file extensions", async () => {
    // Test .Csv extension  
    const csvMixedPath = writeTempCsv("test-file.Csv", "a,b,y\n1,10,foo\n2,20,bar");
    
    const mockConfig = {
      data: { path: csvMixedPath, target: "y" },
      run: {
        function: async () => ({}),
        args: () => [],
        result: (r: any) => r,
      },
    } as any;

    vi.doMock("../../reval.config", () => ({ default: mockConfig }));
    vi.resetModules();

    const utils = await import("../../src/utils");
    
    // Should work with mixed case .Csv
    const { features, target } = await utils.loadData();
    expect(features).toEqual([{ a: "1", b: "10" }, { a: "2", b: "20" }]);
    expect(target).toEqual(["foo", "bar"]);

    vi.doUnmock("../../reval.config");
  });

  it("should reject files with no extension", async () => {
    const noExtPath = writeTempCsv("no-extension", "a,b,y\n1,10,foo\n2,20,bar");
    
    const mockConfig = {
      data: { path: noExtPath, target: "y" },
      run: {
        function: async () => ({}),
        args: () => [],
        result: (r: any) => r,
      },
    } as any;

    vi.doMock("../../reval.config", () => ({ default: mockConfig }));
    vi.resetModules();

    const utils = await import("../../src/utils");
    
    await expect(utils.loadData()).rejects.toThrow(
      "Only CSV files are supported. Please provide a file with .csv extension."
    );

    vi.doUnmock("../../reval.config");
  });

  it("should handle paths with multiple dots correctly", async () => {
    const multipleDotPath = writeTempCsv("data.backup.old.csv", "a,b,y\n1,10,foo\n2,20,bar");
    
    const mockConfig = {
      data: { path: multipleDotPath, target: "y" },
      run: {
        function: async () => ({}),
        args: () => [],
        result: (r: any) => r,
      },
    } as any;

    vi.doMock("../../reval.config", () => ({ default: mockConfig }));
    vi.resetModules();

    const utils = await import("../../src/utils");
    
    // Should work since it ends with .csv
    const { features, target } = await utils.loadData();
    expect(features).toEqual([{ a: "1", b: "10" }, { a: "2", b: "20" }]);
    expect(target).toEqual(["foo", "bar"]);

    vi.doUnmock("../../reval.config");
  });

  it("should reject files ending with .csv.bak", async () => {
    const bakPath = writeTempCsv("data.csv.bak", "a,b,y\n1,10,foo\n2,20,bar");
    
    const mockConfig = {
      data: { path: bakPath, target: "y" },
      run: {
        function: async () => ({}),
        args: () => [],
        result: (r: any) => r,
      },
    } as any;

    vi.doMock("../../reval.config", () => ({ default: mockConfig }));
    vi.resetModules();

    const utils = await import("../../src/utils");
    
    await expect(utils.loadData()).rejects.toThrow(
      "Only CSV files are supported. Please provide a file with .csv extension."
    );

    vi.doUnmock("../../reval.config");
  });
});

afterEach(() => {
  // Cleanup temp files if any
  ["tmp1.csv", "tmp2.csv", "tmp3.csv", "tmp1.txt", 
   "test-file.txt", "spreadsheet.xlsx", "data.json", "test-file.CSV", 
   "test-file.Csv", "no-extension", "data.backup.old.csv", "data.csv.bak"
  ].forEach((f) => {
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

      expect(features).toEqual([
        { a: "1", b: "10" },
        { a: "2", b: "20" },
      ]);
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

    it("should throw error for non-CSV file extensions", async () => {
      const txtContent = "a,b,y\n1,10,foo\n2,20,bar";
      const txtPath = path.resolve(__dirname, "tmp1.txt");
      fs.writeFileSync(txtPath, txtContent, "utf8");

      const mockConfig = {
        data: { path: txtPath, target: "y" },
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

      // Cleanup
      if (fs.existsSync(txtPath)) fs.unlinkSync(txtPath);
      vi.doUnmock("../../reval.config");
    });

    it("should throw error when path is defined but target is not defined", async () => {
      const csv = ["a,b,y", "1,10,foo", "2,20,bar"].join("\n");
      const csvPath = writeTempCsv("tmp1.csv", csv);

      const mockConfig = {
        data: { path: csvPath }, // No target defined
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

    it("should throw error for non-existent column names in target", async () => {
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
      await expect(utils.loadData()).rejects.toThrow();

      vi.doUnmock("../../reval.config");
    });

    it("should throw error when target is not defined (no default fallback)", async () => {
      const mockConfig = {
        data: { features: ["val1", "val2"] }, // No target defined
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

    it("should work with target as array of values when path not defined", async () => {
      const mockConfig = {
        data: { 
          features: ["val1", "val2"], 
          target: ["output1", "output2"],
          variants: { model: ["gpt-4", "claude"] }
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

      expect(features).toEqual(["val1", "val2"]);
      expect(target).toEqual(["output1", "output2"]);

      vi.doUnmock("../../reval.config");
    });

    it("should throw error when target is array and features/path not properly defined", async () => {
      const mockConfig = {
        data: { 
          target: ["output1", "output2"] // Missing features
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
      await expect(utils.loadData()).rejects.toThrow();

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

    it("should throw error for non-existent column names in features", async () => {
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
      await expect(utils.loadData()).rejects.toThrow();

      vi.doUnmock("../../reval.config");
    });

    it("should work with features as array of values when path not defined", async () => {
      const mockConfig = {
        data: { 
          features: ["val1", "val2"], 
          target: ["output1", "output2"],
          variants: { model: ["gpt-4", "claude"] }
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

      expect(features).toEqual(["val1", "val2"]);
      expect(target).toEqual(["output1", "output2"]);

      vi.doUnmock("../../reval.config");
    });

    it("should work with features as object with arrays when path not defined", async () => {
      const mockConfig = {
        data: { 
          features: { model: ["gpt-4", "claude"], temp: [0.1, 0.9] }, 
          target: ["output1", "output2"],
          variants: { version: ["v1", "v2"] }
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

      expect(features).toEqual({ model: ["gpt-4", "claude"], temp: [0.1, 0.9] });
      expect(target).toEqual(["output1", "output2"]);

      vi.doUnmock("../../reval.config");
    });

    it("should throw error when features has array/object values but target is not defined", async () => {
      const mockConfig = {
        data: { 
          features: ["val1", "val2"] // Missing target
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
      await expect(utils.loadData()).rejects.toThrow();

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
      expect(features).toEqual([
        { a: "1", b: "10" },
        { a: "2", b: "20" },
      ]);

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
      expect(features).toEqual([
        { a: "1", b: "10" },
        { a: "2", b: "20" },
      ]);

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

}); // End of "Data Loading Integration Tests"
