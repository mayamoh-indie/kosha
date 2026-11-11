# Review summary: spending what-if on Strategy

- Reviewed SHA: `2565dea709322526a460f321d997992ed8a96edf` (branch `feat/spending-what-if`, base `main` at `7d4e456`)
- Scope: `git diff main...2565dea`: `web/whatif-data.js` (new), `web/strategy.js`, `web/strategy.html`, `web/style.css`, `test_whatif.mjs` (new), `test_dashboard.py`, `dashboard.py`, `.github/workflows/pipeline.yml`, `README.md` (156 additions, 6 deletions)
- Model actually used: Claude Fable 5.2 (`claude-fable-5-2`) in Claude Code, for both implementation and review. AGENTS.md says model reviews run in Codex for now; this ran in Claude Code because the user asked for this change in a Claude Code session.
- Upstream instructions read: Ponytail `96608e0` (`skills/ponytail`, `skills/ponytail-review`); pstack `bc09365` (`thermo-nuclear-review`, `thermo-nuclear-code-quality-review`).

## Verdict

Ship. One correctness finding was fixed before the reviewed commit. Two maintainability notes are recorded and left as they are.

## Findings

**Fixed before commit: wrong message for a plan that was already stuck.** When the current plan could not pay off and the change did not rescue it, the panel said the change "would stop your plan from paying off", which blames the change for a problem that already existed. `whatIfOutcome` now reports whether the change broke a working plan, the page words the two cases differently, and a test covers both. Details: [01_thermo-nuclear-review.md](01_thermo-nuclear-review.md).

**Left as is: `runWhatIf` both calculates and renders.** The function in `web/strategy.js` asks the engine for the changed plan and builds the result rows in one place. That matches how `update` and `render` are written in the same file, and the decisions that matter (the new budget and the outcome) already live in `web/whatif-data.js` under test. Splitting it further would add a function with one caller. Details: [02_thermo-nuclear-code-quality-review.md](02_thermo-nuclear-code-quality-review.md).

**Left as is: the category choice does not change the maths.** The category only selects which spending guide is shown. Tying the amount to a category budget would mean writing to Money overview's data, which the user asked to leave out.

**Ponytail: smallest complete change.** The engine and `api.py` are untouched; the preview reuses `calculatePlan`, and applying reuses the existing budget autosave. Details: [03_ponytail-review.md](03_ponytail-review.md).

## Verification

- Local, on the reviewed SHA: Python `unittest` 23 tests OK; `node --test test_expenses.mjs test_finance.mjs test_whatif.mjs` 14 passed; Ruff clean; `node --check` clean on all `web/*.js`; workflow YAML parses.
- Browser, local server, sample plan (budget $650, debt-free Sep 2028):
  - $150 less: "4 mo sooner · $301.25 less interest", May 2028.
  - $100 more: "5 mo later · $326.40 more interest", Feb 2029.
  - $600 more: plan stops paying off, with the engine's reason, and no apply button.
  - More than the whole budget, and `-5`: rejected with a message.
  - Budget $100 (already stuck): $10 less says the plan still would not pay off; $600 less says debt-free in Jul 2028.
  - The preview left `kosha-plan` unsaved. "Use this as my debt budget" set the budget to $800.00, saved it, and the summary changed to 1 yr 6 mo.
  - Phone width (375px): no sideways scrolling. No console errors.
- Not checked before merge: the static GitHub Pages mode, where the engine runs in the browser through Pyodide. The panel uses the same `calculatePlan` call as the rest of the page, so it should behave the same; check the live page after deploy.
- CodeQL runs in the pipeline only.
