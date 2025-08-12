# CLI Test Suite

This directory contains comprehensive tests for the `@reval/cli` package following the strategy outlined in `CLI_TEST.md`.

## Structure

```
test/
├── utils/              # Test utilities
│   ├── captureOutput.ts    # Capture stdout/stderr
│   ├── withTempDir.ts      # Temporary directory helper  
│   ├── writeFiles.ts       # File tree creation helper
│   └── mockProcessExit.ts  # Process exit mocking
├── fixtures/           # Test fixtures
│   └── index.ts           # Sample configs and data
├── unit/              # Unit tests (fast, isolated)
│   ├── version.test.ts
│   ├── index.test.ts      # Help command
│   ├── list.test.ts
│   ├── show.test.ts
│   ├── init.test.ts
│   ├── export.test.ts
│   ├── run.test.ts
│   ├── db-commands.test.ts
│   └── ui.test.ts
├── integration/       # Integration tests (filesystem, cross-module)
│   └── init-export-flow.int.test.ts
├── e2e/              # End-to-end tests (full CLI)
│   └── cli-smoke.e2e.test.ts
├── setup.ts          # Test setup configuration
└── README.md         # This file
```

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run only unit tests
npm test -- unit/

# Run only integration tests  
npm test -- integration/

# Run specific test file
npm test -- version.test.ts

# Watch mode
npm test -- --watch
```

## Test Categories

### Unit Tests
- Fast execution (< 100ms per test)
- Mock all external dependencies (@reval/core, fs, execa)
- Test command parsing, rendering, and business logic
- 90%+ code coverage target

### Integration Tests  
- Use real filesystem in temporary directories
- Limited mocking (only network/process spawns)
- Test cross-module behavior and file I/O
- Focus on realistic workflows

### E2E Tests
- Test actual CLI binary invocation
- Minimal mocking, real processes where safe
- Smoke tests for critical user journeys
- May require build step

## Key Testing Patterns

### Mocking Strategy
```typescript
// Mock @reval/core functions
vi.mock('@reval/core', () => ({
  run: vi.fn(),
  listRuns: vi.fn(),
  exportRun: vi.fn(),
}));

// Mock filesystem operations
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  writeFileSync: vi.fn(),
}));
```

### Temporary Directories
```typescript
import { withTempDir } from '../utils';

it('creates files in temp directory', async () => {
  await withTempDir(async (tempDir) => {
    // Test file operations in isolated directory
    // Directory is automatically cleaned up
  });
});
```

### Async Component Testing
```typescript
const { lastFrame, waitUntilExit } = render(<Command />);
await waitUntilExit(); // Wait for async operations
expect(lastFrame()).toContain('expected output');
```

## Coverage Goals

- **Unit Tests**: ≥90% statements/branches/functions/lines
- **Integration Tests**: Key user workflows covered
- **E2E Tests**: Smoke coverage for help/version/init

## CI Considerations

- Tests run in Node.js environment
- No external dependencies (databases, servers)
- Deterministic, no flaky timing issues
- Fast feedback (< 30 seconds total)

## Debugging Tests

```bash
# Run with debug output
npm test -- --reporter=verbose

# Run single test with logs
npm test -- version.test.ts --reporter=verbose

# Debug specific test
node --inspect-brk node_modules/.bin/vitest version.test.ts
```