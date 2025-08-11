import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { existsSync, readFileSync } from 'fs';
import Init from '../../../src/commands/init';
import { withTempDir } from '../utils';

// Mock @reval/core
vi.mock('@reval/core', () => ({
  initializeDatabase: vi.fn(),
}));

// Mock fs functions that we want to control
vi.mock('fs', async () => {
  const actual = await vi.importActual('fs');
  return {
    ...actual,
    existsSync: vi.fn(),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
  };
});

import { initializeDatabase } from '@reval/core';
import * as fs from 'fs';

const mockInitializeDatabase = vi.mocked(initializeDatabase);
const mockExistsSync = vi.mocked(fs.existsSync);
const mockWriteFileSync = vi.mocked(fs.writeFileSync);
const mockMkdirSync = vi.mocked(fs.mkdirSync);

describe('Init Command', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('creates project files when they do not exist', async () => {
    mockExistsSync.mockReturnValue(false);
    mockInitializeDatabase.mockResolvedValue();
    
    const { lastFrame, waitUntilExit } = render(<Init options={{}} />);
    await waitUntilExit();
    
    const output = lastFrame();
    expect(output).toContain('Project initialized successfully!');
    expect(output).toContain('Created files:');
    expect(output).toContain('reval.config.ts');
    expect(output).toContain('data/sample.csv');
    expect(output).toContain('.reval/reval.db (database)');
    expect(output).toContain('Next steps:');
    expect(output).toContain('Happy benchmarking! 🎯');
    
    expect(mockWriteFileSync).toHaveBeenCalledWith('reval.config.ts', expect.stringContaining('defineConfig'), 'utf8');
    expect(mockWriteFileSync).toHaveBeenCalledWith('data/sample.csv', expect.stringContaining('input,expected_output'), 'utf8');
    expect(mockMkdirSync).toHaveBeenCalledWith('data', { recursive: true });
    expect(mockInitializeDatabase).toHaveBeenCalledWith(false);
  });

  it('refuses to overwrite existing files without --force', async () => {
    mockExistsSync.mockReturnValue(true);
    
    const { lastFrame, waitUntilExit } = render(<Init options={{}} />);
    await waitUntilExit();
    
    const output = lastFrame();
    expect(output).toContain('Error initializing project:');
    expect(output).toContain('Configuration or data files already exist');
    expect(output).toContain('Use --force to overwrite');
    
    expect(mockWriteFileSync).not.toHaveBeenCalled();
    expect(mockInitializeDatabase).not.toHaveBeenCalled();
  });

  it('overwrites existing files with --force', async () => {
    mockExistsSync.mockReturnValue(true);
    mockInitializeDatabase.mockResolvedValue();
    
    const { lastFrame, waitUntilExit } = render(<Init options={{ force: true }} />);
    await waitUntilExit();
    
    const output = lastFrame();
    expect(output).toContain('Project initialized successfully!');
    expect(output).toContain('Force mode: overwriting existing files');
    
    expect(mockWriteFileSync).toHaveBeenCalled();
    expect(mockInitializeDatabase).toHaveBeenCalledWith(true);
  });

  it('handles database initialization error', async () => {
    mockExistsSync.mockReturnValue(false);
    mockInitializeDatabase.mockRejectedValue(new Error('Database creation failed'));
    
    const { lastFrame, waitUntilExit } = render(<Init options={{}} />);
    await waitUntilExit();
    
    const output = lastFrame();
    expect(output).toContain('Error initializing project:');
    expect(output).toContain('Database creation failed');
  });

  it('shows loading state during initialization', () => {
    mockExistsSync.mockReturnValue(false);
    mockInitializeDatabase.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    const { lastFrame } = render(<Init options={{}} />);
    
    expect(lastFrame()).toContain('Initializing reval project...');
  });

  it('creates correct config file content', async () => {
    mockExistsSync.mockReturnValue(false);
    mockInitializeDatabase.mockResolvedValue();
    
    const { waitUntilExit } = render(<Init options={{}} />);
    await waitUntilExit();
    
    const configCall = mockWriteFileSync.mock.calls.find(call => 
      call[0] === 'reval.config.ts'
    );
    
    expect(configCall).toBeDefined();
    const configContent = configCall![1] as string;
    expect(configContent).toContain('import { defineConfig } from \'@reval/core\';');
    expect(configContent).toContain('export default defineConfig({');
    expect(configContent).toContain('concurrency: 5');
    expect(configContent).toContain('path: \'./data/sample.csv\'');
    expect(configContent).toContain('variants: {');
  });

  it('creates correct sample data content', async () => {
    mockExistsSync.mockReturnValue(false);
    mockInitializeDatabase.mockResolvedValue();
    
    const { waitUntilExit } = render(<Init options={{}} />);
    await waitUntilExit();
    
    const dataCall = mockWriteFileSync.mock.calls.find(call => 
      call[0] === 'data/sample.csv'
    );
    
    expect(dataCall).toBeDefined();
    const dataContent = dataCall![1] as string;
    expect(dataContent).toContain('input,expected_output');
    expect(dataContent).toContain('What is the capital of France?');
    expect(dataContent).toContain('Paris is the capital of France');
  });
});