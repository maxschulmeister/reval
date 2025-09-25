import { render } from "ink-testing-library";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Eval from "../../src/commands/run";
import { waitForComponentCompletion } from "../utils";

// Mock @rectangle0/reval-core
vi.mock("@rectangle0/reval-core", () => ({
  run: vi.fn(),
}));

import { run } from "@rectangle0/reval-core";

const mockRun = vi.mocked(run);

describe("Eval Command", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const mockBenchmarkResult = {
    run: {
      id: "run123",
      name: "test-function-2-model-1640995200000",
      timestamp: 1640995200000,
      notes: "",
      function: "function test() {}",
      features: ["What is 1+1?", "What is the capital?"],
      target: ["2", "Paris"],
      variants: { model: ["gpt-4", "gpt-3.5"] },
    },
    executions: [
      {
        id: "exec1",
        run_id: "run123",
        status: "success",
        time: 120,
        features: "What is 1+1?",
        target: "2",
        retries: 0,
        variant: { model: "gpt-4" },
        result: { prediction: "1+1 equals 2", tokens: { in: 10, out: 5 } },
      },
      {
        id: "exec2",
        run_id: "run123",
        status: "success",
        time: 180,
        features: "What is the capital?",
        target: "Paris",
        retries: 0,
        variant: { model: "gpt-3.5" },
        result: {
          prediction: "Paris is the capital",
          tokens: { in: 15, out: 8 },
        },
      },
      {
        id: "exec3",
        run_id: "run123",
        status: "error",
        time: 0,
        features: "Error case",
        target: "Error case",
        retries: 1,
        variant: { model: "gpt-4" },
        result: null,
      },
    ],
  };

  it("runs benchmark with default options", async () => {
    mockRun.mockResolvedValue(mockBenchmarkResult as any);

    const { lastFrame } = render(<Eval options={{}} />);

    // Wait for async operation to complete
    await waitForComponentCompletion(() => lastFrame() || "");

    const output = lastFrame() || "";
    expect(output).toContain("Benchmark completed!");
    expect(output).toContain("Run Summary:");
    expect(output).toContain("ID: run123");
    expect(output).toContain("Name: test-function-2-model-1640995200000");
    expect(output).toContain("Total executions: 3");
    expect(output).toContain("Success: 2 (66.7%)");
    expect(output).toContain("Errors: 1");
    expect(output).toContain("Average time: 100.00ms"); // (120 + 180 + 0) / 3
    expect(output).toContain("Results saved to database at: ./.reval/reval.db");
    expect(output).toContain(
      "Use 'reval show run123' to view detailed results",
    );

    expect(mockRun).toHaveBeenCalledWith({
      configPath: undefined,
      dataPath: undefined,
      concurrency: undefined,
      retries: undefined,
      dryRun: undefined,
    });
  });

  it("passes all options to core eval function", async () => {
    mockRun.mockResolvedValue(mockBenchmarkResult);

    const options = {
      config: "./custom-config.ts",
      data: "./custom-data.csv",
      concurrency: 5,
      retries: 3,
      dry: true,
      verbose: true,
    };

    const { lastFrame } = render(<Eval options={options} />);
    await waitForComponentCompletion(() => lastFrame() || "");

    expect(mockRun).toHaveBeenCalledWith({
      configPath: "./custom-config.ts",
      dataPath: "./custom-data.csv",
      concurrency: 5,
      retries: 3,
      dryRun: true,
    });
  });

  it("handles dry run mode", async () => {
    const dryRunResult = {
      ...mockBenchmarkResult,
      run: {
        ...mockBenchmarkResult.run,
        name: "[DRY RUN] test-function-2-model-1640995200000",
        notes: "Dry run - no execution performed",
      },
      executions: [],
    };

    mockRun.mockResolvedValue(dryRunResult as any);

    const { lastFrame } = render(<Eval options={{ dry: true }} />);

    // Wait for async operation to complete
    await waitForComponentCompletion(() => lastFrame() || "");

    const output = lastFrame() || "";
    expect(output).toContain("Benchmark completed!");
    expect(output).toContain("[DRY RUN]");
    expect(output).toContain("Total executions: 0");
  });

  it("handles benchmark error", async () => {
    mockRun.mockRejectedValue(new Error("Configuration file not found"));

    const { lastFrame } = render(<Eval options={{}} />);

    // Wait for async operation to complete
    await waitForComponentCompletion(() => lastFrame() || "");

    const output = lastFrame();
    expect(output).toContain("Error running benchmark:");
    expect(output).toContain("Configuration file not found");
  });

  it("shows running state initially", () => {
    mockRun.mockImplementation(() => new Promise(() => {})); // Never resolves

    const { lastFrame } = render(<Eval options={{}} />);

    expect(lastFrame()).toContain("Running benchmark...");
  });

  it("shows dry run indicator in running state", () => {
    mockRun.mockImplementation(() => new Promise(() => {})); // Never resolves

    const { lastFrame } = render(<Eval options={{ dry: true }} />);

    expect(lastFrame()).toContain("Running benchmark...");
    expect(lastFrame()).toContain("(Dry run mode)");
  });

  it("calculates success rate correctly for all successful executions", async () => {
    const allSuccessResult = {
      ...mockBenchmarkResult,
      executions: [
        {
          id: "exec1",
          run_id: "run123",
          status: "success",
          time: 120,
          target: "2",
          result: { prediction: "2" },
        },
        {
          id: "exec2",
          run_id: "run123",
          status: "success",
          time: 180,
          target: "Paris",
          result: { prediction: "Paris" },
        },
      ],
    };

    mockRun.mockResolvedValue(allSuccessResult as any);

    const { lastFrame } = render(<Eval options={{}} />);

    // Wait for async operation to complete
    await waitForComponentCompletion(() => lastFrame() || "");

    const output = lastFrame();
    expect(output).toContain("Success: 2 (100.0%)");
    expect(output).toContain("Errors: 0");
    expect(output).toContain("Average time: 150.00ms");
  });

  it("handles zero executions", async () => {
    const noExecutionsResult = {
      ...mockBenchmarkResult,
      executions: [],
    };

    mockRun.mockResolvedValue(noExecutionsResult as any);

    const { lastFrame } = render(<Eval options={{}} />);

    // Wait for async operation to complete
    await waitForComponentCompletion(() => lastFrame() || "");

    const output = lastFrame() || "";
    expect(output).toContain("Total executions: 0");
    expect(output).toContain("Success: 0 (0.0%)");
    expect(output).toContain("Average time: NaNms");
  });

  it("handles missing result data gracefully", async () => {
    mockRun.mockResolvedValue(null as any);

    const { lastFrame } = render(<Eval options={{}} />);

    // Wait for async operation to complete
    await waitForComponentCompletion(() => lastFrame() || "");

    const output = lastFrame();
    expect(output).toContain("No result data available");
  });
});
