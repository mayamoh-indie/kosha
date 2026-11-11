# Scope and browser verification

Original reviewed SHA: 9e5ec85c57299d026d764b2ae9bae3d22bc0e2b7.
Revalidated implementation SHA after merging current main: 0ea8fdec03a9deb95965187d198b013ee0cb45e1.
Reviewer: GPT-6.1 Sol; three sequential passes by the same agent, not independent reviewers.
Scope: six application/documentation/test files; 77 additions and 15 deletions against origin/main.

Read the full local upstream Ponytail instructions referenced by AGENTS.md. No newer upstream revision was fetched.

Expected input is the existing goal form plus a bill checkbox, a positive target amount, valid target date and nonnegative earmarked amount. Outputs are remaining funds, a calendar-month reserve, progress, due status and an explicitly confirmed annual reset. The small implementation uses existing validation and browser storage with no added dependency, network API or new financial integration.

Inspected the six touched files and the related expense/date/storage helpers, finance totals, script ordering and existing workflow. The original scope was reviewed at 9e5ec85 and revalidated on the merge SHA above against main.

Browser test: on a blank local-only profile, created QA Car insurance for CAD 1,200 with CAD 300 earmarked and due 2027-05-11. Observed CAD 150/month for six months, the named progress bar and named Mark paid button. The native confirmation displayed 2028-05-11, CAD 0 earmark and no logged expense. Browser automation stalled while it was open; after recovery the page displayed those resulting values. Reload preserved the new date and zero earmark. Account and income totals stayed zero. Cancellation was not verified, and the browser's dialog acceptance mechanism was not observed.

A screenshot after reload was saved at D:/Lab/Portfolio/Kosh Wellness/bill-planner-check.png outside the deployable repository. The rendered row wraps its Edit, Delete and Mark paid buttons without overlap at the observed desktop viewport. Phone layout was not separately rendered.

On the merged implementation: python -m unittest -q passed 25 tests; node --test test_expenses.mjs test_finance.mjs test_whatif.mjs test_api.mjs test_theme.mjs passed 24 tests; all web JavaScript syntax checks and git diff --check passed. Ruff is unavailable locally; Ruff, CodeQL and Build remain required remote checks.

Known limits: yearly-only reset can leave multi-year-overdue bills overdue; a due date in the current calendar month shows the entire shortfall; the reserve rounds up to a cent and is planning guidance rather than recorded account activity. Existing save error wording is intentionally preserved.
