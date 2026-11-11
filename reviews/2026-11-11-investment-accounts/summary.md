# Investment accounts and activity review

Reviewed implementation SHA: 47de523932f533714c3d3ca4c0a5a28d82468d6e. Base: aae9c5ef96b10e6329b59c15c11f33d8856df876.

Actual reviewer: GPT-6.1 Sol, the implementing agent, performing sequential scope, security/correctness and maintainability passes. These are not independent reviews. Consulted the actual Ponytail full and both pstack instructions at the revisions pinned in AGENTS.md.

Verdict: no remaining blocking findings. Home groups registered and non-registered investments, accepts optional manual contribution totals and records dated contributions and withdrawals linked to investment accounts. The user explicitly requested both snapshot totals and a dated activity log.

Review resolved two design issues before the reviewed commit. Changing an investment to a cash/other asset cannot silently drop a contribution total: it must be cleared explicitly. Accounts with activity cannot be deleted or changed to non-investments until their activity is removed or reassigned. All entry writes now use the existing commit helper, validating links and writing storage before replacing page state; this removes the old parallel save path and rollback logic.

Verification: 44 JavaScript tests and 26 Python tests passed. All web JavaScript syntax checks and git diff --check passed. Eight new tests cover grouping, no asset duplication, unknown versus zero contributions, legacy records, malformed money, linked activity, edits, month filtering, explicit field clearing and failed saves. Local tests use synthetic records and a fake DOM; visual browser verification has not run for this SHA. Ruff is unavailable locally. CI tests, lint, CodeQL and build must pass on the current PR head before merge.

Assumptions: balances remain manual snapshots. Logs and manual contribution totals are separate and never added together. Logged contributions minus withdrawals is cash flow, not investment performance or contribution room. Older Investments entries appear under non-registered with a reminder to confirm their type; their stored type is preserved. Only absence of the new activity collection is upgraded to an empty collection; malformed collections block writes.

Details: [security/correctness](01_security-correctness.md), [maintainability](02_maintainability.md), [scope](03_scope.md). Next improvement: an explicit action to seed a growth scenario from a selected account, without altering tracking records.
