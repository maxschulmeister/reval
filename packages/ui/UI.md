### Optimized Prompt for UI Frontend Development

**Objective:** Restructure the UI frontend to a single-page application, modeled after the structure at [https://llm-benchmark-five.vercel.app/](https://llm-benchmark-five.vercel.app/). Implement all specified components with full functionality, but keep styling minimal and unstyled (e.g., use basic HTML elements or simple CSS only where necessary for functionality). Focus on logic, data handling, and interactivity.

**Assumptions and Setup:**

- Assume data is fetched from an API or local source (e.g., runs, variants, results). Implement placeholders or mock data if needed.
- Use React with Next.js (based on project structure).
- Ensure the page is responsive by default.
- Implement all features in a single page (e.g., `/app/page.tsx`).

**Step 1: Header Section**

- **Top Left:** Dropdown select for choosing the run to display.
  - Options: Use run `name` as display text, `id` as value.
  - On selection, update the page content to show data for the selected run.
- **Top Right:**
  - Secondary button: Link to GitHub ([www.github.com](www.github.com)).
  - Primary button: Link to documentation ([www.google.com](www.google.com)).

**Step 2: Filter Section**

- **By Variant:** For each key in the `variants` object (assume variants is an object with dynamic keys), create a select dropdown.
  - Populate options based on possible values for that variant key.
  - Allow multi-select if applicable; apply filters to table data.
- **By Status:** Select dropdown with options: 'success', 'failed', 'retried'.
  - Filter table rows based on selected status(es).

**Step 3: Summary Rows (Above Table)**

- **First Summary Row:** Display aggregated metrics for the selected run.
  - Columns:
    - Function name (clickable collapsible to show the function code as a string in a code syntax highlighter, e.g., using Prism.js or react-syntax-highlighter).
    - Timestamp of the run.
    - Number of Executions.
    - Success rate (percentage).
    - Average execution time.
- **Second Summary Row:** Empty row with a placeholder comment: `<!-- Placeholder for future charts insertion -->`.

**Step 4: Main Table**

- Display detailed results in a sortable table.
- **Columns:**
  - Separate columns for each feature (assume `features` is an array or object; dynamically generate columns).
  - Separate columns for each key in `variants`.
  - Target: Collapsible cell showing content with code syntax highlighting.
  - Prediction: Collapsible cell showing content with code syntax highlighting.
  - Time.
  - Retries.
  - Status.
- **Sorting:** Make each column header clickable to sort the table.
  - Display an arrow indicator (↑ for ascending, ↓ for descending) on the active sort column.
  - Implement client-side sorting logic.

**Step 5: Grouping Function**

- Implement a utility function to group results into 3 categories: 'good', 'ok', 'bad'.
  - Must work with any numeric values (e.g., scores, times).
  - Use an existing module like [simple-statistics](https://github.com/simple-statistics/simple-statistics) for calculations (e.g., quartiles or standard deviation to determine thresholds).
  - Example logic: Use quantiles to divide into thirds (bottom third 'bad', middle 'ok', top 'good').
  - Install via npm if not present: `npm install simple-statistics`.
  - Export and use this function where needed (e.g., for summaries or filters).

**Guidelines:**

- **No Styling Focus:** Use minimal, unstyled elements (e.g., native HTML tables, selects). Avoid Tailwind or custom CSS unless required for functionality (e.g., collapsible).
- **Full Functionality:** Ensure all interactions (selects, collapsibles, sorting) work without errors.
- **Edge Cases:** Handle empty data, loading states, and invalid selections.
- **Testing:** Suggest unit tests for grouping function and integration tests for UI components.

Implement step-by-step, verifying each section before proceeding.
