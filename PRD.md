# Product Requirements Document: reval

## 1. Introduction

**reval** is a benchmark framework designed to simplify the evaluation of applications that leverage Large Language Models (LLMs). As LLM-powered features become more prevalent, developers need a standardized, easy-to-use tool to measure, compare, and track the performance of their LLM integrations. `reval` provides a CLI, a configurable evaluation engine, and a local dashboard to visualize results.

## 2. Vision

To become the industry-standard tool for benchmarking LLM-based applications, empowering developers to build more reliable and efficient AI products through accessible and comprehensive evaluation.

## 3. Development Phases

### Phase 1: TypeScript/JavaScript Foundation

- Support for TypeScript/JavaScript functions only
- **Benchmark Types:**
  - Text-to-text
  - Image-to-text
- Basic CSV input/output format
- Essential metrics (speed, accuracy)
- Simple dashboard with table view
- File-based test data handling

### Phase 2: Enhanced Features

- Support for Python integration
- Advanced metrics (cost, retries)
- Graph visualization
- Run comparison in dashboard

### Phase 3: Extended Language Support

- Support for Go, Rust, and other languages
- Custom metric definitions
- CI/CD integration
- Cloud storage and team features

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

The test data must be provided in CSV format with two columns:

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

1.  **Installation:**

    ```bash
    npm install -g reval
    ```

2.  **Initialization:**

    ```bash
    reval init
    ```

    Creates `reval.config.js` and `reval-tests/` directory.

3.  **Configuration:** Edit `reval.config.js`:

    ```javascript
    module.exports = {
      function: './src/sqlGenerator.ts', // Path to function as default export
      // or
      function: {
        path: './src/sqlGenerator.ts',
        name: 'generateSQL'
      } // Object for function as named export
      data: './data/sql-test-cases.csv',
      output: {
        dir: './reval-results',
        format: 'json'
      }
    }
    ```

4.  **Execution:**

    ```bash
    reval run
    ```

    Results are saved as `reval-results/generateSQL_2024-01-20T14-30-00.json`

5.  **Analysis:**
    ```bash
    reval ui
    ```

## 7. Features & Requirements

### Phase 1 Requirements

#### Core Engine (`@reval/core`)

- Execute TypeScript/JavaScript functions
- Read CSV test data
- Calculate speed and accuracy metrics
- Generate uniquely named results (timestamp + function name)

#### CLI (`@reval/cli`)

- Initialize new projects
- Run benchmarks
- Launch dashboard

#### UI (`@reval/ui`)

- List benchmark runs
- Display results in sortable table
- Basic filtering capabilities

### Future Phase Requirements

(As outlined in Phase 2 and 3 sections)

## 8. Technical Stack

- **Language:** TypeScript
- **Framework (UI):** Next.js
- **UI Components:** shadcn/ui
- **Styling:** Tailwind CSS
- **CLI Framework:** commander.js

## 9. Success Metrics

- **Adoption:** Weekly npm downloads
- **Reliability:** < 1% error rate in benchmark runs
- **Performance:** < 100ms overhead per test case
- **User Satisfaction:** GitHub stars and user feedback
