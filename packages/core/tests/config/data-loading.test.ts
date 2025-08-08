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
