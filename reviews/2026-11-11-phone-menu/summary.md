# Review summary: phone slide-out menu

- Reviewed SHA: `d3f50fd91a23a9c65a47ce1bde425eb8e5dbb46b` (branch `feat/phone-menu`, stacked on `feat/dark-mode` at `5c76342`, which is stacked on PR #3; neither is merged yet)
- Scope: `git diff 5c76342...d3f50fd`: `web/menu.js` (new), `web/style.css`, all 11 `web/*.html` pages, `test_dashboard.py`, `dashboard.py`, `README.md` (62 additions, 40 deletions)
- Model actually used: Claude Fable 5.2 (`claude-fable-5-2`) in Claude Code, for both implementation and review. AGENTS.md says model reviews run in Codex for now; this ran in Claude Code because the user asked for this change in a Claude Code session.
- Upstream instructions read: Ponytail `96608e0` (`skills/ponytail`, `skills/ponytail-review`); pstack `bc09365` (`thermo-nuclear-review`, `thermo-nuclear-code-quality-review`).

## Verdict

Ship after the two branches below it merge. One finding was fixed before the reviewed commit. One trade-off is recorded.

## Findings

**Fixed before commit: keyboard focus could reach the page behind the open menu.** With the menu open, pressing Tab past the last link moved focus into the dimmed page, where the user could not see it. `main` is now set `inert` while the menu is open and restored when it closes. Details: [01_thermo-nuclear-review.md](01_thermo-nuclear-review.md).

**Trade-off, left as is: on a phone with JavaScript turned off there is no page menu.** The old link row was plain markup and worked without scripts. The new menu button is created by `menu.js`. Every page in this app already needs JavaScript to show anything beyond its headings, so this was accepted. Details: [01_thermo-nuclear-review.md](01_thermo-nuclear-review.md).

**Simplification: one menu instead of two.** Each page carried the links twice, once in the sidebar and once in a separate phone list, which is how the two drifted apart before PR #2. The phone list is deleted from all 11 pages and the sidebar is reused as the slide-out panel. Details: [02_thermo-nuclear-code-quality-review.md](02_thermo-nuclear-code-quality-review.md).

**Ponytail: smallest complete change.** Details: [03_ponytail-review.md](03_ponytail-review.md).

## Verification

- Local, on the reviewed SHA: Python `unittest` 24 tests OK; `node --test` 14 passed; Ruff clean; `node --check` clean on all `web/*.js`.
- Browser, local server, 375px wide:
  - Closed: the top bar shows the brand and a ☰ button; the link row is gone; no sideways scrolling.
  - Open: 10 links, the current page highlighted, the page dimmed behind, `aria-expanded="true"`, button labelled "Close menu".
  - Closes with the button, a tap on the dimmed area, and Escape (focus returns to the button).
  - `main` is inert only while open.
  - Works with dark mode on.
  - Checked on Home and Tracking.
- Browser, 1280px wide: the button and backdrop are hidden, the sidebar is fixed with all 10 links as before, and widening the window while the menu was open closed it.
- No console errors.
- Not checked: a real phone or touch device, tablet widths between 601px and 1100px (their rules are not changed), and the static GitHub Pages site.
- CodeQL runs in the pipeline only.
