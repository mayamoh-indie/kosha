# Review summary: Home becomes the money overview

- Reviewed SHA: `474273c83f64f6ac81d97b3ae348a9cd239fe6fd` (branch `feat/home-is-money-overview`)
- Scope: `git diff -M 92b2251...474273c`: 22 files, 208 additions, 195 deletions. Most of that is two scripts renamed without changes.
- Model actually used: Claude Fable 5.2 (`claude-fable-5-2`) in Claude Code, for implementation and all three review passes. They are sequential passes by one agent, not independent reviewers. AGENTS.md says model reviews run in Codex for now; this ran in Claude Code because the user asked for it in this session.
- Upstream instructions read: Ponytail `96608e0` (`skills/ponytail`, `skills/ponytail-review`); pstack `bc09365` (`thermo-nuclear-review`, `thermo-nuclear-code-quality-review`).

## Verdict

No open findings. One accessibility finding was fixed in the reviewed commit. Two trade-offs are recorded.

## Findings

**Fixed: inner debt pages no longer told assistive technology which sidebar section was current.** The first commit highlighted Debts in the sidebar on All debts, Strategy, Payoff plan, Tracking and Edit debts with the `active` class only. The planner page had `aria-current="page"` there before, so this was a small regression. The link now carries `aria-current="true"` on those five pages, and the new row of debt links marks the exact page with `aria-current="page"`. Details: [01_thermo-nuclear-review.md](01_thermo-nuclear-review.md).

**Trade-off, intended: `finance.html` now returns 404.** The request was that the Money overview page is not required. Its content is served at `./`. No redirect was added, so an old bookmark to `finance.html` breaks. Saved data is not affected. Details: [01_thermo-nuclear-review.md](01_thermo-nuclear-review.md).

**Trade-off, left as is: the row of debt links is copied into six pages.** This follows how the sidebar is already built, and a new test fails if the copies drift. Details: [02_thermo-nuclear-code-quality-review.md](02_thermo-nuclear-code-quality-review.md).

**Ponytail: smallest complete change.** Details: [03_ponytail-review.md](03_ponytail-review.md).

## Verification

- Local, on the reviewed SHA: Python `unittest` 26 tests OK; `node --test tests/*.mjs` 26 passed; `node --check` clean on all `web/*.js`.
- Ruff was not available locally and did not run. One Python file changed (`app/dashboard.py`, the list of served files) plus the test file.
- Browser, local server, desktop width, dark mode: Home shows the money overview with no error; the Debts landing page and All debts load the sample plan; all six debt pages show Debts highlighted and the right link marked in the row.
- Browser, 375px wide, light mode: Strategy shows the row wrapped onto two lines with no sideways scrolling, and the phone menu button is present.
- `finance.html` returns 404 from the local server.
- The browser checks ran on the first commit (`1d77673`). The only later change adds one attribute to five sidebar links.
- Not checked: Payoff plan, Tracking and Edit debts beyond loading; the static GitHub Pages site; a real phone.
- CodeQL runs in the pipeline only.
