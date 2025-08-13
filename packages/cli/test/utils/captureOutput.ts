import { vi } from 'vitest';

export interface CapturedOutput {
  stdout: string;
  stderr: string;
}

export function captureOutput(): {
  getCaptured: () => CapturedOutput;
  restore: () => void;
} {
  const originalWrite = process.stdout.write;
  const originalWriteErr = process.stderr.write;
  
  let stdoutBuffer = '';
  let stderrBuffer = '';

  // Mock stdout.write
  process.stdout.write = vi.fn().mockImplementation((chunk: any) => {
    stdoutBuffer += String(chunk);
    return true;
  });

  // Mock stderr.write
  process.stderr.write = vi.fn().mockImplementation((chunk: any) => {
    stderrBuffer += String(chunk);
    return true;
  });

  return {
    getCaptured: () => ({
      stdout: stdoutBuffer,
      stderr: stderrBuffer,
    }),
    restore: () => {
      process.stdout.write = originalWrite;
      process.stderr.write = originalWriteErr;
      stdoutBuffer = '';
      stderrBuffer = '';
    },
  };
}