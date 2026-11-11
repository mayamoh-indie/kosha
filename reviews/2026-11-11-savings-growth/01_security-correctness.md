# Security and correctness

Reviewed SHA: ac8d0074ebe4cd3ae6e07fc5c3d6b182c0b99fe5. Base: 433badbcfd7300233a450ed90482d224d244b467. Actual reviewer: GPT-6.1 Sol, implementing agent, sequential audit using upstream thermo-nuclear-review instructions.

## Findings

No blocking findings. Read the full new calculation, renderer, page, tests and guide, and traced the changed HTTP allowlist and shared navigation. The calculation accepts finite bounded string inputs, rejects fractional cents and fractional years, validates frequency keys using own-property checks and bounds the work to 60 times 52 periods. The allowed net rate keeps every compounding base positive. Invalid form submissions clear the prior projection.

Validated equations against an annual hand example: CAD 1,000 plus CAD 100 at year-end at 10% for two years yields CAD 1,420; beginning deposits yield CAD 1,441. A monthly ordinary annuity is checked against its closed form. Zero return reconciles every deposit frequency; all compounding choices reconcile against a one-year initial-only expression. Inflation increases begin in year two and round deposits to cents. Negative returns receive no tax credit. Zero years makes no deposits. Fee and tax assumptions are documented before compounding; results are hypothetical and not represented as Canadian tax estimates or provider-identical outputs.

The renderer uses textContent for user-visible values. SVG interpolation receives only calculated finite numbers from validated inputs. There are no saved-data writes, external requests, credentials, or changes to authorization. The local server adds three fixed allowlist entries; request paths still cannot construct filesystem paths. The exact authorized theme bootstrap is retained and tested. All inputs have wrapping labels; alerts and results have live regions; the annual table supplies numeric chart alternatives.

## Verification and limits

Ran node --test tests/*.mjs: 36 passed, including ten new calculator/renderer tests. Ran Python unittest discovery: 26 passed, including successful new asset routes and denied source paths. Ran node --check for every web script and git diff --check: passed. No medium/high finding requiring PR-discussion reconciliation was identified. Ruff was unavailable locally; CI lint and CodeQL remain merge gates. Local browser connection timed out, so layout and actual browser event behavior are not established by these tests.
