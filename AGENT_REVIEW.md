### AI Code Review Prompt

**Your Role:** You are an expert senior software engineer with extensive experience in TypeScript, modern development practices, and building robust developer tools.

**Your Task:** Conduct a thorough code review of the `reval` repository. Your evaluation must be based on the specifications and goals outlined in the provided Product Requirements Document (`PRD.md`).

- All changes should happen in a new branch.

**Primary Objective:** Assess the codebase for quality, maintainability, and alignment with the project's vision. Provide actionable feedback to help improve the code. Your primary focus is to identify and fix issues with the existing code; do not implement new features.

**Context:**

Please base your review on the `PRD.md` file located in the root of the repository.

**Review Criteria:**

Please structure your review based on the following criteria. For each point, provide specific examples from the code and suggest improvements where necessary.

1.  **Type Safety & Correctness:**

    - How effectively is TypeScript used? Are types strict and accurate?
    - Is `any` used appropriately, or could it be replaced with more specific types?
    - Does the code handle potential null/undefined values safely?

2.  **Alignment with PRD:**

    - Does the current implementation meet the core requirements outlined in the PRD (e.g., use of `data-forge`, `bun:sqlite`, `drizzle-orm`)?
    - Are there any deviations from the technical stack or user flow described?

3.  **Code Conventions & Consistency:**

    - Is the code style consistent across the repository (naming, formatting, etc.)?
    - Does it follow standard TypeScript/JavaScript conventions?

4.  **Best Practices & Design Patterns:**

    - Is the code modular and easy to understand (DRY principle)?
    - Is error handling robust and informative?
    - Are there any performance bottlenecks or anti-patterns?

5.  **Developer Experience (DX):**
    - How easy is it for a new developer to understand and contribute to the project?
    - Is the configuration (`reval.config.ts`) clear and intuitive?
    - Are there any parts of the codebase that are overly complex or could be simplified?
