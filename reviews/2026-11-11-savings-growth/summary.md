# Savings and investment growth review

Reviewed SHA: ac8d0074ebe4cd3ae6e07fc5c3d6b182c0b99fe5. Base: 433badbcfd7300233a450ed90482d224d244b467.

Reviewer: GPT-6.1 Sol, the implementing agent, performing sequential scope, security/correctness and maintainability passes. These are not independent reviews. Upstream Ponytail full and both pstack instructions at the revisions pinned in AGENTS.md were consulted.

Verdict: no blocking findings in the reviewed diff. One general savings calculator combines the requested feature sets alongside the existing RRSP calculator. It uses its own explicit equal-period model; it does not claim exact provider parity. Fees and tax drag are simplified assumptions, not tax-return calculations.

Traced form inputs through validation, periodic growth, annual rows, result rendering, navigation, local HTTP allowlisting, static build packaging and user documentation. The new tool has no account-storage or network calls. Existing RRSP formulas and account formats remain unchanged.

Verification: 36 JavaScript tests and 26 Python tests passed. All web JavaScript syntax checks and git diff --check passed. Focused checks cover beginning/end deposits, closed-form monthly growth, all supported frequencies, inflation increases, tax/fee drag, losses, zero-year scenarios, invalid inputs and stale-result clearing. Ruff is unavailable locally; CI lint, CodeQL and build must succeed on the final PR head before merge. Browser preview on localhost timed out; DOM-fake renderer tests and successful HTTP responses do not establish visual browser verification.

Details: [security and correctness](01_security-correctness.md), [maintainability](02_maintainability.md), [scope and integration](03_scope.md).

Next improvement: a target-balance mode using the same model to calculate the required periodic deposit, in a separate change.
