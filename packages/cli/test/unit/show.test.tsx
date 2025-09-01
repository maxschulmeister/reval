import { render } from "ink-testing-library";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Show from "../../src/commands/show";
import { waitForComponentCompletion } from "../utils";

// Mock @reval/core
vi.mock("@reval/core", () => ({
  getEvalDetails: vi.fn(),
}));

import { getEvalDetails } from "@reval/core";

const mockGetEvalDetails = vi.mocked(getEvalDetails);

describe("Show Command", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const mockEvalDetails = {
    id: "run123",
    name: "test-function-1-model-1234567890",
    timestamp: 1640995200000,
    totalRuns: 10,
    successCount: 8,
    errorCount: 2,
    successRate: 80.0,
    avgTime: 123.45,
    notes: "Test run notes",
    eval: {
      id: "run123",
      name: "test-function-1-model-1234567890",
      timestamp: BigInt(1640995200000),
      notes: "Test run notes",
      function: 'async function testFunction() { return "test"; }',
    },
     runs: [
      {
        id: "exec1",
        eval_id: "run123",
        status: "success" as const,
        time: 120,
        features: "input1",
        target: "output1",
        retries: 0,
        accuracy: 0.95,
        args: { input: "test" },
        variants: { model: "test-model-1" },
        dataIndex: 0,
        result: { prediction: "actual result", tokens: { in: 10, out: 5 } },
      },
      {
        id: "exec2",
        eval_id: "run123",
        status: "error" as const,
        time: 0,
        features: "input2",
        target: "output2",
        retries: 1,
        accuracy: null,
        args: { input: "test2" },
        variants: { model: "test-model-2" },
        dataIndex: 1,
        result: null,
      },
    ],
  };

  it("renders detailed run information", async () => {
    mockGetEvalDetails.mockResolvedValue(mockEvalDetails);

    const { lastFrame } = render(<Show args={["run123"]} options={{}} />);

    // Wait for async operation to complete
    await waitForComponentCompletion(() => lastFrame() || "");

    const output = lastFrame();
    expect(output).toContain("Run Details:");
    expect(output).toContain("ID: run123");
    expect(output).toContain("Name: test-function-1-model-1234567890");
    expect(output).toContain("Notes: Test run notes");
    expect(output).toContain("Summary:");
    expect(output).toContain("Total executions: 10");
    expect(output).toContain("Successful: 8 (80.0%)");
    expect(output).toContain("Failed: 2");
    expect(output).toContain("Average time: 123.45ms");
    expect(output).toContain("Sample Executions:");
    expect(output).toContain("SUCCESS");
    expect(output).toContain("ERROR");

    expect(mockGetEvalDetails).toHaveBeenCalledWith("run123");
  });

  it("renders JSON output when --json flag is provided", async () => {
    mockGetEvalDetails.mockResolvedValue(mockEvalDetails);

    const { lastFrame } = render(
      <Show args={["run123"]} options={{ json: true }} />,
    );

    // Wait for async operation to complete
    await waitForComponentCompletion(() => lastFrame() || "");

    const output = lastFrame();
    const parsed = JSON.parse(output || "{}");

    expect(parsed).toEqual(mockEvalDetails);
  });

  it("handles run not found", async () => {
    mockGetEvalDetails.mockResolvedValue(null);

    const { lastFrame } = render(<Show args={["nonexistent"]} options={{}} />);

    // Wait for async operation to complete
    await waitForComponentCompletion(() => lastFrame() || "");

    const output = lastFrame();
    expect(output).toContain("Error:");
    expect(output).toContain("Run with ID 'nonexistent' not found");
    expect(output).toContain("Use 'reval list' to see available runs");
  });

  it("handles error from getRunDetails", async () => {
    mockGetEvalDetails.mockRejectedValue(new Error("Database error"));

    const { lastFrame } = render(<Show args={["run123"]} options={{}} />);

    // Wait for async operation to complete
    await waitForComponentCompletion(() => lastFrame() || "");

    const output = lastFrame();
    expect(output).toContain("Error:");
    expect(output).toContain("Database error");
  });

  it("shows loading state initially", () => {
    mockGetEvalDetails.mockImplementation(() => new Promise(() => {})); // Never resolves

    const { lastFrame } = render(<Show args={["run123"]} options={{}} />);

    expect(lastFrame()).toContain("Loading run details...");
  });

  it("displays sample executions with proper formatting", async () => {
    const detailsWithManyExecutions = {
      ...mockEvalDetails,
      runs: [
        ...mockEvalDetails.runs,
        ...Array.from({ length: 10 }, (_, i) => ({
          id: `exec${i + 3}`,
          eval_id: "run123",
          status: "success" as const,
          time: 100 + i,
          features: `input${i}`,
          target: `result ${i}`,
          retries: 0,
          accuracy: 0.9,
          args: { input: `test${i}` },
          variants: { model: "test-model-1" },
          dataIndex: i + 2,
          result: { prediction: `prediction ${i}` },
        })),
      ],
    };

    mockGetEvalDetails.mockResolvedValue(detailsWithManyExecutions);

    const { lastFrame } = render(<Show args={["run123"]} options={{}} />);

    // Wait for async operation to complete
    await waitForComponentCompletion(() => lastFrame() || "");

    const output = lastFrame();
    expect(output).toContain("Sample Executions:");
    expect(output).toContain("... and 7 more executions");
  });
});
