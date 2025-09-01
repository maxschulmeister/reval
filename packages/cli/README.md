# @reval/cli

The command-line interface for the reval benchmark framework.

## Installation

This CLI is part of the reval monorepo and is intended to be run from the root:

```bash
# Development
npm run reval-cli

# After building
npm run build
./packages/cli/build/cli.js
```

## Commands

### `reval run`

Execute a benchmark run based on configuration.

**Options:**

- `-c, --config <path>` - Path to reval config file (default: auto-discover)
- `-d, --data <path>` - Path to CSV file or directory (overrides config)
- `-j, --concurrency <num>` - Parallelism for test execution
- `-r, --retries <num>` - Retries for flaky executions
- `--dry` - Validate config and inputs without executing
- `-v, --verbose` - Increase log verbosity

**Example:**

```bash
reval run --config ./my-config.ts --concurrency 5 --dry
```

### `reval list`

List the most recent benchmark runs from the local database.

**Options:**

- `-n, --limit <num>` - Number of runs to display (default: 20)
- `--json` - Output in JSON format

**Example:**

```bash
reval list --limit 10 --json
```

### `reval show <run_id>`

Show detailed information about a specific run.

**Options:**

- `--json` - Output full JSON payload

**Example:**

```bash
reval show abc123def456
```

### `reval export <run_id>`

Export results for a run to a file.

**Options:**

- `--format <json|csv>` - Export format (default: json)
- `-o, --out <path>` - Output file path

**Example:**

```bash
reval export abc123def456 --format csv --out results.csv
```

### `reval db create`

Create a new local database.

**Options:**

- `--force` - Skip confirmation and overwrite existing database

### `reval db migrate`

Run database migrations to ensure schema is current.

### `reval db studio`

Open Drizzle Studio for the local database.

### `reval ui`

Start the UI viewer for interactive exploration.

### `reval init`

Initialize a new reval project with sample config and data.

**Options:**

- `--force` - Skip confirmation and overwrite existing files

### `reval version`

Print CLI and core versions.

## Configuration Discovery

The CLI automatically discovers configuration files in this order:

1. Path specified with `--config` flag
2. `./reval.config.ts` in current directory

## Database

By default, the CLI uses a SQLite database located at `./.reval/reval.db`. This location is configured in the core package's Drizzle config.

## Error Handling

All commands:

- Provide clear, actionable error messages
- Exit with non-zero codes on failure
- Exit with zero on success
- Support `--verbose` for detailed logging where applicable
