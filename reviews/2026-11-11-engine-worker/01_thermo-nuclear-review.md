# thermo-nuclear-review (security and correctness)

- Reviewed SHA: `49dfc8bf7262ac68388918d0896f86ce04ea3351`, scope `origin/main...49dfc8b`
- Model: Claude Opus 5.5 (`claude-opus-5-5`), Claude Code
- Instructions: pstack `bc09365`, `plugins/pstack/skills/thermo-nuclear-review/SKILL.md`

## Result

No findings at any priority.

## What was traced

**Callers.** `api()` has two callers. `calculatePlan` in `web/store.js` serves the home, strategy, plan and track pages. `run` in `web/tools.js` serves the salary and RRSP tools. Both await `api()` and read `{ok, data}`, and both handle a rejection as a displayed error. The new code returns the same shape: `{ok: status === 200, data: JSON.parse(text)}`. A rejection still carries an `Error` with a readable message. The stale-result guard in `tools.js` (`revisions`) only compares counters after the await, so it is unaffected by replies arriving in a different order.

**Engine errors.** `api.respond` in `api.py` catches `ValueError` and returns `(400, json)`, so invalid input still resolves as `ok: false` with the engine's message. Any other Python exception throws a `PythonError` inside the worker. The worker's `try` catches it and posts `{id, error: message}`, and `api.js` rejects only that call. Before the change, the same exception propagated to the caller on the main thread, so caller-visible behaviour is the same. A failed engine download rejects `ready` once, and every later call in that worker fails with the same message. The old code also cached the rejected `loadEngine()` promise, so this matches the previous behaviour. The message tells the user to refresh.

**Routing.** Ids come from a page-global counter and are never reused, so a reply cannot resolve the wrong call. Two calls in flight at once (`run` firing again while a previous call waits) are covered by `test_api.mjs`. Inside the worker, each call awaits `ready` and then runs synchronously, so Python calls never overlap.

**Crash path.** `worker.onerror` fires when the worker script itself fails to load or evaluate, for example a 404 or a syntax error. It rejects every waiting call, clears the map and drops the worker so the next call starts a new one. `event.preventDefault()` only suppresses the duplicate console report.

**Paths.** `new Worker('engine-worker.js')` resolves against the page URL. Every page that loads `api.js` lives in `web/`, which was checked by grepping `web/*.html` for `api.js`. The worker fetches `new URL('../<name>', self.location)`, which is the repository root on Pages. That is the same location the old `REPO_ROOT` (`'../'`) pointed to. `REPO_ROOT` remains in `api.js` for `sample-debts.json`, which `store.js` and `app.js` use.

**Privacy and trust boundary.** Debt and salary inputs are posted to a same-origin worker and never leave the browser. The only network requests are the same pinned `cdn.jsdelivr.net/pyodide/v0.28.0` build as before and the repository's own `.py` files. No new origin, no storage change, no `eval` of page data.

**Devex and CI.** The local server path (`LOCAL`) is unchanged. `dashboard.py` serves `engine-worker.js` through the existing fixed allowlist, so no request path builds a file path. The served-file check in `test_dashboard.py` covers it. `test_api.mjs` is added to the existing `node --test` step. The worker uses a dynamic `import()` rather than a top-level `import`, so the pipeline's `node --check web/*.js` parses it.

**Merge of `main`.** The merge brought in dark mode (`theme.js`) and the what-if panel. The two conflicts, in the `PAGES` list and the `node --test` file list, were resolved by keeping both sides. After the merge, the browser check showed the theme toggle present and the plan computed through the worker.

Feature gates: the repo has none.

PR discussion: checked after the audit. PR #6 had no comments or review-bot output.
