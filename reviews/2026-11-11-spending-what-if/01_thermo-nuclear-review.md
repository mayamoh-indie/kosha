# thermo-nuclear-review (security and correctness)

- Reviewed SHA: `2565dea709322526a460f321d997992ed8a96edf`, scope `main...2565dea`
- Model: Claude Fable 5.2 (`claude-fable-5-2`), Claude Code
- Instructions: pstack `bc09365`, `plugins/pstack/skills/thermo-nuclear-review/SKILL.md`

## Result

No open findings. One medium finding was found during review and fixed in the reviewed commit.

## Fixed: misleading message when the plan was already stuck (medium)

`whatIfOutcome` in `web/whatif-data.js` returned `{kind: 'unpaid'}` whenever the changed plan did not pay off, and the page always showed "This change would stop your plan from paying off." With a budget of $100 against $350 of minimum payments, trying "$10 less" produced that sentence even though the plan was already failing. The outcome now carries `broken`, true only when the current plan pays off and the changed one does not, and the page says "Your plan still would not pay off." otherwise. `test_whatif.mjs` checks both values, and both were confirmed in the browser.

## What was traced

**Input and validation.** The amount goes through `financeAmount(String(amount), true)`, the existing validator in `web/finance-data.js`: digits with at most two decimals, at least one cent, capped. A change larger than the whole budget is rejected before the engine is called. The changed budget is then sent to the same `/calculate` path as any budget, so `api.py` and `payoff.py` validate it again. Those files are not modified.

**Stored data.** `savedBudgets` reads Money overview's storage with `readStore`, which already swallows unreadable JSON, and keeps only entries with a string month, a known category (checked with `isCategory`, which uses `Object.hasOwn`) and a non-negative whole number of cents. Malformed entries are ignored for the guide and never written back, so nothing in storage is altered. Expenses come from `loadExpenses`, which was reviewed with the Expenses page.

**Output.** Every string in the panel is set with `textContent` through the `el` helper, including the engine's message. No new `innerHTML`.

**Saving.** `runWhatIf` never calls `savePlan`. The apply button copies the previewed budget into the existing budget input and calls `schedule()`, the same path as typing a budget, which validates through the engine before saving.

**Races.** `runWhatIf` takes a revision number and drops its result if another run started while it waited. Every `render()` starts a fresh run, and `schedule()` clears the preview and hides the apply button while the main plan recalculates, so the button can never apply a budget computed against an older plan. Typing before the plan has loaded is guarded by the `plan &&` check.

**Existing behaviour.** `schedule`, `update` and `render` gain one call each and are otherwise unchanged. The script order in `strategy.html` puts `expense-data.js`, `finance-data.js` and `whatif-data.js` before `strategy.js`, and none of their top-level names clash with `strategy.js`, `store.js`, `api.js` or `categories.js`; the page loads with no console errors.

**Devex.** No new commands, ports, secrets or dependencies. The pipeline's existing JavaScript test step gains one file. `whatif-data.js` is added to the local server's allowlist and to the served-file test.

**Feature gates.** The repo has none.

**PR discussion.** No PR existed when this review ran.
