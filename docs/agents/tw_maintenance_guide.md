# Technical Writer (TW) Maintenance Guide

## Overview
The Technical Writer (TW) is responsible for maintaining the public-facing AviFlow documentation, primarily residing in the `aviflow/docs/` directory. The primary goal is to ensure that the documentation accurately reflects the current state of the source code, provides clear usage instructions, and maintains a consistent user experience.

## 1. Scope of Responsibility
The TW's responsibility covers all documentation located in the `aviflow/docs/` directory (including `index.html`, usage guides, API overviews, etc.). This includes maintaining the `docs/agents/` directory content to ensure it is accessible and up-to-date.

## 2. Core Maintenance Tasks
### A. Cross-Referencing Code Changes
- **Goal:** Update documentation whenever significant changes occur in the core logic.
- **Target Directory:** `aviflow/src/` (Monitor changes to `AviFlow.js`, `AviFlowCoreEngine.js`, etc.).
- **Action:** If a new action is added (e.g., a new built-in action like `delay`) or a flow grammar rule changes, the documentation must be updated to reflect this new capability.

### B. General Usage Alignment
- **Goal:** Ensure general usage guides align with the latest version.
- **Target Directory:** `aviflow/docs/` (Specifically `index.html` and other usage guides).
- **Action:** Review examples. If a code snippet uses a method that was deprecated or renamed, the documentation must be corrected.

### C. External Link Validation
- **Goal:** Guarantee that all external resources mentioned in the documentation are live and functional.
- **Action:** Regularly test all external links (e.g., GitHub links, CDN links, external API references) to ensure they resolve correctly.

## 3. Workflow

1. **Monitoring:** Keep a pulse on new pull requests or major version bumps in `aviflow/src/`.
2. **Review Trigger:** A code change is flagged as needing documentation review.
3. **Review Code:** Check the relevant file in `aviflow/src/` to understand what changed.
4. **Update Docs:** Modify the corresponding file(s) in `aviflow/docs/`.
5. **Verify:** Check the updated documentation against the live code to ensure total alignment.
6. **Commit & Review:** Submit the documentation updates for review.

## 4. Key Checkpoints Checklist

- [ ] Has the new source code feature been reflected in the usage examples?
- [ ] Are the component descriptions in `docs/agents/architecture.md` current?
- [ ] Are all internal and external links in `aviflow/docs/index.html` valid?
- [ ] Is the language used consistent with the AviFlow style?
