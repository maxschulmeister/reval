# Product Requirements Document: reval

## 1. Introduction

**reval** is a benchmark framework designed to simplify the evaluation of applications that leverage Large Language Models (LLMs). As LLM-powered features become more prevalent, developers need a standardized, easy-to-use tool to measure, compare, and track the performance of their LLM integrations.

## 2. Vision

To become the industry-standard tool for benchmarking LLM-based applications, empowering developers to build more reliable and efficient AI products through accessible and comprehensive evaluation.

## 3. Development Phases

### Core Functionality

- Support for TypeScript/JavaScript functions only.
- Benchmark text-to-text functions.
- Handle CSV data using `data-forge`.
- Calculate essential metrics like speed and accuracy.
- Store benchmark runs and results in a local SQLite database.

## 4. Target Audience & User Personas

- **Primary:** Software Developers & AI/ML Engineers working on applications with LLM-integrated features.
- **Secondary:** QA Engineers who need to validate AI feature outputs.

### User Persona: Sarah, ML Engineer

- **Background:** Sarah works at a fintech company building an LLM-powered SQL query generator.
- **Goals:**
  - Benchmark the accuracy of SQL query generation against a test dataset.
  - Track performance metrics like generation speed and success rate.
  - Compare different model versions using standardized test cases.
  - Share benchmark results with the engineering team.
- **Frustrations:**
  - Manual testing is time-consuming and error-prone.
  - Difficult to maintain consistent test data across model versions.
  - No standardized way to measure improvements.

### User Persona: Mike, Computer Vision Engineer

- **Background:** Mike is developing an OCR system enhanced by LLMs for document processing.
- **Goals:**
  - Evaluate OCR accuracy across different document types.
  - Measure processing speed for various input formats.
  - Compare results against ground truth data.
- **Frustrations:**
  - Complex setup required for each benchmark run.
  - Inconsistent evaluation methods across team members.

## 5. Test Data Structure

### CSV Format

The test data must be provided in CSV format. It is processed using `data-forge`.

```csv
input,expected_output
"SELECT all users","SELECT * FROM users;"
"path/to/image.png","Invoice #1234 - Total: $500.00"
```

- **Input Column:**

  - Can contain direct text input OR
  - File paths (e.g., for images or documents)
  - UTF-8 encoded
  - No size limit, but recommended < 1MB per cell

- **Expected Output Column:**
  - Must contain text only
  - UTF-8 encoded
  - Used for accuracy comparison
  - Recommended < 1MB per cell

## 6. User Flow

1.  **Setup:**

    - No installation is needed. The project is run directly using `bun`.

2.  **Configuration:**

    - Edit `reval.config.ts` to define the benchmark parameters, data source, and function to test.

3.  **Execution:**

    ```bash
    bun reval
    ```

    Results are saved to a local SQLite database.

## 7. Features & Requirements

### Core Requirements

- Execute TypeScript/JavaScript functions.
- Read CSV test data via `data-forge`.
- Calculate speed and accuracy metrics.
- Store results in a SQLite database using `bun:sqlite` and `drizzle-orm`.

## 8. Technical Stack

- **Language:** TypeScript
- **Runtime:** Bun
- **Data Handling:** data-forge
- **Database:** bun:sqlite, Drizzle ORM

## 9. Success Metrics

- **Reliability:** < 1% error rate in benchmark runs
- **Performance:** < 100ms overhead per test case
