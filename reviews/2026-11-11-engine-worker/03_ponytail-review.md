# Ponytail review

- Reviewed SHA: `49dfc8bf7262ac68388918d0896f86ce04ea3351`, scope `origin/main...49dfc8b`
- Model: Claude Opus 5.5 (`claude-opus-5-5`), Claude Code
- Instructions: Ponytail `96608e0`, `skills/ponytail/SKILL.md` (full mode) and `skills/ponytail-review/SKILL.md`

What this change does: on the published site, the calculator engine (Python running in the browser) used to load on the page's main thread. That froze the page for about 4 seconds on every visit. It now loads in a Web Worker, a background thread the browser gives a page, and the page only sends it requests and reads the answers.

Looks good. Ship.

Checked: both callers of `api()` (`store.js`, `tools.js`); the engine's error handling in `api.py`; worker and engine file paths on GitHub Pages; and that the local server path is unchanged. The new tests cover replies arriving out of order, one failed call and a crashed worker. In the browser, the home page and salary tool worked with zero main-thread long tasks. Expected load is one person in one browser tab, so there is no scale concern.

Lean: none. The engine code moved rather than grew, and the routing is the minimum that keeps two calls in flight apart and recovers from a crash.

Not checked: Firefox and Safari (module workers need Firefox 114+ and Safari 15+), and a new PageSpeed run, which can only happen after deploy.
