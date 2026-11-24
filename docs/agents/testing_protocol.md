# AviFlow Testing Protocol

## Overview
This document outlines the required testing standards and conventions for the AviFlow framework. All components, including the core engine, actions, and utilities, must meet rigorous testing criteria to ensure stability, performance, and reliability.

## 1. Test Directory Structure

All unit tests must reside in a dedicated `aviflow/test/` directory. The structure should mirror the production source code to allow for easy component mapping.

```
aviflow/test/
├── unit/
│   ├── AviFlow.test.js
│   ├── AviFlowCoreEngine.test.js
│   ├── AviFlowActions.test.js
│   └── AviElement.test.js
├── integration/
│   ├── flow-lifecycle.test.js
│   └── data-flow-parsing.test.js
└── mocks/
    ├── api-mocks.js
    └── dom-mocks.js
```

## 2. File Naming Conventions

Adherence to the following conventions is mandatory to maintain clarity and prevent organizational friction:

1. **Component-Based Files:** Each primary source file (e.g., `AviFlow.js`, `AviFlowActions.js`, `AviElement.js`) must have a corresponding dedicated test file.
    - *Example:* `aviflow/src/AviFlow.js` -> `aviflow/test/unit/AviFlow.test.js`.
2. **Granularity:** Tests should be atomic. A single test file should cover the unit or component it targets. Avoid monolithic test suites.
3. **Test Case Naming:** Use descriptive names that clearly indicate the condition being tested.
    - *Format:* `test-should-[action]-[expected-result]`
    - *Example:* `test-should-resolve-dotted-path-correctly.test.js`

## 3. 100% Test Coverage Mandate

The project enforces a strict **100% unit test coverage** across all logic within the `aviflow/src/` directory.

*   **Scope:** This applies to all functions, methods, and branches of code.
*   **Mandatory Coverage:** Coverage must be maintained using Jest, and the coverage report must demonstrate 100% line and branch coverage for all production code.
*   **Tools:** Use `jest` and `jest-cli` configured to output detailed coverage reports.

## 4. Testing Workflow and Integration

### 4.1 Developing a New Feature (The Standard Process)

1. **Feature Implementation:** Implement the new logic in the relevant `aviflow/src/` file.
2. **Define Test Case:** Before committing code, write the corresponding test case in the `aviflow/test/unit/` directory. The test should fail initially, proving that the test is actually validating new functionality.
3. **Implementation with Test in Mind (TDD):** Write the minimum amount of production code necessary to make the new test pass.
4. **Refactoring:** Once the test passes, refactor the code to improve readability and maintainability while ensuring the test remains passing.
5. **Code Review:** Ensure the test file is as descriptive and clean as the production code.

### 4.2 Generating/Updating Tests for New Code

When adding new methods to existing classes (e.g., adding a new utility to `AviElement`):

1. **Identify the Class/Method:** Locate the class and the new method.
2. **Create/Update Test File:** Create a specific test file (e.g., `AviElement.test.js` in the `unit/` directory) or update the existing one.
3. **Write Scenarios:** Define tests for all edge cases, happy paths, failure modes (e.g., invalid inputs, empty data), and boundary conditions.
4. **Run Coverage Check:** Execute the coverage command: `npm run test:coverage` (or equivalent). The new code should contribute to achieving 100% coverage.

## 5. Test Execution

All tests are executed via standard scripts:

*   **Run all tests:** `npm run test`
*   **Run with coverage report:** `npm run test:coverage`

By following this protocol, we ensure that every piece of AviFlow logic is thoroughly vetted before it reaches the user.