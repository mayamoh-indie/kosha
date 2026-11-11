# thermo-nuclear-code-quality-review (maintainability)

- Reviewed SHA: `49dfc8bf7262ac68388918d0896f86ce04ea3351`, scope `origin/main...49dfc8b`
- Model: Claude Opus 5.5 (`claude-opus-5-5`), Claude Code
- Instructions: pstack `bc09365`, `plugins/pstack/skills/thermo-nuclear-code-quality-review/SKILL.md`

## Result

Approve. There are no structural regressions and no missed code-judo move.

## Measurements

`web/api.js` goes from 29 to 41 lines and `web/engine-worker.js` is 23 lines, from `(Get-Content <file>).Count`. No file approaches 1,000 lines. The diff adds no branch to any other page script. Both callers are untouched.

## Ownership and layering

The engine-loading code moved, unchanged in substance, from `api.js` to `engine-worker.js`, which now owns "how Pyodide is loaded". `api.js` keeps sole ownership of "where a calculation runs": the local server or the worker. Callers still see one function, `api(path, payload)`, so the boundary did not leak. The local/static split stays a single `if (LOCAL)` at the same place as before, with no new mode flag.

## Code-judo options considered

A **`MessageChannel` per call** would replace the id counter: each request carries its own port and the reply comes back on it. It does not delete the pending set, because a worker crash must still reject every waiting call, and that needs the collection of outstanding calls. The result would be the same number of concepts, so it was not adopted.

**Comlink**, or another RPC helper, would hide the routing but adds a dependency for about 15 lines. Rejected.

**Lazy loading** (start Pyodide only on user action) would not remove the need for a worker. The home page needs a calculation on load.

## Minor notes, not findings

The "Calculator unavailable. Please refresh." string appears in both files. The worker runs in a separate global scope and cannot read page constants, so sharing it would need a module both sides import. That is more machinery than one string is worth.

`test_api.mjs` stubs `Worker` with a small class (`reply` / `crash`) instead of mocking timers. This keeps the tests deterministic and readable.
