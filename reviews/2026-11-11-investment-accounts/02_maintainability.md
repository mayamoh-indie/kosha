# Maintainability

Implementation SHA: 47de523932f533714c3d3ca4c0a5a28d82468d6e. Base: aae9c5ef96b10e6329b59c15c11f33d8856df876. Actual model: GPT-6.1 Sol, implementing agent, sequential thermo-nuclear-code-quality-review pass.

No blocking structural regressions remain. Account types, grouping, whole-cent amounts, flow totals, parsing and referential integrity remain in the existing pure finance-data module. The renderer extends the existing entry-kind loop and edit flow instead of introducing another page, storage key, CRUD controller or parallel account model. Neither module approaches 1,000 lines. No dependency or generic policy engine is needed.

The main simplification is routing both entry submission and deletion through commit. This removes the pass-through persist helper, pre-write state mutation and rollback path. The link invariant is checked in one canonical validator used at load and commit. Parsing moved from the DOM file to the data module so legacy compatibility and invalid saved records can be tested without page bootstrapping.

The registration classifier is shared by grouping, available activity-account choices, conditional fields and link validation. Group summaries operate on existing account records, avoiding duplicated balances and synchronization. Flow totals are a pure projection of the log; no stored aggregate needs reconciliation after edits. Form controls are disabled by the existing hidden-field mechanism. New fields reuse the same cents, date, label and edit patterns.

Considered a separate investment storage subsystem and automatic balance updates. Both would add transfer/reconciliation assumptions and duplicate the account source of truth. Keeping manual statements and logged activity distinct is smaller and consistent with existing debt/expense tracking. Future investment performance and tax-room logic should be a separate feature with explicit definitions, rather than inferred from these reference totals.

Verification: 44 JavaScript and 26 Python tests passed; syntax and whitespace checks passed. Tests assert outcomes and data preservation, with one small fake-DOM harness for the existing Home page. Real visual behavior remains unverified locally; CI lint, CodeQL and build must pass before merging.
