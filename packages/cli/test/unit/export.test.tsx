import { render } from "ink-testing-library";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Export from "../../src/commands/export";
import { waitForComponentCompletion } from "../utils";

// Mock @reval/core
vi.mock("@reval/core", () => ({
  exportEval: vi.fn(),
}));

// Mock fs
vi.mock("fs", async () => {
  const actual = await vi.importActual("fs");
  return {
    ...actual,
    writeFileSync: vi.fn(),
  };
});

import { exportEval } from "@reval/core";
import * as fs from "fs";

const mockExportEval = vi.mocked(exportEval);
const mockWriteFileSync = vi.mocked(fs.writeFileSync);

describe("Export Command", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const mockJsonData = JSON.stringify(
    {
      id: "run123",
      executions: [{ id: "exec1", result: "test" }],
    },
    null,
    2,
  );

  const mockCsvData =
    'id,eval_id,target,result,time,retries,accuracy,status\nexec1,run123,"output","result",120,0,0.95,"success"';

  it("exports eval data in JSON format by default", async () => {
    mockExportEval.mockResolvedValue(mockJsonData);

    const { lastFrame } = render(
      <Export args={["run123"]} options={{ format: "json" }} />,
    );

    // Wait for async export to complete
    await waitForComponentCompletion(() => lastFrame() || "");

    const output = lastFrame() || "";
    expect(output).toContain("Export completed!");
    expect(output).toContain("Eval ID: run123");
    expect(output).toContain("Format: JSON");
    expect(output).toContain("Output file: reval-export-run123.json");

    expect(mockExportEval).toHaveBeenCalledWith("run123", "json");
    expect(mockWriteFileSync).toHaveBeenCalledWith(
      "reval-export-run123.json",
      mockJsonData,
      "utf8",
    );
  });

  it("exports eval data in CSV format", async () => {
    mockExportEval.mockResolvedValue(mockCsvData);

    const { lastFrame } = render(
      <Export args={["run123"]} options={{ format: "csv" }} />,
    );

    // Wait for async export to complete
    await waitForComponentCompletion(() => lastFrame() || "");

    const output = lastFrame() || "";
    expect(output).toContain("Export completed!");
    expect(output).toContain("Format: CSV");
    expect(output).toContain("Output file: reval-export-run123.csv");

    expect(mockExportEval).toHaveBeenCalledWith("run123", "csv");
    expect(mockWriteFileSync).toHaveBeenCalledWith(
      "reval-export-run123.csv",
      mockCsvData,
      "utf8",
    );
  });

  it("uses custom output file path when provided", async () => {
    mockExportEval.mockResolvedValue(mockJsonData);

    const { lastFrame } = render(
      <Export
        args={["run123"]}
        options={{ format: "json", out: "custom-results.json" }}
      />,
    );

    // Wait for async export to complete
    await waitForComponentCompletion(() => lastFrame() || "");

    const output = lastFrame();
    expect(output).toContain("Output file: custom-results.json");

    expect(mockWriteFileSync).toHaveBeenCalledWith(
      "custom-results.json",
      mockJsonData,
      "utf8",
    );
  });

  it("handles export error from core", async () => {
    mockExportEval.mockRejectedValue(new Error("Eval not found"));

    const { lastFrame } = render(
      <Export args={["nonexistent"]} options={{ format: "json" }} />,
    );

    // Wait for async export to complete
    await waitForComponentCompletion(() => lastFrame() || "");

    const output = lastFrame();
    expect(output).toContain("Error exporting eval:");
    expect(output).toContain("Eval not found");
    expect(output).toContain("Use 'reval list' to see available evals");
  });

  it("handles file write error", async () => {
    mockExportEval.mockResolvedValue(mockJsonData);
    mockWriteFileSync.mockImplementation(() => {
      throw new Error("Permission denied");
    });

    const { lastFrame } = render(
      <Export args={["run123"]} options={{ format: "json" }} />,
    );

    // Wait for async export to complete
    await waitForComponentCompletion(() => lastFrame() || "");

    const output = lastFrame();
    expect(output).toContain("Error exporting eval:");
    expect(output).toContain("Permission denied");
  });

  it("shows exporting state initially", () => {
    mockExportEval.mockImplementation(() => new Promise(() => {})); // Never resolves

    const { lastFrame } = render(
      <Export args={["run123"]} options={{ format: "json" }} />,
    );

    expect(lastFrame()).toContain("Exporting eval run123...");
    expect(lastFrame()).toContain("Format: JSON");
  });

  it("generates correct default filename for CSV", async () => {
    mockExportEval.mockResolvedValue(mockCsvData);

    const { lastFrame } = render(
      <Export args={["abcdef123456"]} options={{ format: "csv" }} />,
    );

    // Wait for async export to complete
    await waitForComponentCompletion(() => lastFrame() || "");

    const output = lastFrame();
    expect(output).toContain("Output file: reval-export-abcdef12.csv");
  });
});
