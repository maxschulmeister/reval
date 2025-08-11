# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Project Management
- `pnpm install` - Install all workspace dependencies
- `pnpm build` - Build all packages using Turbo
- `pnpm dev` - Start development servers for all packages
- `pnpm lint` - Run TypeScript type checking and linting across all packages
- `pnpm test` - Run all tests using Vitest
- `pnpm clean` - Clean build artifacts and cache files

### Core Package (@reval/core)
- `cd packages/core && pnpm reval` - Run the benchmark evaluation system
- `cd packages/core && pnpm dev` - Start development mode with file watching
- `cd packages/core && pnpm test` - Run core package tests
- `cd packages/core && pnpm db-create` - Initialize database schema and run migrations
- `cd packages/core && pnpm db-ui` - Launch Drizzle database management UI
- `cd packages/core && pnpm lint` - Run TypeScript compilation check (noEmit)

### UI Package (@reval/ui)
- `cd packages/ui && pnpm dev` - Start Next.js development server with Turbopack
- `cd packages/ui && pnpm build` - Build Next.js application
- `cd packages/ui && pnpm start` - Start production server
- `cd packages/ui && pnpm lint` - Run Next.js linting

### Single Test Execution
- `cd packages/core && pnpm test -- path/to/test/file.test.ts` - Run specific test file
- `cd packages/core && pnpm test -- -t "test name"` - Run tests matching specific name
- `cd packages/core && pnpm test -- watch` - Run tests in watch mode

## Architecture Overview

Reval is a monorepo benchmark framework for evaluating LLM applications using a turbo-driven architecture with three main components:

### Core Package (`packages/core`)
The benchmark execution engine that handles data loading, configuration management, and execution orchestration.

**Key Architecture:**
- **Configuration-Driven**: Uses `reval.config.ts` to define benchmark parameters, data sources, and execution variants
- **Data Loading System**: Supports CSV files and direct data arrays with validation and trimming capabilities
- **Variant System**: Generates test combinations for A/B testing different models, parameters, or prompts
- **Execution Engine**: Uses p-queue for concurrency control and p-retry for error handling
- **Database Layer**: SQLite with Drizzle ORM for storing execution results and metadata

**Core Components:**
- `src/run.ts` - Main benchmark execution orchestrator with retry logic and progress tracking
- `src/utils/` - Data loading utilities with comprehensive validation, configuration merging, and cartesian product generation for variants
- `src/db/` - Database setup and schema management with migration support
- `src/types/config.ts` - TypeScript interfaces for configuration and execution context

**Data Loading Architecture:**
The system supports two data loading patterns:
1. **Path-based (CSV)**: Loads data from CSV files with features extraction and target column identification
2. **Direct arrays**: Uses in-memory data arrays for both features and targets with variant support

### UI Package (`packages/ui`)
Next.js dashboard for visualizing benchmark results with React and statistical analysis.

**Key Architecture:**
- **Data Visualization**: Recharts for performance metrics and execution statistics
- **Execution History**: View and filter past benchmark runs with detailed results
- **Live Updates**: WebSocket integration for real-time execution status
- **Database Integration**: Direct SQLite access for querying execution results

**Key Components:**
- `app/run/[id]/` - Individual run results with execution details and error logs
- `app/api/runs/` - REST API endpoints for run data and events
- `components/executions/` - Data tables, filters, and status displays
- `lib/utils.ts` - Data processing and statistical analysis utilities

### Data Processing Architecture
**Validation System**: Comprehensive validation for all data inputs including:
- CSV file validation (existence, format, column presence)
- Target and features schema validation
- Variant configuration validation (non-empty arrays, proper structure)
- Data integrity checks (mismatched lengths, empty datasets)

**Configuration Pattern**: Uses `defineConfig` helper for type-safe configuration with:
- Variant combinations for multi-variable testing
- Argument mapping functions for dynamic test parameter generation
- Result extraction functions for metric standardization

**Execution Flow**:
1. Load and validate configuration from `reval.config.ts`
2. Load and validate data (CSV or direct arrays)
3. Generate argument combinations using cartesian product of variants
4. Execute benchmarks with concurrency control and retry logic
5. Store results in SQLite database with execution metadata

### Database Schema
- **runs**: Stores benchmark metadata (function, variants, timestamps)
- **executions**: Individual execution results with status, timing, and metrics
- **Streaming storage**: Results persisted as they complete for large datasets

## Testing Patterns

**Test Organization**: Located in `tests/config/` with comprehensive coverage of:
- Data loading validation scenarios
- Configuration property validation
- Error handling and edge cases
- Variant combination generation

**Mocking Strategy**: Uses vitest with `vi.doMock` for:
- Configuration file mocking to avoid file system dependencies
- Temporary CSV file creation for isolated test scenarios
- Module isolation between test suites

**Test Data Patterns**:
- Temporary CSV files created and cleaned up in `beforeEach`/`afterEach`
- Comprehensive validation testing for all configuration properties
- Error case testing for malformed inputs and edge cases