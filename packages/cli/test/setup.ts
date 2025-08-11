import { vi } from 'vitest';

// Mock React components for testing
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    // Add any React mocks if needed
  };
});

// Setup ink-testing-library
vi.mock('ink-testing-library', async () => {
  const actual = await vi.importActual('ink-testing-library');
  return {
    ...actual,
    render: vi.fn().mockImplementation((element) => ({
      lastFrame: vi.fn().mockReturnValue(''),
      waitUntilExit: vi.fn().mockResolvedValue(undefined),
    })),
  };
});

// Global test setup
beforeEach(() => {
  vi.resetAllMocks();
});