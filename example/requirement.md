# reval NPM Example - Requirements Document

## Overview

This example demonstrates how to use reval as a standalone npm package in any project. It showcases the complete workflow from installation to running benchmarks and exploring results.

## User Journey

A developer wants to benchmark their LLM-powered function in their existing TypeScript project. They should be able to:

1. Install reval via npx (no global installation required)
2. Initialize a new reval project in their directory
3. Configure their benchmark function and test data
4. Run benchmarks and explore results

## Core Requirements

### 1. Package Installation & Distribution

- **Requirement**: Users can install and run reval via `npx @reval/cli`
- **Note**: Package must be published to npm registry (currently `@reval/cli` is private)
- **Alternative**: For development testing, support local installation via file path

### 2. Project Initialization

- **Command**: `npx @reval/cli init` or `reval init` (after installation)
- **Behavior**:
  - Creates `reval.config.ts` with sensible defaults
  - Creates `.reval/` directory
  - Runs `reval db create` automatically to set up SQLite database
  - Creates `drizzle.config.ts` with correct paths pointing to `.reval/reval.db`
  - Creates sample CSV data file for demonstration
  - Provides clear next steps to the user

### 3. Database Setup

- **Command**: `reval db create`
- **Behavior**:
  - Creates `.reval/reval.db` SQLite database
  - Runs all necessary migrations via Drizzle
  - Ensures `drizzle.config.ts` exists with correct configuration
  - Exits successfully with confirmation message

### 4. Directory-Scoped Operation

- **Critical Requirement**: All CLI commands MUST operate in the current working directory
- **No Fallback**: Commands look for config and database ONLY in current directory
- **Files Required**:
  - `reval.config.ts` in current directory
  - `.reval/reval.db` in current directory
  - `drizzle.config.ts` in current directory (created by init/db create)

### 5. Full CLI Functionality

All commands must work in the example directory:

- `reval run` - Execute benchmarks
- `reval list` - Show recent benchmark runs
- `reval show <runId>` - Display detailed run results
- `reval ui` - Start web interface for exploring results
- `reval db create` - Initialize database
- `reval db migrate` - Update database schema
- `reval init` - Project initialization

## Implementation Tasks

### 1. Package Publication Setup

- [ ] Configure `@reval/cli` package.json for npm publication
- [ ] Remove `"private": true` from CLI package
- [ ] Ensure proper bin configuration: `"reval": "dist/cli.js"`
- [ ] Build and publish to npm registry

### 2. Init Command Enhancement

- [ ] `reval init` creates complete project structure:
  ```
  ./
  ├── reval.config.ts      # Default configuration
  ├── drizzle.config.ts    # Database configuration
  ├── data/
  │   └── sample.csv       # Example test data
  └── .reval/
      └── reval.db         # SQLite database
  ```

### 3. Database Creation Integration

- [ ] `reval db create` automatically creates `drizzle.config.ts`
- [ ] Drizzle config points to `.reval/reval.db` in current directory
- [ ] All database operations respect current working directory

### 4. Configuration Discovery

- [ ] CLI looks for `reval.config.ts` in current working directory ONLY
- [ ] No fallback to parent directories or global configs
- [ ] Clear error messages when config/database not found

### 5. Example Project Setup

Create `/example` directory with:
- [ ] `package.json` - Demonstrates how to add reval to existing project
- [ ] `README.md` - Step-by-step usage instructions
- [ ] Example function to benchmark
- [ ] Test data CSV file

## Success Criteria

1. **Zero-Config Start**: `npx @reval/cli init` creates fully functional project
2. **Isolated Operation**: All commands work within project directory without external dependencies
3. **Complete Workflow**: User can run full benchmark cycle (init → configure → run → explore)
4. **Clear Documentation**: Example includes comprehensive usage instructions

## File Structure After Init

```
example/
├── package.json              # Project dependencies (optional)
├── reval.config.ts          # Benchmark configuration
├── drizzle.config.ts        # Database configuration
├── data/
│   └── sample.csv           # Test data
├── src/                     # User's code (optional)
│   └── my-function.ts       # Function to benchmark
└── .reval/
    └── reval.db             # SQLite database
```

## Example Commands Sequence

```bash
# 1. Navigate to any directory
cd /path/to/my-project

# 2. Initialize reval project
npx @reval/cli init

# 3. Customize reval.config.ts (point to your function)
# Edit reval.config.ts to reference your function and data

# 4. Run benchmark
npx @reval/cli run

# 5. Explore results
npx @reval/cli list
npx @reval/cli ui

# 6. Show specific run details
npx @reval/cli show <runId>
```

## Error Handling Requirements

- **Missing Config**: Clear error when `reval.config.ts` not found in current directory
- **Missing Database**: Clear error when `.reval/reval.db` not found, suggest running `reval db create`
- **Invalid Data**: Helpful errors for malformed CSV or config files
- **Network Issues**: Graceful handling of package installation failures

## Testing Strategy

- [ ] E2E test: Full workflow from `npx install` to `reval ui`
- [ ] Directory isolation: Ensure commands don't interfere with parent/sibling directories
- [ ] Error scenarios: Test behavior when files are missing or corrupted
- [ ] Package installation: Test both npx and local installation methods