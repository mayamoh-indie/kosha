# Ponytail review

- Reviewed SHA: `474273c83f64f6ac81d97b3ae348a9cd239fe6fd`, scope `92b2251...474273c`
- Model: Claude Fable 5.2 (`claude-fable-5-2`), Claude Code
- Instructions: Ponytail `96608e0`, `skills/ponytail/SKILL.md` (full mode) and `skills/ponytail-review/SKILL.md`

What this change does: Home now shows the money overview (assets, income, budgets, goals and bills), and the separate Money overview page is removed. The page that used to be Home is now what the Debts link opens. Every debt page has a row of links to the others: Overview, All debts, Strategy, Payoff plan, Tracking, Edit debts.

Looks good. Ship.

Checked: the three page moves and two script renames; every link to the moved pages in the pages, scripts, server list, tests, README and how-to guides; the sidebar and debt row on all pages; Home, the Debts landing page, All debts and Strategy in the browser.

One issue was found and fixed in the reviewed commit: the sidebar did not tell screen readers that Debts was the current section on the inner debt pages (see `01_thermo-nuclear-review.md`).

Lean: no script logic changed and no script was added. The row uses plain links and one line of CSS.

A test was added for the new row, because six copies of a link list can drift the same way the sidebar once did.

Not checked: the static GitHub Pages site, a real phone, and clicking through Payoff plan, Tracking and Edit debts. An old bookmark to `finance.html` now gets a 404; no redirect was added.
