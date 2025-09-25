<div align="center">

# reval

**A comprehensive benchmark framework for LLM applications**

[![npm version](https://img.shields.io/npm/v/@reval/cli.svg)](https://www.npmjs.com/package/@reval/cli) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)

_Simplify the evaluation and scoring of functions across multiple variants and datasets with type-safe, declarative configuration._

</div>

## Features

**reval** automates your entire evaluation pipeline through a declarative configuration approach:

🚀 **Function Execution** - Define and run target functions with configurable concurrency and retry logic

📊 **Data Management** - Import JSON datasets and map data to function parameters seamlessly

🔄 **Variant Testing** - Execute functions across multiple variants for comprehensive testing

🧠 **Intelligent Scoring** - Automatic accuracy calculation with sophisticated algorithms:

- Text comparison with Levenshtein distance
- Numerical accuracy calculations
- JSON object deep comparison
- Custom scoring functions

💾 **Result Persistence** - Store evaluation runs in SQLite database with full type safety

⚡ **Performance** - Built-in concurrency control, retry mechanisms, and interval management

## Quick Start

Get up and running in seconds with a simple initialization command.

### Prerequisites

- Node.js 18 or higher

### Installation

Initialize reval in your project without global installation:

```bash
npx reval init
```

Or install globally for convenience:

```bash
npm install -g reval
reval init
```

### What gets created

The `init` command sets up everything you need:

| File/Directory    | Description                                     |
| ----------------- | ----------------------------------------------- |
| `reval.config.ts` | Your configuration with sensible defaults       |
| `sample.json`     | Sample test data to verify everything works     |
| `.reval/`         | Directory containing SQLite database and schema |

### Next Steps

After initialization:

1. **📝 Edit `reval.config.ts`** to customize your benchmark function and variants
2. **🔄 Update `sample.json`** with your actual test data
3. **▶️ Run `reval`** to execute your first evaluation
4. **🌐 Use `reval ui`** to view results in the web interface

> **💡 Tip:** Use `reval init --force` to reinitialize an existing project

## Commands

### Core Commands

| Command                                 | Description                                                                |
| --------------------------------------- | -------------------------------------------------------------------------- |
| **`reval init [--force]`**              | Initialize a new reval project with configuration files and database setup |
| **`reval [options]`**                   | Execute benchmark evaluations (default command)                            |
| **`reval list [--limit <n>] [--json]`** | List recent benchmark runs with summary information                        |
| **`reval show <eval_id> [--json]`**     | Show detailed results for a specific benchmark run                         |
| **`reval export <eval_id> [options]`**  | Export benchmark results to various formats                                |

<details>
<summary><strong>📋 Detailed Options</strong></summary>

#### `reval run [options]` - Execute evaluations

- `-c, --config <path>`: Path to reval config file
- `-d, --data <path>`: Path to CSV file or directory
- `-j, --concurrency <number>`: Parallelism for test runs
- `-r, --retries <number>`: Retries for flaky runs
- `--dry`: Validate config and inputs without executing
- `-v, --verbose`: Increase log verbosity

#### `reval list [options]` - List runs

- `-n, --limit <number>`: Number of evals to display (default: 20)
- `--json`: Output in JSON format

#### `reval show <eval_id> [options]` - Show run details

- `<eval_id>`: ID of the evaluation to display
- `--json`: Output full JSON payload

#### `reval export <eval_id> [options]` - Export results

- `<eval_id>`: ID of the evaluation to export
- `--format <json|csv|md>`: Export format (default: json)
- `-o, --out <path>`: Output file path

</details>

### Interface Commands

| Command        | Description                                                 |
| -------------- | ----------------------------------------------------------- |
| **`reval ui`** | Launch the web interface for visual analysis and management |

### Database Commands

| Command                         | Description                                                |
| ------------------------------- | ---------------------------------------------------------- |
| **`reval db create [--force]`** | Create a new SQLite database for storing results           |
| **`reval db migrate`**          | Run database migrations to update schema                   |
| **`reval db studio`**           | Open Drizzle Studio for database inspection and management |

## Architecture

reval consists of **3 packages** that work together to provide a complete benchmarking solution:

### `@reval/core`

> **The foundational package containing all core functionality**

- 🎯 **Evaluation Engine** - Orchestrates execution with concurrency and retry logic
- 📊 **Scoring System** - Intelligent accuracy calculation for text, numbers, JSON, and custom metrics
- 🗄️ **Database Layer** - SQLite integration with Prisma for result persistence and querying
- ⚙️ **Configuration Management** - Type-safe config loading and validation
- 🔄 **Data Processing** - Data mapping and transformation utilities

### `@reval/cli`

> **Command-line interface for project management and execution**

- 🚀 **Project Setup** - `init` command for new reval projects with configuration templates
- ▶️ **Benchmark Execution** - Run evaluations with progress tracking
- 📋 **Results Management** - `list`, `show`, `export` commands for viewing and exporting results
- 🗄️ **Database Tools** - `db create`, `db migrate`, `db studio` for database management
- 🌐 **Web Interface** - `ui` command to launch the web dashboard
- 🎨 Built with [Ink](https://github.com/vadimdemedes/ink) for rich terminal UI and interactive commands

### `@reval/ui`

> **Next.js web application for visual analysis and management**

- 🔍 **Detailed Analysis** - Individual run inspection with comprehensive metrics
- 📈 **Interactive Charts** - Visual representation of performance metrics and trends
- ⚡ **Real-time Updates** - Live progress tracking during evaluations
- 🎨 Built with [shadcn/ui](https://ui.shadcn.com/), [Radix UI](https://www.radix-ui.com/), and [TanStack Table](https://tanstack.com/table) for modern UX
