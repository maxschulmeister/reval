import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

export async function withTempDir<T>(
  callback: (tempDir: string) => T | Promise<T>
): Promise<T> {
  const originalCwd = process.cwd();
  const tempDir = mkdtempSync(join(tmpdir(), 'reval-test-'));

  try {
    process.chdir(tempDir);
    const result = await callback(tempDir);
    return result;
  } finally {
    process.chdir(originalCwd);
    // Clean up temp directory
    rmSync(tempDir, { recursive: true, force: true });
  }
}