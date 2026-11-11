# Review summary: sidebar order fix

- Reviewed SHA: `a614e80dc427bd42e275dbbba02a53c33b324c47` (branch `fix/sidebar-order`, base `main` at `76510b7`)
- Scope: `git diff main...a614e80`: `web/debts.html`, `web/planner.html`, `test_dashboard.py` (18 additions, 3 deletions)
- Model actually used: Claude Opus 5.5 (`claude-opus-5-5`) in Claude Code. AGENTS.md says model reviews run in Codex for now; this review ran in Claude Code because the user asked for this PR in a Claude Code session.
- Upstream instructions read: Ponytail `96608e0` (`skills/ponytail`, `skills/ponytail-review`); pstack `bc09365` (`thermo-nuclear-review`, `thermo-nuclear-code-quality-review`). The pinned pstack files are identical to upstream HEAD on 2026-11-11.

## Verdict

Ship. No security or correctness findings. One structural follow-up is noted but stays out of this PR.

## Findings

**No blocking findings.** The two HTML edits only reorder three existing sidebar links so Home comes first, matching the other nine pages and every mobile menu. No link, label, active state or script changed. The planner page still marks Debts as active. Details: [01_thermo-nuclear-review.md](01_thermo-nuclear-review.md).

**Follow-up, not blocking: the menu is copied into every page.** All 11 pages in `web/` carry their own copy of the sidebar and mobile menu, which is how this drift happened when two pages were added. A shared source for the menu would remove the duplication, but it would touch every page and change how pages load, which is too much for this fix. The new test turns the rule into a check instead: any page whose menu order drifts now fails CI. Details: [02_thermo-nuclear-code-quality-review.md](02_thermo-nuclear-code-quality-review.md).

**Ponytail: smallest complete change.** Two one-line reorders plus one focused test that fails without the fix. Details: [03_ponytail-review.md](03_ponytail-review.md).

## Verification

- Local, on the reviewed SHA: Python `unittest` 23 tests OK; `node --test test_expenses.mjs test_finance.mjs` 9 passed; Ruff clean; `node --check` clean on all `web/*.js`.
- The new test was run with the two HTML fixes reverted and failed with a list mismatch, so it detects this regression.
- CodeQL runs in the pipeline only; it was not available locally.
- Not checked: the sidebar was not viewed in a browser for this PR. The order is plain markup that the test covers.
