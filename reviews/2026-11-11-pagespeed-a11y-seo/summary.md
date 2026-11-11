# Review summary: PageSpeed accessibility, SEO and layout-shift fixes

- Reviewed SHA: `6642793610b590a4627c8327e6094d4ea7bef949` (branch `fix/pagespeed-a11y-seo`, PR #7, base `main` at `f8991e8`)
- Scope: `git diff origin/main...6642793`, covering `web/style.css`, all 11 `web/*.html` pages, the root `index.html` and `test_dashboard.py` (43 additions, 32 deletions)
- Model actually used: Claude Opus 5.5 (`claude-opus-5-5`) in Claude Code. AGENTS.md says model reviews run in Codex for now. This review ran in Claude Code because the user asked for this PR in a Claude Code session.
- Upstream instructions read: Ponytail `96608e0` (`skills/ponytail`, `skills/ponytail-review`) and pstack `bc09365` (`thermo-nuclear-review`, `thermo-nuclear-code-quality-review`), from the local read-only copies in `review-upstream/`.

## Verdict

Ship. There are no security or correctness findings. One known limit and one structural follow-up are noted below; neither blocks this PR.

## Findings

**No blocking findings.** The PR changes colour values, adds two reserved sizes, adds `tabindex`/`role`/`aria-label` to two table wrappers and adds a meta description to each page. No script, data or storage code changed. Every grey that changed was only ever used as text, borders or chart labels, and none appears in JavaScript. Details: [01_thermo-nuclear-review.md](01_thermo-nuclear-review.md).

**Known limit: an empty chart area on error.** If the plan fails to load, `#timeline` stays empty and keeps its reserved 700:220 space instead of collapsing. The error message is still shown at the top of the page. Before, the chart area collapsed to nothing. This is an acceptable trade for a zero layout shift on every successful load.

**Follow-up, not blocking: colours as variables.** The muted grey now appears 25 times as a literal hex in `style.css`. That is how the stylesheet already names every colour, and the dark-mode comment already proposes moving to colour variables. Doing that here would rewrite most of the minified first line and mix a refactor into a fix. Details: [02_thermo-nuclear-code-quality-review.md](02_thermo-nuclear-code-quality-review.md).

**Ponytail: smallest complete change.** Each fix is the platform feature built for the job: `aspect-ratio` to reserve space, `color-mix()` (already used in this stylesheet) for the labels, and plain attributes for the tables. Details: [03_ponytail-review.md](03_ponytail-review.md).

## Verification

- Local, on the reviewed SHA: Python `unittest` passed 25 tests. `node --test test_expenses.mjs test_finance.mjs test_whatif.mjs test_api.mjs` passed 17.
- The new description test was run against `main`'s pages and failed, so it detects the missing descriptions.
- axe-core 4.10.2, WCAG 2 A/AA, all 11 pages, light mode: 0 violations. Before the change, every page had contrast violations, and Growth and the planner also had `scrollable-region-focusable`.
- Dark mode: axe cannot evaluate CSS filters. Each colour pair was checked by applying the theme's `invert(.9) hue-rotate(180deg)` matrix; every new pair is at least 4.5:1 there too.
- Home page layout shift, served Pages-style: 0.255 → 0.000 at 1350 px wide, and 0.053 → 0.000 at 412 px.
- Not available locally: Ruff and CodeQL, which run in the pipeline. No Python source changed.
- Not checked: a visual screenshot pass (the browser pane could not draw screenshots during this session), and a PageSpeed run, which can only happen after deploy.
- PR discussion: no comments or bot reviews when this review was written.
