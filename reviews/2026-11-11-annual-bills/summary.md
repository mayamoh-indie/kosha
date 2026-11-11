# Annual bill planner review

Original reviewed SHA: 9e5ec85c57299d026d764b2ae9bae3d22bc0e2b7.
Revalidated implementation SHA after merging current main: 0ea8fdec03a9deb95965187d198b013ee0cb45e1.
Reviewer: GPT-6.1 Sol; three sequential passes by the same agent, not independent reviewers.
Scope: six application/documentation/test files; 77 additions and 15 deletions against origin/main.

Verdict: no blocking findings in the current diff. The original review fixes remain present after merging main; the merge preserved the deferred theme head and the bill form. No further implementation change was required.

The feature marks an existing savings goal as a bill, estimates a monthly reserve in whole cents, shows a 30-day warning and allows a confirmed yearly reset. Earmarks never add assets or log expenses.

Four fixes in 9e5ec85 were verified: bill-specific accessible payment names, one selection of bill/goal wording, base row wrapping instead of a repeated rule, and direct integer-day date subtraction.

On the merged implementation: python -m unittest -q passed 25 tests; node --test test_expenses.mjs test_finance.mjs test_whatif.mjs test_api.mjs test_theme.mjs passed 24 tests; all web JavaScript syntax checks and git diff --check passed. Ruff is unavailable locally; Ruff, CodeQL and Build remain required remote checks.

Browser recheck used a synthetic bill at localhost:8765: CAD 1,200 due 2027-05-11 with CAD 300 earmarked displayed CAD 150/month for six months. The button was named Mark paid: QA Car insurance. The confirmation stated the next date and no expense logging. The resulting yearly reset to 2028-05-11 and zero earmark persisted after reload. Browser automation temporarily stalled at the native confirmation; cancellation was not verified. A screenshot was saved outside the repository.

Known limits remain explicit: every payment advances one year, so old overdue bills may remain overdue; other recurrence frequencies require manual date edits. Form save and the replacement-data helper retain their differing error wording. No bank, email, background notification or external payment integration was tested or added.

Details: [security/correctness](01_security-correctness.md), [maintainability](02_maintainability.md), [scope and browser verification](03_ponytail-browser.md). Before merge, verify the final head's CI and confirm its application tree still matches this reviewed SHA.
