import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { waitForComponentCompletion } from '../utils';
import Create from '../../src/commands/db/create';
import Migrate from '../../src/commands/db/migrate';
import Studio from '../../src/commands/db/studio';

// Mock @reval/core
vi.mock('@reval/core', () => ({
  initializeDatabase: vi.fn(),
  runMigrations: vi.fn(),
}));

// Mock execa
vi.mock('execa', () => ({
  execa: vi.fn(() => {
    const mockChild = {
      on: vi.fn(),
      kill: vi.fn(),
      pid: 12345,
    };
    return mockChild;
  }),
}));

import { initializeDatabase, runMigrations } from '@reval/core';
import { execa } from 'execa';

const mockInitializeDatabase = vi.mocked(initializeDatabase);
const mockRunMigrations = vi.mocked(runMigrations);
const mockExeca = vi.mocked(execa);

describe('Database Commands', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('db create', () => {
    it('creates database successfully without force', async () => {
      mockInitializeDatabase.mockResolvedValue();
      
      const { lastFrame } = render(<Create options={{}} />);
      
      // Wait for async database creation to complete
      await waitForComponentCompletion(() => lastFrame() || '');
      
      const output = lastFrame();
      expect(output).toContain('Database created successfully!');
      expect(output).toContain('Location: ./.reval/reval.db');
      expect(output).toContain('You can now run \'reval run\' to execute benchmarks');
      
      expect(mockInitializeDatabase).toHaveBeenCalledWith(undefined);
    });

    it('creates database with force flag', async () => {
      mockInitializeDatabase.mockResolvedValue();
      
      const { lastFrame } = render(<Create options={{ force: true }} />);
      
      // Check initial state shows force mode
      expect(lastFrame()).toContain('Force mode: overwriting existing database');
      
      // Wait for async database creation to complete
      await waitForComponentCompletion(() => lastFrame() || '');
      
      const output = lastFrame();
      expect(output).toContain('Database created successfully!');
      
      expect(mockInitializeDatabase).toHaveBeenCalledWith(true);
    });

    it('handles database creation error', async () => {
      mockInitializeDatabase.mockRejectedValue(new Error('Database already exists'));
      
      const { lastFrame } = render(<Create options={{}} />);
      
      // Wait for async database creation to complete
      await waitForComponentCompletion(() => lastFrame() || '');
      
      const output = lastFrame();
      expect(output).toContain('Error creating database:');
      expect(output).toContain('Database already exists');
      expect(output).toContain('Use --force to overwrite an existing database');
    });

    it('shows creating state initially', () => {
      mockInitializeDatabase.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      const { lastFrame } = render(<Create options={{}} />);
      
      expect(lastFrame()).toContain('Creating database...');
    });
  });

  describe('db migrate', () => {
    it('runs migrations successfully', async () => {
      mockRunMigrations.mockResolvedValue();
      
      const { lastFrame } = render(<Migrate />);
      
      // Wait for async operation to complete
      await waitForComponentCompletion(() => lastFrame() || '');
      
      const output = lastFrame();
      expect(output).toContain('Database migrations completed!');
      expect(output).toContain('Database schema is now up to date');
      
      expect(mockRunMigrations).toHaveBeenCalled();
    });

    it('handles migration error', async () => {
      mockRunMigrations.mockRejectedValue(new Error('Migration file not found'));
      
      const { lastFrame } = render(<Migrate />);
      
      // Wait for async operation to complete
    await waitForComponentCompletion(() => lastFrame() || '');
      
      const output = lastFrame();
      expect(output).toContain('Error running migrations:');
      expect(output).toContain('Migration file not found');
      expect(output).toContain('Ensure the database exists and migration files are available');
    });

    it('shows migrating state initially', () => {
      mockRunMigrations.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      const { lastFrame } = render(<Migrate />);
      
      expect(lastFrame()).toContain('Running database migrations...');
    });
  });

  describe('db studio', () => {
    it('starts Drizzle Studio successfully', async () => {
      // Mock successful process spawn
      const mockChild = {
        on: vi.fn(), // No error event will be emitted
        kill: vi.fn(),
        pid: 12345,
      };
      mockExeca.mockReturnValue(mockChild as any);
      
      const { lastFrame } = render(<Studio />);
      
      // Initially shows starting state
      expect(lastFrame()).toContain('Starting Drizzle Studio...');
      
      // Wait a bit for the timeout to trigger the "running" state
      await new Promise(resolve => setTimeout(resolve, 2100));
      
      // Should now show running state
      expect(lastFrame()).toContain('Drizzle Studio started!');
      expect(lastFrame()).toContain('URL: https://local.drizzle.studio');
      expect(lastFrame()).toContain('Press Ctrl+C to stop this command');
      
      expect(mockExeca).toHaveBeenCalledWith(
        'npx',
        ['drizzle-kit', 'studio'],
        expect.objectContaining({
          cwd: process.cwd(),
          detached: true,
        })
      );
    });

    it('handles studio startup error', async () => {
      const mockChild = {
        on: vi.fn((event, callback) => {
          if (event === 'error') {
            // Simulate error event being emitted
            setTimeout(() => callback(new Error('Command not found: npx')), 100);
          }
        }),
        kill: vi.fn(),
        pid: 12345,
      };
      mockExeca.mockReturnValue(mockChild as any);
      
      const { lastFrame } = render(<Studio />);
      
      // Wait for the error to be caught
      await waitForComponentCompletion(() => lastFrame() || '');
      
      const output = lastFrame() || '';
      expect(output).toContain('Error starting Drizzle Studio:');
      expect(output).toContain('Command not found: npx');
      expect(output).toContain('Make sure drizzle-kit is installed');
    });

    it('shows starting state initially', () => {
      // Don't resolve the execa promise to keep it in starting state
      mockExeca.mockImplementation(() => new Promise(() => {}) as any);
      
      const { lastFrame } = render(<Studio />);
      
      expect(lastFrame()).toContain('Starting Drizzle Studio...');
    });
  });
});