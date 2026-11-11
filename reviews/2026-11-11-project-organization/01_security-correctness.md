# Security and correctness

Reviewed SHA: 12a01eba5d5f940a8760e0dcd03afa0fca721cff. Base: 2b9fc8bba718552462132abaa034fcdf132fe115.
Reviewer: GPT-6.1 Sol; sequential scope, security/correctness and maintainability passes by the same agent.

Used the actual local upstream thermo-nuclear-review procedure referenced in AGENTS.md, already read in this session; no newer revision fetched. Reviewed the full moved modules and changed callers using the existing source reads and rename-aware diff.

No blocking findings. Python package-relative imports match local execution and the browser filesystem. Worker initialization creates /home/pyodide/app, downloads its initializer and three calculator modules from ../app/, and imports app.api. The existing worker error response still handles failed downloads. Browser sample fetches and the local fixed allowlist agree on data/sample-debts.json. Resolving the repository root from the relocated server file avoids depending on launch working directory.

The local server still validates host and origin and does not serve source modules. Added source-path rejection checks preserve this boundary. CSP authorizes the same theme bootstrap hash and its moved test reads app/dashboard.py. The static artifact deliberately copies only the public calculator package, web pages and fictional data; server code, tests, docs, reviews and local caches are excluded. No stored user-data keys changed and no migration or deletion occurs.

25 Python tests and 26 JavaScript tests passed, including relocated sample HTTP routing, denied source paths, worker package paths and missing engine downloads. All web JavaScript syntax checks and git diff --check passed. The documented avalanche example produced 18 months and CAD 1,095.54 interest at CAD 800/month. Seven documentation files passed a local-link target check. A temporary static artifact matching the workflow imported app.api and calculated an empty paid-off plan successfully. The artifact excludes the local server.

Verification limits: no real browser Pyodide execution after the move; the attempted static browser connections timed out. CI security and build are pending at review time. No medium/high issue remained to reconcile with PR comments.
