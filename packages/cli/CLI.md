# reval CLI Development Plan

This plan guides an agentic engineer to design and implement a first-class CLI for reval in iterative, testable steps. Follow the tasks in order, validating each milestone before proceeding.

## 1) Objectives (from PRD)

- Provide a simple `reval` command to run benchmarks, manage results, and integrate with the UI viewer. 
- Execute TypeScript/JavaScript functions against CSV datasets, compute metrics, and persist results to SQLite via Drizzle ORM.
- Zero-config defaults with sensible overrides; support custom config and data paths.

References: <mcfile name="PRD.md" path="/Users/max/Documents/reval/PRD.md"></mcfile>

## 2) High-level Architecture

- CLI package: Thin, user-facing command surface responsible for argument parsing, calling the core runtime, and user I/O (logs, progress, summaries).
- Core package: Provides programmatic APIs to run a benchmark and manage DB I/O. The CLI must depend on core rather than re-implementing logic.
- UI package: Optional dev-only command to launch the viewer for local inspection.

References:
- Core scripts and structure: <mcfile name="package.json" path="/Users/max/Documents/reval/packages/core/package.json"></mcfile>
- Core DB setup: <mcfile name="index.ts" path="/Users/max/Documents/reval/packages/core/src/db/index.ts"></mcfile>
- Drizzle config: <mcfile name="drizzle.config.ts" path="/Users/max/Documents/reval/packages/core/drizzle.config.ts"></mcfile>

## 3) Command Surface (MVP)

- reval run
  - Description: Execute a benchmark run based on a configuration file.
  - Options:
    - --config, -c: Path to a reval config file (default: auto-discover)
    - --data, -d: Path to a CSV file or directory (overrides config)
    - --concurrency, -j: Parallelism for test execution
    - --retries, -r: Retries for flaky executions
    - --dry: Validate config and inputs without executing
    - --verbose/-v: Increase log verbosity

- reval list
  - Description: List the most recent runs from the local DB.
  - Options:
    - --limit, -n: Number of runs to display (default: 20)
    - --json: Output in JSON

- reval show <runId>
  - Description: Show a run’s summary and aggregates (success rate, avg time, counts).
  - Options:
    - --json: Output full JSON payload

- reval export <runId>
  - Description: Export results for a run.
  - Options:
    - --format: json|csv (default: json)
    - --out: Output file path

- reval db create
  - Description: Create a new local database. If a database already exists, prompts for confirmation before replacing it.
  - Options:
    - --force: Skip confirmation and overwrite any existing database

- reval db migrate
  - Description: Ensure DB schema is current; mirrors core’s migration path.

- reval db studio
  - Description: Open Drizzle Studio for the local DB.

- reval ui
  - Description: Start the UI viewer for interactive exploration (dev aid).

- reval init
  - Description: Scaffold a sample `reval.config.ts` and run `db create` to initialize the local DB.
  - Options:
    - --force: Skip confirmation and overwrite any existing database and config file.

- reval version
  - Description: Print CLI and core versions.

Notes:
- All commands must fail gracefully with actionable errors and non-zero exit codes on failure.

## 4) Configuration Strategy

- Default discovery order for config:
  1) --config flag
  2) ./reval.config.ts in cwd
- Allow overriding data source with --data.

References: <mcfile name="reval.config.ts" path="/Users/max/Documents/reval/packages/core/reval.config.ts"></mcfile>

## 5) Data and Database Defaults

- Data reading via core (data-forge). CLI should not parse CSV directly.
- DB location defaults to ./.reval/reval.db as defined by core’s drizzle config.

## 6) Step-by-step Implementation Plan

Milestone 0: Core API Preparation (Small)
- Extract the main function from <mcfile name="run.ts" path="/Users/max/Documents/reval/packages/core/src/run.ts"></mcfile> into a callable `run(config?, overrides?)` function.
- Export `run` and database query helpers from <mcfile name="index.ts" path="/Users/max/Documents/reval/packages/core/src/index.ts"></mcfile>.
- Add types for CLI overrides (concurrency, retries, data path, etc.).
- Tests: verify `run` can be called programmatically and returns expected results.

Milestone 1: Package Scaffolding (Small)
- Create a new package: packages/cli with TypeScript, tsconfig, and bin export `reval`.
- Add dependency on @reval/core.
- Choose a lightweight CLI framework (e.g. https://github.com/vadimdemedes/pastel). Implement shared logger and error handler utilities.
– use "execa" to run commands
- Add to pnpm workspace and turbo pipeline; wire root script `pnpm reval` to packages/cli binary.
- Tests: smoke test for `reval --help` and `reval version`.

Milestone 2: Run Command (Medium)
- Implement `reval run` using the newly exposed `run` API from core.
- Add flags, config discovery, and dry-run validation.
- Execute benchmark with progress output and a final summary (count, success rate, avg time, DB path).
- Tests: e2e run against a tiny sample dataset; verify DB rows inserted and summary metrics.

Milestone 3: Results Management (Small)
- Implement `reval list`, `reval show <runId>`, and `reval export <runId>` consuming core’s DB layer or exported query helpers.
- Provide JSON output for machine consumption; human-readable tables for TTY.
- Tests: seed a run, assert list/show/export outputs.

Milestone 4: DB Tooling (Small)
- Implement `reval db create`
- Implement `reval db migrate` by invoking core’s migration programmatically or via a subprocess that calls the existing core scripts.
- Implement `reval db studio` to open Drizzle Studio against the local DB.
- Tests: ensure migrate creates schema; studio command starts (skip in CI with smoke check).

Milestone 5: UI Integration (Small)
- Implement `reval ui` to start the UI dev server at packages/ui for local inspection.
- Output the local URL and instructions.
- Tests: smoke test that the dev server starts (skipped in CI if port binding is restricted).

Milestone 6: Init Command (Small)
- Scaffold a minimal `reval.config.ts` and example CSV under data/. Guard against overwriting existing files without --force.
- Tests: run init in a temp dir; verify files created.

Milestone 7: Polish and DX (Small)
- Improve help text, examples, and error messages.
- Add `--verbose` and `--quiet` modes; consistent exit codes.
- Add `--json` to commands that print human-readable tables.
- Tests: snapshot help text; negative-path tests (missing config, invalid CSV path).

## 7) Interfaces Between CLI and Core

- Introduce and export stable, typed functions from core:
  - `run(config?, overrides?)` for executing a benchmark programmatically
  - Query helpers for runs and executions (e.g., listRuns, getRunSummary, exportRun) built atop the existing DB layer
  - Migration helpers to programmatically run migrations
- Add a `src/api/` facade in core and re-export from <mcfile name="index.ts" path="/Users/max/Documents/reval/packages/core/src/index.ts"></mcfile>.

References:
- Core entry points: <mcfile name="package.json" path="/Users/max/Documents/reval/packages/core/package.json"></mcfile>
- DB bootstrap: <mcfile name="index.ts" path="/Users/max/Documents/reval/packages/core/src/db/index.ts"></mcfile>

## 8) Error Handling and Logging

- Provide clear, actionable error messages (what failed, why, how to fix).
- Non-zero exit codes on failure; zero on success.
- Levels: error, warn, info, debug (controlled by --verbose/--quiet).
- Redact sensitive values in logs.

## 9) Testing Strategy

- Unit: argument parsing, config discovery, flag precedence.
- Integration: run end-to-end with a tiny CSV to produce a DB; verify stored metrics.
- CLI UX: snapshot help text and formatted tables; JSON outputs validated against schemas.
- CI: matrix for macOS/Linux; cache pnpm and turbo; skip long-running UI/db studio smoke in CI.

## 10) Release and Versioning

- Version the CLI in lockstep with core initially to avoid API drift.
- Ensure `reval version` prints both CLI and core versions.
- No global install required inside the monorepo; support `pnpm dlx` in the future if publishing.

## 11) Acceptance Criteria (MVP)

- `reval run` executes benchmarks via core, stores results, and prints a summary.
- `reval list`, `reval show`, `reval export` operate on the same local DB.
- `reval db migrate|studio` work against the default DB location.
- `reval ui` starts the viewer and prints an accessible URL.
- `reval init` scaffolds config and sample data safely.
- All commands have help, examples, and pass tests.

## 12) Risks and Mitigations

- Config drift between CLI and core: add typed core API and e2e tests.
- DB path mismatches: centralize path resolution respecting drizzle config and `--out`/env overrides.
- Long-running UI/DB studio in CI: mark tests as smoke and skip in CI.

## 13) Next Steps (Immediate)

0) Prepare core API: extract and export `run`, add query and migration helpers.
1) Scaffold packages/cli with bin `reval` and help/version commands.
2) Implement `reval run` using core `run` and config discovery.
3) Ship `list/show/export` using core DB helpers.
4) Add db/ui/init commands and finalize help texts.
5) Write and wire tests into the monorepo pipeline.