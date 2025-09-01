# @reval/cli Test Plan (Unit + Integration + E2E)

This document defines a complete testing strategy for the CLI package at packages/cli.

Goals
- High confidence in command parsing and output
- Verify side effects on filesystem and process spawning
- Validate interactions with @reval/core without brittle coupling
- Provide fast unit feedback and targeted integration/E2E coverage

Test Runner and Conventions
- Runner: vitest (already configured in package.json)
- Location: keep tests within packages/cli/test
  - packages/cli/test/unit/** for pure unit tests per command
  - packages/cli/test/integration/** for behavior across modules and I/O
  - packages/cli/test/e2e/** for end-to-end CLI invocations
- Filenames: <command>.test.ts for unit, <feature>.int.test.ts for integration, <scenario>.e2e.test.ts for E2E
- Use vi.mock for dependency isolation; reset mocks between tests with vi.resetAllMocks()
- Snapshot testing allowed for stable help/version outputs

Core Utilities and Fixtures (to be added under packages/cli/test)
- utils/
  - captureOutput.ts: intercept process.stdout/stderr and return written strings
  - withTempDir.ts: create temp dir via fs.mkdtemp, chdir in callback, restore afterward
  - writeFiles.ts: helper to materialize fixture trees (config, data files)
  - mockProcessExit.ts: stub process.exit to avoid terminating the test runner
- fixtures/
  - minimal-config/: reval.config.ts with minimal valid config
  - sample-data/: data/sample.csv small dataset used by run and export

Mocking Strategy
- @reval/core: mock at unit level to simulate listEvals, getEvalDetails, exportEval, initializeDatabase, runMigrations, and any run/execute entry points
- fs / fs/promises: mock in unit tests for init and export; use real FS in integration with temp dirs
- execa: mock for ui and db/studio commands to avoid starting real processes in unit/integration; consider enabling a smoke E2E behind a CI guard
- process.env and cwd: isolate via withTempDir and environment setup/teardown

Unit Tests by Command (packages/cli/src/commands/*.tsx)
1) index (help root)
- Renders help, lists top-level commands (run, list, show, export, init, ui, db)
- Unknown command shows help or error path
- --help prints help text and exits with code 0

2) run
- Parses options: --config, --data, --concurrency, --retries, --dry, --verbose; validate defaults
- Calls @reval/core entry once with derived options
- Prints run summary; verbose toggles extra logs
- Handles error from core: non-zero exit path and user-friendly message

3) init
- When target files do not exist: creates reval.config.ts, data/ directory, sample.csv; calls @reval/core to initialize DB
- When files exist without --force: refuses to overwrite and reports
- With --force: overwrites config and sample files
- Proper log messages for created/overwritten assets

4) list
- Calls listRuns(limit) and renders a table; --json prints valid JSON array only
- Validates limit parsing and default
- Empty results path: prints friendly message or empty JSON

5) show
- Requires a run ID; errors on missing/invalid id
- Calls getRunDetails(id) and prints structured details; --json prints valid JSON object
- Handles run not found path

6) export
- Requires run ID and output path; validates format option (json|csv) and defaults
- Calls exportRun with correct args; writes file at target path; respects existing directories
- Errors if write fails (e.g., parent dir missing) with helpful message

7) version
- Prints CLI and core versions; snapshot-safe formatting

8) ui
- Spawns dev server via execa; prints URL guidance
- Handles spawn error (non-zero exit or exception) with clear message

9) db:create / db:migrate / db:studio
- create: initializeDatabase invoked; respects --force option
- migrate: runMigrations invoked; prints migration summary
- studio: spawns drizzle studio via execa; errors surfaced clearly

Integration Tests
Focus on realistic FS and limited mocking. Use withTempDir, real fs, and mock only network/process spawns.

Scenarios
- init happy path: creates config and data; idempotency check with and without --force
- init → run minimal config with sample data using mocked core run path that behaves deterministically; verify printed summary and exit code 0
- list and show reading from mocked core with pre-seeded results; ensure JSON and text outputs are correct and consistent
- export writes file to temp dir, both json and csv; verify content structure returned from mocked core matches file contents
- db commands call corresponding core functions and report results

End-to-End (E2E) Smoke Tests
- Build then spawn the CLI entry (node build/cli.js) using execa in a temp workspace
- Scenarios (keep fast and deterministic, can run with core mocked via NODE_OPTIONS/Vitest set-up):
  - reval --help prints help and exits 0
  - reval version prints versions and exits 0
  - reval init creates files and exits 0 in empty temp dir; re-run without --force exits non-zero or prints warning
- Optionally gate heavier flows behind CI or a long-running tag

Output Validation Strategy
- Prefer string includes for key lines over brittle whole-output comparisons
- For stable banners/help/version, use snapshots
- For JSON outputs, parse and assert shapes/types

Error Handling and Exit Codes
- Stub process.exit and assert on intended code without killing test
- Ensure error messages are actionable and appear on stderr when appropriate

Performance and Isolation
- Avoid hitting real databases or servers in unit/integration
- Use minimal fixtures and small CSV
- Run tests in parallel where possible; avoid global state between tests

Coverage Goals
- Unit: ≥ 90% statements/branches across commands
- Integration: Key flows covered (init, run summary, list/show, export)
- E2E: Smoke coverage on help/version/init

CI Considerations
- Ensure tests are deterministic and work in clean environments
- Build once before E2E; cache node_modules and build artifacts as needed

Proposed Initial Implementation Order
1) Utilities: captureOutput, withTempDir, writeFiles, mockProcessExit
2) Unit: version, index(help), list(json), show(json)
3) Unit: init and export (fs-heavy)
4) Unit: run (options + summary; core mocked)
5) Integration: init → export flow in temp dir
6) E2E: help, version, init

Edge Cases to Include
- Missing required args (id, output)
- Invalid flags (format, concurrency/retries not numbers)
- Existing files without --force
- Core function throws
- execa spawn fails or exits non-zero

Notes
- Align message strings and option names with current src implementation
- Prefer pure unit tests for parsing and rendering; reserve integration for FS and cross-module behavior