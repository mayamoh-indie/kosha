# Ponytail review

- Reviewed SHA: `2565dea709322526a460f321d997992ed8a96edf`, scope `main...2565dea`
- Model: Claude Fable 5.2 (`claude-fable-5-2`), Claude Code
- Instructions: Ponytail `96608e0`, `skills/ponytail/SKILL.md` (full mode) and `skills/ponytail-review/SKILL.md`

What this change does: the Strategy page gets a "What if my spending changes?" panel. You enter a monthly amount you would spend less or more, and it shows the new debt-free month and how much interest changes. Nothing is saved unless you press "Use this as my debt budget".

Looks good. Ship.

Checked: the new rules file and its five tests; every caller of the functions it reuses; the three places `strategy.js` calls the new function; the script order in `strategy.html`; the local server allowlist and its test; the pipeline step. Expected load is one person in a browser. Each preview is one extra engine call, delayed 350 ms after typing, the same as the budget field.

One issue was found and fixed before the reviewed commit: a plan that was already stuck was described as broken by the change (see `01_thermo-nuclear-review.md`).

Skipped on purpose, as agreed with the user: moving money out of category budgets, changes spread over several months, and a version of the panel on Home.

Not checked: the static GitHub Pages mode before merge. Check the live Strategy page after deploy.
