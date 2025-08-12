import { vi } from 'vitest';

export interface MockedProcessExit {
  exitCode: number | null;
  restore: () => void;
}

export function mockProcessExit(): MockedProcessExit {
  const originalExit = process.exit;
  let exitCode: number | null = null;

  // Mock process.exit to capture exit code instead of terminating
  process.exit = vi.fn().mockImplementation((code?: number) => {
    exitCode = code ?? 0;
    // Don't actually exit in tests
    throw new Error(`Process exited with code ${exitCode}`);
  }) as any;

  return {
    get exitCode() {
      return exitCode;
    },
    restore: () => {
      process.exit = originalExit;
      exitCode = null;
    },
  };
}