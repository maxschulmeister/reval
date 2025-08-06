import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/run.ts'),
      name: 'RevalCore',
      fileName: 'run',
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      external: [
        'better-sqlite3',
        'drizzle-orm',
        'data-forge',
        'data-forge-fs',
        'nanoid',
        'p-queue',
        'p-retry'
      ]
    },
    target: 'node18'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@types': resolve(__dirname, 'src/types')
    }
  }
});