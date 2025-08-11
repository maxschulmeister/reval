import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import UI from '../../../src/commands/ui';

// Mock execa
vi.mock('execa', () => ({
  execa: vi.fn(),
}));

import { execa } from 'execa';

const mockExeca = vi.mocked(execa);

describe('UI Command', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('starts UI successfully', async () => {
    mockExeca.mockResolvedValue({
      stdout: '',
      stderr: '',
      exitCode: 0,
    } as any);
    
    const { lastFrame } = render(<UI />);
    
    // Initially shows starting state
    expect(lastFrame()).toContain('Starting reval UI...');
    expect(lastFrame()).toContain('This may take a moment...');
    
    // Wait for the timeout to trigger the "running" state
    await new Promise(resolve => setTimeout(resolve, 3100));
    
    // Should now show running state
    expect(lastFrame()).toContain('reval UI started!');
    expect(lastFrame()).toContain('URL: http://localhost:3000');
    expect(lastFrame()).toContain('Open this URL in your browser');
    expect(lastFrame()).toContain('Press Ctrl+C to stop this command');
    
    expect(mockExeca).toHaveBeenCalledWith(
      'pnpm',
      ['dev'],
      expect.objectContaining({
        cwd: '../ui',
        detached: true,
      })
    );
  });

  it('handles UI startup error', async () => {
    mockExeca.mockRejectedValue(new Error('pnpm not found'));
    
    const { lastFrame, waitUntilExit } = render(<UI />);
    await waitUntilExit();
    
    const output = lastFrame();
    expect(output).toContain('Error starting UI:');
    expect(output).toContain('pnpm not found');
    expect(output).toContain('Make sure the UI package is available');
  });

  it('shows starting state initially', () => {
    mockExeca.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    const { lastFrame } = render(<UI />);
    
    expect(lastFrame()).toContain('Starting reval UI...');
    expect(lastFrame()).toContain('This may take a moment...');
  });
});