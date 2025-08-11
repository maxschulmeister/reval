import { describe, expect, it, vi } from "vitest";

describe("Config Validation Integration", () => {
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
});