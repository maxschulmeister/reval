import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { waitForComponentCompletion } from '../utils';
import { render } from 'ink-testing-library';
import List from '../../src/commands/list';

// Mock @rectangle0/reval-core
vi.mock('@rectangle0/reval-core', () => ({
  listEvals: vi.fn(),
}));

import { listEvals } from "@rectangle0/reval-core";

const mockListEvals = vi.mocked(listEvals);

describe('List Command', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const mockRuns = [
    {
      id: 'run123',
      name: 'test-function-1-model-1234567890',
      timestamp: 1640995200000, // 2022-01-01 00:00:00
      totalRuns: 10,
      successCount: 8,
      errorCount: 2,
      successRate: 80,
      avgTime: 123.45,
      notes: 'Test run',
    },
    {
      id: 'run456',
      name: 'another-function-2-model-1234567891',
      timestamp: 1640995260000, // 2022-01-01 00:01:00
      totalRuns: 5,
      successCount: 5,
      errorCount: 0,
      successRate: 100,
      avgTime: 200.50,
    },
  ];

  it('renders table of runs with default limit', async () => {
    mockListEvals.mockResolvedValue(mockRuns);
    
    const { lastFrame } = render(<List options={{ limit: 20 }} />);
    
    // Wait for async operation to complete
    await waitForComponentCompletion(() => lastFrame() || '');
    
    const output = lastFrame() || '';
    expect(output).toContain('Recent Runs (2):');
    expect(output).toContain('test-function-1-model');
    expect(output).toContain('another-function-2-model');
    expect(output).toContain('80.0% success');
    expect(output).toContain('100.0% success');
    expect(output).toContain('123.45ms avg');
    expect(output).toContain('200.50ms avg');
    
    expect(mockListEvals).toHaveBeenCalledWith(20);
  });

  it('renders JSON output when --json flag is provided', async () => {
    mockListEvals.mockResolvedValue(mockRuns);
    
    const { lastFrame } = render(<List options={{ limit: 20, json: true }} />);
    
    // Wait for async operation to complete
    await waitForComponentCompletion(() => lastFrame() || '');
    
    const output = lastFrame() || '';
    const parsed = JSON.parse(output);
    
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toEqual(mockRuns[0]);
    expect(parsed[1]).toEqual(mockRuns[1]);
  });

  it('handles custom limit option', async () => {
    mockListEvals.mockResolvedValue(mockRuns.slice(0, 1));
    
    const { lastFrame } = render(<List options={{ limit: 1 }} />);
    await waitForComponentCompletion(() => lastFrame() || '');
    
    expect(mockListEvals).toHaveBeenCalledWith(1);
  });

  it('handles empty results gracefully', async () => {
    mockListEvals.mockResolvedValue([]);
    
    const { lastFrame } = render(<List options={{ limit: 20 }} />);
    
    // Wait for async operation to complete
    await waitForComponentCompletion(() => lastFrame() || '');
    
    const output = lastFrame() || '';
    expect(output).toContain('No benchmark runs found');
    expect(output).toContain("Run 'reval run' to create your first benchmark");
  });

  it('returns empty JSON array for no results with --json', async () => {
    mockListEvals.mockResolvedValue([]);
    
    const { lastFrame } = render(<List options={{ limit: 20, json: true }} />);
    
    // Wait for async operation to complete
    await waitForComponentCompletion(() => lastFrame() || '');
    
    const output = lastFrame() || '';
    expect(JSON.parse(output)).toEqual([]);
  });

  it('handles error from listEvals', async () => {
    mockListEvals.mockRejectedValue(new Error('Database connection failed'));
    
    const { lastFrame } = render(<List options={{ limit: 20 }} />);
    
    // Wait for async operation to complete
    await waitForComponentCompletion(() => lastFrame() || '');
    
    const output = lastFrame() || '';
    expect(output).toContain('Error fetching runs:');
    expect(output).toContain('Database connection failed');
  });

  it('shows loading state initially', () => {
    mockListEvals.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    const { lastFrame } = render(<List options={{ limit: 20 }} />);
    
    expect(lastFrame()).toContain('Loading runs...');
  });
});