# Migration Plan: Remove Bun from packages/core

This document outlines the step-by-step process to migrate `packages/core` from Bun to a modern Node.js setup with Vite and pnpm.

## Current State

The `packages/core` package currently:
- Uses Bun as runtime and package manager
- Has TypeScript compilation via `bunx tsc`
- Uses Drizzle ORM with SQLite
- Contains a benchmark framework for LLM applications
- Has scripts that depend on `bun run` and `bunx` commands

## Migration Goals

- **Runtime**: Bun → Node.js
- **Package Manager**: Bun → pnpm
- **Build System**: TypeScript compiler → Vite
- **Maintain**: All existing functionality and dependencies

## Step-by-Step Migration

### Phase 1: Workspace Setup

#### 1.1 Update Root Package Manager
```bash
# Remove bun.lock
rm bun.lock

# Update root package.json
# Remove: "packageManager": "bun@1.2.19"
# Add: "packageManager": "pnpm@latest"
```

#### 1.2 Create pnpm Workspace Configuration
Create `pnpm-workspace.yaml` in project root:
```yaml
packages:
  - 'packages/*'
```

#### 1.3 Install pnpm
```bash
npm install -g pnpm
```

### Phase 2: Core Package Migration

#### 2.1 Update packages/core/package.json

**Remove dependencies:**
```json
"bun": "^1.2.19",
"bun-types": "^1.2.19"
```

**Add new devDependencies:**
```json
"vite": "^5.0.0",
"@types/node": "^20.0.0",
"tsx": "^4.0.0",
"vite-node": "^1.0.0"
```

**Update scripts:**
```json
{
  "scripts": {
    "reval": "tsx src/run.ts",
    "build": "vite build",
    "dev": "tsx watch src/run.ts",
    "test": "vitest run",
    "lint": "pnpm biome check .",
    "clean": "rm -rf dist .reval",
    "db-ui": "pnpm drizzle-kit studio",
    "db-create": "rm -rf ../../.reval && pnpm drizzle-kit generate && tsx src/db/index.ts && pnpm drizzle-kit migrate"
  }
}
```

#### 2.2 Create vite.config.ts
```typescript
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
```

#### 2.3 Update tsconfig.json
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "baseUrl": ".",
    "outDir": "./dist",
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "paths": {
      "@/*": ["./src/*"],
      "@types": ["./src/types"]
    }
  },
  "include": ["src/**/*", "dev/**/*", "drizzle.config.ts", "reval.config.ts", "vite.config.ts"],
  "exclude": ["node_modules", "dist"]
}
```

### Phase 3: Root Package Updates

#### 3.1 Update Root package.json Scripts
```json
{
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "clean": "turbo run clean",
    "reval": "turbo run reval",
    "db-create": "turbo run db-create",
    "db-ui": "turbo run db-ui",
    "ui": "cd packages/ui && pnpm dev"
  }
}
```

### Phase 4: Installation and Testing

#### 4.1 Install Dependencies
```bash
# From project root
pnpm install
```

#### 4.2 Test Build
```bash
# Test core package build
cd packages/core
pnpm build
```

#### 4.3 Test Runtime
```bash
# Test core package execution
cd packages/core
pnpm reval
```

#### 4.4 Test Database Operations
```bash
# Test database setup
cd packages/core
pnpm db-create
pnpm db-ui
```

### Phase 5: Cleanup

#### 5.1 Remove Bun Files
```bash
# Remove bun.lock if it exists
rm -f bun.lock

# Remove any .bun directories
rm -rf .bun
```

#### 5.2 Update .gitignore
Ensure `.gitignore` includes:
```
node_modules/
dist/
.reval/
pnpm-lock.yaml
```

## Verification Checklist

- [ ] All dependencies install correctly with pnpm
- [ ] TypeScript compilation works with Vite
- [ ] Core application runs with `pnpm reval`
- [ ] Database operations work correctly
- [ ] All tests pass with `pnpm test`
- [ ] Linting works with `pnpm lint`
- [ ] Build output is correct in `dist/`
- [ ] No Bun-specific code remains

## Rollback Plan

If issues arise:
1. Restore original `package.json` files
2. Reinstall with `bun install`
3. Remove `vite.config.ts`
4. Restore original `tsconfig.json`

## Benefits After Migration

- **Vite**: Fast, modern build system with HMR and optimized bundling
- **pnpm**: Efficient package management with better disk usage and faster installs
- **Node.js**: Standard runtime with broader ecosystem compatibility
- **Better tooling**: Enhanced development experience and debugging capabilities
- **Industry standard**: More familiar toolchain for most developers

## Notes

- The migration maintains all existing functionality
- Database schema and operations remain unchanged
- All existing dependencies are compatible with Node.js
- Performance should be comparable or better
- Development experience will be improved with better tooling support