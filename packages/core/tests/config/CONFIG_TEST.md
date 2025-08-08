# Comprehensive Test Plan for reval.config.ts

## Overview

This document outlines a comprehensive test plan for all properties and functionalities in the reval configuration system. The tests will cover config validation, data loading, function execution, and result processing.

## Testing Strategy

### Unit Tests vs Integration Tests

**Unit Tests** focus on isolated functionality:

- Test that config values are loaded correctly
- Verify data parsing and transformation logic
- Test individual functions in isolation
- Mock external dependencies
- Fast execution, no external library calls

**Integration Tests** focus on real-world behavior:

- Test actual library behavior (p-queue, p-retry, etc.)
- Verify end-to-end workflows
- Test error scenarios and failure modes
- Use real dependencies to catch integration issues
- Slower execution but reveals real bugs

### Key Insight

Our integration tests revealed critical bugs that unit tests missed:

- Libraries validate inputs strictly (causing crashes)
- Nullish coalescing (`??`) doesn't work with falsy values like `0`
- No input validation in our application code

**Both types of tests are essential** for comprehensive coverage.

## Test Categories

### 1. Config Structure & Validation Tests

#### 1.1 Basic Config Properties

> Tests for top-level configuration properties: concurrency, retries, interval

##### Unit Tests (Config Loading & Validation)

- [x] **Test valid config with all required properties**
  - Verify config loads with minimal required fields
  - Test with complete config including all optional fields

- [x] **Test concurrency property**
  - Valid positive integers (1, 10, 100)
  - Default behavior when not specified (undefined)
  - Config loading with invalid values (stored as-is, no validation)

- [x] **Test retries property**
  - Valid values (0, 5, 10)
  - Default behavior when not specified (undefined)
  - Config loading with invalid values (stored as-is, no validation)

- [x] **Test interval property**
  - Valid values (0, 10, 1000)
  - Default behavior when not specified (undefined)
  - Config loading with invalid values (stored as-is, no validation)

- [x] **Test nullish coalescing behavior**
  - Verify `null ?? default` and `undefined ?? default` work correctly
  - Demonstrate issues with `0 ?? default` (returns 0, not default)
  - Show problems with negative values passing through

##### Integration Tests (Runtime Behavior)

- [x] **Test p-queue behavior with invalid concurrency**
  - Concurrency 0: throws error (app crashes)
  - Negative concurrency: throws error (app crashes)
  - Valid concurrency: works correctly
  - Nullish coalescing bug: `0 ?? 10` still causes crash

- [x] **Test p-retry behavior with invalid retries**
  - Negative retries: treats as 0 retries (1 execution)
  - Decimal retries: rounds up (2.5 → 3 retries, 4 total calls)
  - Valid retries: works as expected

- [x] **Test p-queue behavior with invalid intervals**
  - Negative interval: throws validation error
  - String interval: throws type validation error
  - Decimal interval: accepted by p-queue
  - Nullish coalescing bug: `0 ?? 1000` returns 0

##### Critical Issues Discovered

- 🚨 **Nullish coalescing doesn't work for falsy values like 0**
- 🚨 **No input validation - relies on libraries to catch errors**
- 🚨 **App crashes with common invalid values (concurrency: 0)**
- 🚨 **Libraries have strict validation that our config bypasses**

#### 1.2 Data Configuration Tests

> Tests for data source configuration: path, target, features, trim, variants

- [ ] **Test data.path property**
  - Valid CSV file paths (relative and absolute)
  - Non-existent file paths (should error)
  - Invalid file formats (should error)
  - Missing path property with target and features defined as arrays
    - `target: string[]`, `features: string[] | Record<string, string[]>`
  - Missing path property without target and features defined (should error)

- [ ] **Test data.target property**
  - Valid column names that exist in CSV
  - Non-existent column names (should error)
  - Valid array of strings (when path not defined)
    - Must be same length as features array or arrays in features object
  - Missing target property (should error)
  - Empty string target (should error)

- [ ] **Test data.features property**
  - Valid column names that exist in CSV
  - Non-existent column names (should error)
  - Valid array of strings (when path not defined)
    - Arrays must be same length as target array
  - Valid object with arrays of strings (when path not defined)
    - All arrays must be same length as target array
  - Optional property behavior when not specified
  - Empty string features (should error)

- [ ] **Test data.trim property**
  - Valid positive integers (1, 10, 100)
  - Zero value (no trimming)
  - Negative values (trim from end of dataset)
  - Values larger than dataset size (should error)
  - Optional property behavior when not specified

- [ ] **Test data.variants property**
  - Valid object with array values
  - Single variant with multiple values (array format)
  - Multiple variants with different value types (string and number)
  - Empty arrays in variants (should error)
  - Missing variants property (should error)
  - Invalid variant structures with non-array values (should error)

### 2. Function Configuration Tests

> Tests for function execution configuration: function, args, result mapping

#### 2.1 run.function Tests

> Tests for the main function to be benchmarked

- [ ] **Test valid async functions**
  - Function that returns expected result structure
  - Function with different parameter signatures
  - Function that throws errors

- [ ] **Test function parameter validation**
  - Function with correct parameter count
  - Function with mismatched parameter count
  - Function with different parameter types

#### 2.2 run.args Tests

> Tests for argument generation function that maps context to function parameters

- [ ] **Test args function with context**
  - Valid context with features, target, variants
  - Args function returning correct array structure
  - Args function accessing context.features
  - Args function accessing context.variants
  - Args function with complex object parameters
  - Args function that doesn't match the expected shape of the function (should error)

- [ ] **Test args function edge cases**
  - Args function returning empty array
  - Args function throwing errors
  - Args function with invalid return types
  - Context with missing properties

#### 2.3 run.result Tests

> Tests for result transformation function that extracts metrics from function output

- [ ] **Test result mapping function**
  - Valid result transformation
  - Required prediction property extraction
  - Required tokens.in and tokens.out extraction
  - Additional custom properties

- [ ] **Test result function edge cases**
  - Missing prediction property
  - Missing tokens properties
  - Invalid token values (non-numbers)
  - Result function throwing errors
  - Null/undefined input to result function

### 3. Data Loading & Processing Tests

> Tests for data loading, parsing, and feature/target extraction

#### 3.1 CSV Data Processing

> Tests for CSV file parsing and data structure handling

- [ ] **Test CSV parsing with different structures**
  - Standard CSV with headers
  - CSV with quoted fields containing commas
  - CSV with special characters
  - CSV with empty cells
  - CSV with different encodings

- [ ] **Test feature extraction logic**
  - Multiple non-target columns → `Record<string, Array>`
  - Single non-target column → flattened array
  - Specified features column → array of strings or single string
  - No feature columns (only target column exists)

- [ ] **Test target extraction**
  - Valid target column extraction
  - Target column with different data types
  - Target column with null/empty values

- [ ] **Test trim functionality**
  - Trim with value less than dataset size
  - Trim with value equal to dataset size
  - Trim with value greater than dataset size
  - Trim with zero value

### 4. Integration Tests

> Tests for complete workflows and component interactions

#### 4.1 End-to-End Config Loading

> Tests for complete configuration loading and execution pipeline

- [ ] **Test complete config loading workflow**
  - Load config from file
  - Validate all properties
  - Process data according to config
  - Execute function with generated args
  - Transform results according to result function

#### 4.2 Real Function Execution Tests

> Tests using the actual modifiedOutput function from the config

- [ ] **Test with modifiedOutput function**
  - Valid execution with correct parameters
  - Function receives expected file and model parameters
  - Function returns expected result structure
  - Error handling when function fails

#### 4.3 Variant Combination Tests

> Tests for variant value combinations and cartesian product generation

- [ ] **Test variant combinations**
  - Single variant with multiple values
  - Multiple variants creating cartesian product
  - Complex variant structures
  - Variant values passed correctly to args function

### 5. Error Handling Tests

> Tests for error scenarios and exception handling

#### 5.1 Config Loading Errors

> Tests for configuration file and validation errors

- [ ] **Test config file errors**
  - Missing config file
  - Malformed config file
  - Config with syntax errors
  - Config with missing required properties

#### 5.2 Runtime Errors

> Tests for errors during data loading and function execution

- [ ] **Test data loading errors**
  - CSV file read errors
  - CSV parsing errors
  - Invalid data structures

- [ ] **Test function execution errors**
  - Function throws synchronous errors
  - Function throws asynchronous errors
  - Function returns invalid result structure
  - Timeout scenarios

### 6. Type Safety Tests

> Tests for TypeScript type compliance and runtime type validation

#### 6.1 TypeScript Type Validation

> Tests for compile-time type checking and interface compliance

- [ ] **Test config type compliance**
  - Config matches Config<F> interface
  - Function signature matches expected type
  - Args function return type matches function parameters
  - Result function parameter type matches function return type

#### 6.2 Runtime Type Validation

> Tests for runtime type checking and validation

- [ ] **Test runtime type checking**
  - Validate config properties at runtime
  - Validate function parameters match expected types
  - Validate result structure matches expected format

### 7. Performance Tests

> Tests for performance, scalability, and resource usage

#### 7.1 Large Dataset Tests

> Tests for handling large datasets and memory efficiency

- [ ] **Test with large CSV files**
  - Performance with 1000+ rows
  - Memory usage with large datasets
  - Trim functionality with large datasets

#### 7.2 Concurrency Tests

> Tests for parallel execution and resource management

- [ ] **Test concurrent execution**
  - Multiple function executions in parallel
  - Resource management with high concurrency
  - Error isolation between concurrent executions

### 8. Edge Cases & Boundary Tests

> Tests for unusual scenarios and boundary conditions

#### 8.1 Data Edge Cases

> Tests for minimal, empty, and unusual data formats

- [ ] **Test minimal datasets**
  - Single row CSV
  - Empty CSV file
  - CSV with only headers

- [ ] **Test unusual data formats**
  - Very long strings in CSV cells
  - Special characters and Unicode
  - JSON strings within CSV cells

#### 8.2 Configuration Edge Cases

> Tests for extreme configuration values and boundary conditions

- [ ] **Test extreme configuration values**
  - Maximum concurrency values
  - Very large retry counts
  - Very large interval values
  - Very large trim values

### 9. Mock and Stub Tests

> Tests using mocked dependencies for isolated testing

#### 9.1 Function Mocking

> Tests with mocked functions to verify behavior and error handling

- [ ] **Test with mocked functions**
  - Mock successful function execution
  - Mock function failures
  - Mock different return value structures
  - Verify function called with correct parameters

#### 9.2 Data Mocking

> Tests with mocked data sources and parsing

- [ ] **Test with mocked data sources**
  - Mock CSV file reading
  - Mock data parsing
  - Mock different data structures

### 10. Regression Tests

> Tests to ensure backward compatibility and prevent regressions

#### 10.1 Existing Functionality

> Tests for backward compatibility and API stability

- [ ] **Test backward compatibility**
  - Ensure existing configs continue to work
  - Test with previous data formats
  - Verify no breaking changes in API

## Test Implementation Notes

### Test Data Requirements

- Create sample CSV files with various structures
- Create mock functions with different signatures
- Prepare test configs with different property combinations

### Test Infrastructure

- Use Vitest for test framework
- Implement proper setup/teardown for file operations
- Create helper functions for common test scenarios
- Use proper mocking for external dependencies

### Coverage Goals

- Aim for 100% line coverage
- Ensure all error paths are tested
- Test all configuration combinations
- Validate all type scenarios

## Priority Levels

**High Priority:**

- Config structure validation
- Data loading and processing
- Function execution
- Error handling

**Medium Priority:**

- Type safety validation
- Integration tests
- Performance tests

**Low Priority:**

- Edge cases
- Regression tests
- Advanced error scenarios
