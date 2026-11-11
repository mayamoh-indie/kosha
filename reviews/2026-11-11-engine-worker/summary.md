# Review summary: run the Python engine in a Web Worker

- Reviewed SHA: `49dfc8bf7262ac68388918d0896f86ce04ea3351` (branch `perf/pagespeed`, PR #6). It contains the change commit `34da31d` and a merge of `main` at `59fc7c6`.
- Scope: `git diff origin/main...49dfc8b`, covering `web/api.js`, `web/engine-worker.js` (new), `test_api.mjs` (new), `dashboard.py`, `test_dashboard.py` and `.github/workflows/pipeline.yml` (114 additions, 17 deletions).
- Model actually used: Claude Opus 5.5 (`claude-opus-5-5`) in Claude Code. AGENTS.md says model reviews run in Codex for now. This review ran in Claude Code because the user asked for this PR in a Claude Code session.
- Upstream instructions read: Ponytail `96608e0` (`skills/ponytail`, `skills/ponytail-review`) and pstack `bc09365` (`thermo-nuclear-review`, `thermo-nuclear-code-quality-review`), from the local read-only copies in `review-upstream/`.

## Verdict

Ship. There are no security or correctness findings and no structural findings. The known limits are listed below and need no code change in this PR.

## Findings

**No blocking findings.** On GitHub Pages, `api()` now sends each request to a module worker and resolves the call from the reply with the matching id. Both callers, `calculatePlan` in `store.js` and `run` in `tools.js`, still receive the same `{ok, data}` shape and the same rejected-promise behaviour on engine errors. `api.respond` returns `(400, error)` for invalid input, and any other Python exception reaches the caller as an `Error` with the same message as before. Local `dashboard.py` calls do not touch the worker. Inputs still never leave the browser: the worker fetches only the repository's three `.py` files and the same pinned Pyodide build as before. Details: [01_thermo-nuclear-review.md](01_thermo-nuclear-review.md).

**Structure: the id map is the simplest correct shape.** A `MessageChannel` per call was considered as a way to remove the id bookkeeping. It was rejected because a worker crash must still reject every waiting call, so the set of pending calls stays either way. The one duplicated string, the "Calculator unavailable" message in both files, is acceptable: the worker cannot share page globals. Details: [02_thermo-nuclear-code-quality-review.md](02_thermo-nuclear-code-quality-review.md).

**Ponytail: smallest complete change.** The engine code, its pinned version and its error message are unchanged; only where it runs moved. The new logic (routing by id and crash recovery) has one focused test file that covers success, per-call failure and crash. Details: [03_ponytail-review.md](03_ponytail-review.md).

## Verification

- Local, on the reviewed SHA: Python `unittest` passed 24 tests. `node --test test_expenses.mjs test_finance.mjs test_whatif.mjs test_api.mjs` passed 17. `node --check` was clean on every `web/*.js`.
- Browser: the repository was served statically on `[::1]`, so the GitHub Pages code path runs. The home page rendered the plan, the salary tool calculated, and the `.py` files were fetched by the worker. A long-task observer recorded 0 main-thread long tasks. Before the change, PageSpeed recorded a 3.7 s long task.
- Not available locally: Ruff (not installed) and CodeQL. Both run in the pipeline.
- Not checked: Firefox and Safari. Module workers need Firefox 114+ and Safari 15+. `engine-worker.js` itself has no unit test; it was exercised only in Chrome. A fresh PageSpeed run is pending until after deploy.
- PR discussion: no comments or bot reviews when this review was written.

## Re-validation after merging `main` again

`main` moved to `35be5c9` (phone slide-out menu, PR #5) after the review, and PR #6 conflicted in the `PAGES` list. Merge commit `b883d4a9175c1bd14eaf260d912dda62b00de34f` keeps both additions (`menu.js`, `engine-worker.js`). Against `22abd42`, the reviewed files (`web/api.js`, `web/engine-worker.js`, `test_api.mjs`) have no diff. The only change in this PR's other files is that one `PAGES` line, plus `test_dashboard.py` lines that come from `main`. The findings above still apply. Local checks on `b883d4a` passed: 24 Python tests, 17 JS tests and `node --check` on all `web/*.js`.
