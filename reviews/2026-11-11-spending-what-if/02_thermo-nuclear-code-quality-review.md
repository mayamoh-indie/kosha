# thermo-nuclear-code-quality-review (maintainability)

- Reviewed SHA: `2565dea709322526a460f321d997992ed8a96edf`, scope `main...2565dea`
- Model: Claude Fable 5.2 (`claude-fable-5-2`), Claude Code
- Instructions: pstack `bc09365`, `plugins/pstack/skills/thermo-nuclear-code-quality-review/SKILL.md`

## Result

Approve. No structural regression. Two notes, both left as they are with reasons.

## The change uses the existing structure instead of adding to it

The obvious heavy version of this feature would add a what-if mode to the engine or a new endpoint. This change adds neither. A spending change is modelled as what it is in this app, a different monthly debt budget, so the preview is one more call to `calculatePlan` with one field changed, and applying it is one assignment into the existing budget input. `api.py`, `payoff.py` and `store.js` are untouched.

The rules sit in `web/whatif-data.js` (38 lines, no page code), following the `expense-data.js` and `finance-data.js` split, so they are tested without a browser. It reuses `financeAmount`, `isCategory`, `expensesIn`, `sumCents`, `monthKey` and `readStore` instead of writing new versions.

## Note: `runWhatIf` calculates and renders in one function

`runWhatIf` in `web/strategy.js` is about 20 lines that request the changed plan and then build the rows. Its lines are long, in the style of the rest of the file. A stricter split would give a `showWhatIf(outcome)` function with a single caller, moving code without removing any. The branching that carries risk (which budget, which outcome) is already outside it and under test. Left as is.

## Note: three outcome kinds plus a flag

`whatIfOutcome` returns `moved`, `now_paid` or `unpaid`, and `unpaid` carries `broken`. A fourth kind (`still_unpaid`) was the alternative. The flag keeps one branch in the page for "does not pay off" and changes only the sentence, so it is the smaller of the two.

## Size and layering

- `web/strategy.js` grows from 110 to 152 lines.
- No file approaches 1,000 lines.
- `el` is added to `strategy.js` in the same form `plan.js`, `track.js` and `expenses.js` already use. The per-page copy of this helper is an existing convention, not something this PR introduces.
- No new conditionals are added to `update`, `render` or `drawPayments`.
