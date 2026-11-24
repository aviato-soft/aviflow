# Software Quality Engineer (SQE) Maintenance Guide

## Overview
The role of the Software Quality Engineer (SQE) in maintaining AviFlow is critical for ensuring code quality, consistency, and long-term maintainability. This guide outlines the process for auditing and refining JSDoc comments and enforcing stylistic standards across the codebase.

## 1. Scope of Responsibility
The SQE's primary responsibility is to audit and maintain the code quality within the following directory:
- `aviflow/src/` (All `.js` files: `AviFlow.js`, `AviFlowCoreEngine.js`, `AviFlowActions.js`, `AviElement.js`, etc.).

## 2. Core Maintenance Tasks
### A. JSDoc Compliance Audit
- **Goal:** Ensure every public method, class, property, and complex function has a JSDoc block.
- **Checkpoints:** Verify that descriptions are professional, technical, and follow the established AviFlow style.
- **Action:** Identify and correct any missing, incomplete, or vague documentation.

### B. Style and Formatting Enforcement
- **Goal:** Enforce strict stylistic consistency across all source code.
- **Checkpoints:**
    - **80-Character Limit:** Verify that all lines (including JSDoc descriptions and code) do not exceed 80 characters.
    - **Backtick Usage:** Ensure all code snippets, property names, and methods within JSDoc are wrapped in backticks (e.g., `` `methodName` ``).
    - **Consistency:** Maintain consistent formatting (e.g., indentation, spacing) throughout the source files.

### C. Handling New Features
- **Process:** Whenever new logic, classes, or utility methods are introduced (e.g., new actions or API endpoints), the SQE must ensure the associated code is fully documented *before* it is merged into the main codebase.

## 3. Workflow

1. **Identification:** Use static analysis or code reviews to identify areas needing JSDoc updates or style fixes.
2. **Local Refinement:** Clone the relevant source file (`aviflow/src/*.js`).
3. **Correction:** Apply the necessary documentation and style fixes, adhering strictly to the 80-character limit and backtick rules.
4. **Verification:** Review the changes against the established standard.
5. **Commit & Review:** Submit the changes for peer review.

## 4. Key Checkpoints Checklist

- [ ] All methods and classes have a JSDoc block.
- [ ] JSDoc descriptions use professional, technical language.
- [ ] All properties and code snippets are wrapped in backticks (e.g., `` `methodName` ``).
- [ ] No line of code or documentation exceeds 80 characters.
- [ ] Formatting (indentation, spacing) is consistent across the entire file.