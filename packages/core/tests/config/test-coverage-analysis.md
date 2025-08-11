# Test Coverage Analysis for @reval/core

## Executive Summary

The test suite has **partial coverage** with significant gaps in key areas. While core functionality like configuration validation, data loading, and argument processing have good coverage, critical components like the main `run()` function, database operations, and utility functions lack proper testing.

**Overall Coverage Assessment: 60%** - Feature-complete for configuration, partial for runtime execution.

---

## Detailed Coverage Analysis

### ✅ Well-Covered Areas

#### 1. Configuration Validation (`src/utils/config.ts`)
**Coverage: 95%** - Excellent unit test coverage
- ✅ `validateConcurrency()` - All edge cases tested
- ✅ `validateInterval()` - Comprehensive validation  
- ✅ `validateRetries()` - Complete error handling
- ✅ `validateConfig()` - Full integration testing

#### 2. Data Loading Core (`src/utils/index.ts`)
**Coverage: 80%** - Good integration test coverage
- ✅ `loadData()` - CSV file loading, validation errors
- ✅ `combineArgs()` - Cartesian product generation
- ✅ Path-based data loading with comprehensive error scenarios
- ✅ Direct data array validation

#### 3. Function Configuration (`tests/config/function.test.ts`)
**Coverage: 85%** - Good conceptual coverage
- ✅ Async function signatures (single, multiple, object parameters)
- ✅ Error handling (sync/async errors, Promise.reject)
- ✅ Return value structures (OpenAI, Claude, custom APIs)
- ✅ Parameter validation concepts

#### 4. Result Transformation (`tests/config/results.test.ts`) 
**Coverage: 90%** - Comprehensive result mapping
- ✅ Required properties (`prediction`, `tokens.in`, `tokens.out`)
- ✅ Different API response structures
- ✅ Edge cases (missing properties, invalid tokens)

---

### ❌ Missing or Insufficient Coverage

#### 1. **CRITICAL**: Main Run Function (`src/run.ts`)
**Coverage: 0%** - No tests for the core orchestration logic
```typescript
// Missing tests for:
const run = async () => { /* 140 lines of complex logic */ }
```

**Missing Test Scenarios:**
- Queue management with `p-queue` (concurrency, interval)
- Retry logic with `p-retry` 
- Error handling and status tracking
- Execution timing measurements
- Benchmark object creation
- Integration with `saveRun()`

#### 2. **CRITICAL**: Database Operations (`src/db/`)
**Coverage: 0%** - No tests for persistence layer

**Missing Components:**
- `saveRun()` function testing
- Database schema validation
- SQLite connection handling
- Error handling for DB operations
- Drizzle ORM integration

#### 3. **HIGH**: Utility Functions (`src/utils/index.ts`)
**Coverage: 40%** - Key utilities untested

**Missing Functions:**
- `getFeatures()` - Feature extraction from arguments
- `getVariant()` - Variant matching logic  
- `defineConfig()` - Type-safe configuration helper
- `loadConfig()` - Configuration loading with error handling

#### 4. **MEDIUM**: CSV File Extensions (`src/utils/index.ts`)
**Coverage: Partial** - Missing validation tests

**Missing Scenarios:**
- Non-CSV file extension rejection
- File extension case sensitivity
- Invalid file format handling

#### 5. **MEDIUM**: Integration Testing
**Coverage: 20%** - Limited end-to-end testing

**Missing Integration Tests:**
- Full workflow: config → data → run → save
- Queue behavior under load
- Retry mechanisms in practice
- Database persistence verification

---

## Priority Test Implementation Plan

### Phase 1: Critical Missing Tests (Must Fix)

1. **Main Run Function Tests**
   - Mock `p-queue` and `p-retry` behavior
   - Test execution flow with various argument combinations
   - Verify error handling and status tracking
   - Validate benchmark object structure

2. **Database Layer Tests**
   - Mock SQLite database for `saveRun()` testing
   - Test schema compliance
   - Verify error handling for DB failures

3. **Utility Function Tests**
   - Unit tests for `getFeatures()` and `getVariant()`
   - Edge cases for feature/variant matching
   - Config loading error scenarios

### Phase 2: Coverage Enhancements (Should Fix)

1. **Integration Tests**
   - End-to-end workflow testing
   - Performance under different concurrency settings
   - Database integration verification

2. **Edge Case Coverage**
   - File extension validation
   - Memory pressure scenarios
   - Network timeout simulation

---

## AI Agent Prompt for Test Implementation

Below is the specific prompt to provide to an AI coding assistant to address these testing gaps:

---

# Test Implementation Prompt for AI Agent

You are tasked with implementing comprehensive tests for the @reval/core package to achieve feature-complete test coverage. The existing test suite has significant gaps that need to be addressed.

## Context
- **Project**: @reval/core - A benchmarking framework for evaluating functions
- **Test Framework**: Vitest
- **Source Directory**: `/Users/max/Documents/reval/packages/core/src/`
- **Test Directory**: `/Users/max/Documents/reval/packages/core/tests/`

## Critical Missing Test Coverage

### 1. PRIORITY 1: Main Run Function (`src/run.ts`)

Create comprehensive tests for the main `run()` function. This is the core orchestration logic with 140 lines of complex functionality.

**Required Test File**: `tests/run.test.ts`

**Test Requirements:**
- Mock dependencies: `p-queue`, `p-retry`, `loadConfig`, `loadData`, `saveRun`
- Test execution flow with different argument combinations
- Verify queue management (concurrency, interval settings)
- Test retry mechanisms and error handling
- Validate timing measurements and status tracking
- Test benchmark object creation and structure
- Mock and verify `saveRun()` calls with correct data

**Key Test Scenarios:**
```typescript
describe('run() function', () => {
  // Mock all dependencies before each test
  
  it('should execute function with correct concurrency settings')
  it('should handle retries according to config')
  it('should track execution timing accurately') 
  it('should create proper benchmark structure')
  it('should save results to database')
  it('should handle function execution errors')
  it('should process variants correctly')
  it('should extract features from arguments')
})
```

### 2. PRIORITY 1: Database Operations (`src/db/`)

Create tests for the database persistence layer.

**Required Test Files**: 
- `tests/db/save-run.test.ts`
- `tests/db/schema.test.ts`

**Test Requirements:**
- Mock SQLite database and Drizzle ORM
- Test `saveRun()` function success and error scenarios
- Verify schema compliance for runs and executions tables
- Test database connection handling
- Validate JSON serialization for complex fields

### 3. PRIORITY 1: Utility Functions (`src/utils/index.ts`)

Create unit tests for untested utility functions.

**Required Test File**: `tests/utils/utilities.test.ts`

**Test Requirements:**
```typescript
describe('getFeatures()', () => {
  it('should extract features from array arguments')
  it('should extract features from object arguments') 
  it('should handle nested object structures')
  it('should return undefined for non-matching features')
})

describe('getVariant()', () => {
  it('should match variants in array arguments')
  it('should match variants in object arguments')
  it('should handle multiple variant types')
  it('should return empty object for no matches')
})

describe('defineConfig()', () => {
  it('should return config object unchanged')
  it('should provide proper TypeScript inference')
})
```

### 4. PRIORITY 2: Integration Tests

Create end-to-end integration tests.

**Required Test File**: `tests/integration/workflow.test.ts`

**Test Requirements:**
- Test complete workflow: config → data → run → database
- Use real CSV files and temporary databases
- Verify data flow between all components
- Test error propagation through the system

### 5. PRIORITY 2: Enhanced Data Loading Tests

Add missing test scenarios to existing data loading tests.

**Enhance**: `tests/config/data-loading.int.test.ts`

**Missing Scenarios:**
- Non-CSV file extension rejection
- File extension case sensitivity testing
- Invalid file format error handling

## Implementation Guidelines

1. **Mocking Strategy**: Use Vitest's `vi.mock()` for external dependencies
2. **Test Data**: Create reusable test fixtures for common configurations
3. **Error Testing**: Ensure every error path has corresponding test coverage
4. **Performance**: Add tests for concurrency and timing behavior
5. **Type Safety**: Ensure tests validate TypeScript type compliance

## Success Criteria

- All new tests pass consistently
- Code coverage increases to >90% for all source files
- No regression in existing functionality
- Tests execute quickly (<5 seconds total)
- Comprehensive error scenario coverage

## Files to Create/Modify

**New Test Files:**
- `tests/run.test.ts` (Main priority)
- `tests/db/save-run.test.ts`
- `tests/db/schema.test.ts` 
- `tests/utils/utilities.test.ts`
- `tests/integration/workflow.test.ts`

**Files to Enhance:**
- `tests/config/data-loading.int.test.ts` (add file extension tests)

Start with the main `run()` function tests as this is the highest priority gap in test coverage.