# Review summary: dark mode toggle

- Reviewed SHA: `fcc78e88d568d4acf2745dc0a95d7dd22e9f4dcb` (branch `feat/dark-mode`, stacked on `feat/spending-what-if` at `f441bdf`, which is PR #3 and not yet merged)
- Scope: `git diff f441bdf...fcc78e8`: `web/theme.js` (new), `web/style.css`, all 11 `web/*.html` pages (one script tag each), `test_dashboard.py`, `dashboard.py`, `README.md` (55 additions, 13 deletions)
- Model actually used: Claude Fable 5.2 (`claude-fable-5-2`) in Claude Code, for both implementation and review. AGENTS.md says model reviews run in Codex for now; this ran in Claude Code because the user asked for this change in a Claude Code session.
- Upstream instructions read: Ponytail `96608e0` (`skills/ponytail`, `skills/ponytail-review`); pstack `bc09365` (`thermo-nuclear-review`, `thermo-nuclear-code-quality-review`).

## Verdict

Ship after PR #3 merges. Two findings were fixed before the reviewed commit. One known limit is documented in the code as a shortcut.

## Findings

**Fixed before commit: the button's accessible name did not match its visible text.** The first version labelled the button "Dark mode" for screen readers while showing "Light mode" on screen. Someone using voice control says what they see, so "click Light mode" would not have found it. The button now has no separate label; its visible text names the theme it switches to. Details: [01_thermo-nuclear-review.md](01_thermo-nuclear-review.md).

**Fixed before commit: a dark page would print as light text on white paper.** The dark colours come from a filter, and browsers do not print page backgrounds, so the inverted light text would land on white. A print rule now turns the filter off. Details: [01_thermo-nuclear-review.md](01_thermo-nuclear-review.md).

**Known limit, documented: dark colours are inverted, not hand-picked.** Dark mode inverts the main content and rotates the hue back to teal. That covers every page, chart and JavaScript-drawn colour with five CSS rules and nothing to maintain per page. The cost is that the exact dark colours are whatever the inversion gives. The countdown card on Home, which is dark in light mode, is inverted twice to stay dark and comes out slightly lighter than the original. The CSS carries a `shortcut:` comment naming this limit and the upgrade path. Details: [02_thermo-nuclear-code-quality-review.md](02_thermo-nuclear-code-quality-review.md).

**Ponytail: smallest complete change.** Details: [03_ponytail-review.md](03_ponytail-review.md).

## Verification

- Local, on the reviewed SHA: Python `unittest` 24 tests OK (one new: every page loads `theme.js` in its head without `defer`); `node --test` 14 passed; Ruff clean; `node --check` clean on all `web/*.js`.
- Browser, local server, dark mode on: Home (top and bottom), Debts, Strategy, Payoff plan, Tracking, the debt worksheet, Money overview, RRSP growth, Salary, and Expenses at phone width (375px) with an error message showing. Text, charts, inputs and buttons were readable on each. No sideways scrolling on the phone. No console errors.
- Toggle: switches both ways, saves `kosha-theme`, and the saved theme is applied after a reload.
- Not checked: RRSP withdrawal in dark mode (same layout as Salary); printing; a browser whose system setting is dark (the test browser's is light, so the system-setting branch was not exercised); the static GitHub Pages site.
- CodeQL runs in the pipeline only.
