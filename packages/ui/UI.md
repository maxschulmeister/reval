# UI Generation Prompt for Reval Dashboard

## 1. Overview

This document contains a prompt for an AI agent to generate a web-based UI for the `reval` benchmarking framework. The UI will display benchmark data from a local SQLite database.

## 2. Core Requirements

- **Frameworks**: Next.js (App Router), Tailwind CSS, and shadcn/ui.
- **Database**: Read data from the existing SQLite database (`.reval/reval.db`). Use `drizzle-orm`.
- **Real-time Updates**: The UI must hot-reload when the database content changes. Implement this using a file watcher (like `chokidar`) on the server to monitor `db.sqlite` and push updates to the client via WebSockets or Server-Sent Events (SSE).
- **Styling**: The UI must be clean, minimal, and neutral. Use a monochrome color palette for the majority of the interface. Use colors sparingly for charts and important UI elements (like status badges). Refer to `https://kinde.com/`, `https://ui.shadcn.com/`, and `https://www.v7labs.com/` for style inspiration.
- **Launch Command**: The UI should be launchable via `bun run ui`.

## 3. AI Agent Prompt

"You are an expert Next.js developer. Your task is to build a web dashboard for the `reval` benchmarking tool. Follow these instructions precisely.

### **Project Setup**

1.  **Next.js**: A Next.js app is already setup in `packages/ui`.

### **Backend (Data Fetching & Hot Reload)**

1.  **Database Connection**: In `core/db`, set up Drizzle ORM to connect to the SQLite database located at `../.reval/reval.db`.
2.  **API Routes**: Create Next.js API routes or use Server Actions to fetch data from the `runs` and `executions` tables.

### **Frontend (UI Components)**

Implement the following pages and components using `shadcn/ui` components wherever possible.

**Page 1: Runs Dashboard (Default Route: `/`)**

- **Layout**: A simple, clean layout.
- **Component: `RunsTable`**
  - Use the `Table` component from `shadcn/ui`.
  - Display a list of all benchmark `runs`.
  - **Columns**: Run Name, Function, Variants, Timestamp.
  - Each row should be clickable and navigate to the detailed run view (`/run/[runId]`)

**Page 2: Detailed Run View (`/run/[runId]`)**

- **Layout**: A two-column layout might work well, with summary stats on one side and detailed executions on the other.
- **Component: `RunSummary`**
  - Display the selected run's details (Name, Function, Notes, etc.) using `Card` components.
  - Show aggregate metrics: Total Executions, Success Rate (%), Average Execution Time.
- **Component: `ExecutionsCharts`**
  - Use `recharts` to create charts.
  - **Chart 1: Status Distribution**: A `PieChart` showing the distribution of `status` (`success` vs. `error`).
  - **Chart 2: Execution Time per Variant**: A `BarChart` comparing the average `execution_time` for each `variant`.
- **Component: `ExecutionsTable`**
  - Use a `Table` to list all `executions` for the selected run.
  - **Columns**: Variant, Status (use a `Badge` with color: green for success, red for error), Execution Time, Retries, Result (show the `prediction` from the result JSON).

### **Styling**

- Adhere to the minimal, monochrome design. Use shades of gray, black, and white.
- Use a single accent color for interactive elements (links, buttons) and for the charts to make them stand out.
- Ensure ample white space and clean typography.

### **Final Steps**

1.  Add a `ui` script to the root `package.json`: `"ui": "cd ui && bun dev"`.

By following these instructions, you will create a fully functional and aesthetically pleasing dashboard for the `reval` framework."
