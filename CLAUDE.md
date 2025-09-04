# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**reval** is a benchmark framework for evaluating LLM applications. It executes TypeScript/JavaScript functions against CSV datasets, computes metrics (speed, accuracy), and stores results in a local SQLite database. The project is organized as a monorepo with three main packages: **core** (benchmark engine), **cli** (command-line interface), and **ui** (web viewer).

## Development Commands

Use yarn as a package manager.

### Core Development

```bash
# Run benchmark with current config
npm run reval
yarn reval

# Build all packages
npm run build
yarn build

# Run tests across all packages
npm test
yarn test

# Run specific tests
cd packages/core && npm test
cd packages/cli && npm test

# Lint all packages
npm run lint
yarn lint

# Database operations
npm run db-create    # Initialize SQLite database
npm run db-ui       # Open Drizzle Studio
```

### Package-Specific Commands

```bash
# CLI development
npm run reval-cli    # Start CLI in watch mode

# UI development
npm run ui          # Start Next.js dev server

# Core development
cd packages/core && npm run dev    # Watch mode for core
```

## Architecture

### Core Package (`packages/core/`)

- **Entry point**: `src/index.ts` exports public APIs
- **Main execution**: `src/run.ts` contains benchmark execution logic
- **API layer**: `src/api/` contains programmatic interfaces (run, queries, migrations)
- **Database**: Uses Drizzle ORM with better-sqlite3, schema in `src/db/schema.ts`
- **Configuration**: `reval.config.ts` defines benchmark parameters using `defineConfig`
- **Types**: `src/types/config.ts` defines the core Config interface

### CLI Package (`packages/cli/`)

- **Framework**: Uses Pastel (React-based CLI framework) with Zod for argument validation
- **Commands**: Located in `source/commands/` with subcommands in nested folders (e.g., `db/`)
- **Architecture**: Thin wrapper around core APIs, no business logic duplication
- **Entry**: `source/cli.ts` is the main CLI entrypoint

### Configuration System

The benchmark is configured via `reval.config.ts` which must export a `defineConfig()` call:

```typescript
export default defineConfig({
  concurrency: 10,
  retries: 2,
  data: {
    path: "./data/test.csv",
    features: "input_column",
    target: "expected_output",
    variants: { models: ["gpt-4", "claude"] },
  },
  run: {
    function: yourRevalFunction,
    args: (context) => [context.features, context.variants.models],
    result: (response) => ({
      prediction: response.content,
      tokens: { in: response.tokens.in, out: response.tokens.out },
    }),
  },
});
```

### Database & Persistence

- Database stored at `./.reval/reval.db` (SQLite)
- Schema: `runs` table for benchmark runs, `executions` table for individual test executions
- Drizzle ORM configuration in `packages/core/drizzle.config.ts`
- Migration commands: `db-create` initializes, `db-ui` opens Drizzle Studio

### Monorepo Structure

- **Build system**: Turborepo with Yarn workspaces
- **Package manager**: Yarn v4.9.2
- **Cross-package dependencies**: CLI depends on core, UI depends on core
- **Scripts**: Root package.json delegates to individual packages via turbo

## Key Implementation Details

### Reval Execution Flow

1. Load config via `loadConfig()` from `src/utils/`
2. Load CSV data via `loadData()` using data-forge
3. Generate argument combinations from variants using `combineArgs()`
4. Execute function with p-queue for concurrency control and p-retry for retries
5. Store results via `saveRun()` to SQLite database

### CLI-Core Integration

- CLI uses core's programmatic APIs from `src/api/`
- `run()` function accepts RunOptions for overrides (concurrency, retries, dryRun)
- Query helpers: `listEvals()`, `getEvalDetails()`, `exportEval()`
- Migration helpers: `runMigrations()`, `initializeDatabase()`

### Testing Strategy

- **Core**: Unit tests in `test/` directory, integration tests for database operations
- **CLI**: Comprehensive test suite with utilities in `test/utils/`, unit tests in `test/unit/`, integration tests, and E2E smoke tests
- **Test utilities**: `withTempDir()` for filesystem tests, mocking for external dependencies

### Configuration Discovery

CLI uses this precedence order:

1. `--config` flag value
2. `./reval.config.ts` in current directory

### Package Management

- Uses Yarn workspaces with `packages/*` pattern
- Shared dependencies (better-sqlite3, @types/better-sqlite3) hoisted to root
- Cross-package references use `workspace:*` syntax
