# Scope and integration

Reviewed SHA: ac8d0074ebe4cd3ae6e07fc5c3d6b182c0b99fe5. Base: 433badbcfd7300233a450ed90482d224d244b467. Reviewer: GPT-6.1 Sol, implementing agent, Ponytail full scope pass.

Expected inputs are a starting balance, periodic deposit, whole-year horizon, return, deposit/compounding frequencies, timing, fees, tax drag, inflation and an optional yearly deposit increase. Outputs are nominal and real balances, contributions, growth, chart and annual table. The optional question about one combined versus two separate calculators received no response; the stated assumption was one combined tool beside RRSP growth.

Read the official Fidelity and Dynamic calculator pages as feature references. Implemented their overlapping scenario controls with Kosha's own documented arithmetic. Fidelity-style tax and inflation inputs and Dynamic-style compounding/timing choices are covered. Exact institution results, tax rules, investment advice and new account-storage workflows are outside scope.

Navigation adds Savings growth consistently across all existing HTML pages without changing their other destinations. The new page uses existing CSS, menu and theme helpers. app/dashboard.py serves its three assets through the exact allowlist. The static build copies web/ recursively, so no pipeline edit is needed. Existing theme and navigation consistency tests cover the new page; HTTP tests cover its assets.

README describes the feature and links a user guide with a reproducible CAD 1,420 example. The guide defines equal-period conversion, contribution timing, tax/fee order, rounding, inflation and no room validation. No secrets, dependencies, API calls, saved-data migrations, unrelated cleanup or deployment configuration were added.

Verification performed: 36 JavaScript tests, 26 Python tests, all web JavaScript syntax checks and git diff --check passed. CI lint, CodeQL and build must still pass on the current PR head. Browser preview failed to connect to localhost; no successful visual check is claimed here.
