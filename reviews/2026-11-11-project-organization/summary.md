# Project organization and documentation

Reviewed SHA: 12a01eba5d5f940a8760e0dcd03afa0fca721cff. Base: 2b9fc8bba718552462132abaa034fcdf132fe115.
Reviewer: GPT-6.1 Sol; sequential scope, security/correctness and maintainability passes by the same agent.

Verdict: no blocking findings. Application calculations and stored browser data formats are unchanged. The README describes current features and links to two user walkthroughs. Setup, checks, calculation rules, tax assumptions and project direction are under docs/.

Python modules now live in app/, tests in tests/ and fictional sample data in data/. Traced imports, CLI subprocesses, local allowlisted URLs, browser sample loading, static worker initialization and workflow packaging. The root dashboard.py remains as a minimal compatibility launcher for the existing local launch configuration.

25 Python tests and 26 JavaScript tests passed, including relocated sample HTTP routing, denied source paths, worker package paths and missing engine downloads. All web JavaScript syntax checks and git diff --check passed. The documented avalanche example produced 18 months and CAD 1,095.54 interest at CAD 800/month. Seven documentation files passed a local-link target check. A temporary static artifact matching the workflow imported app.api and calculated an empty paid-off plan successfully. The artifact excludes the local server.

Ruff is unavailable locally. Lint, CodeQL and Build must pass for the final PR head before merging. Live static-browser verification was attempted on loopback IPv4 and IPv6 but the browser could not connect; no successful Pyodide browser run or live deployment is claimed. The worker test uses a mocked external runtime.

No AI-discovery metadata or WebMCP feature was added in this cleanup. Historical review files intentionally retain the paths and commands from their reviewed commits.

Details: [security and correctness](01_security-correctness.md), [maintainability](02_maintainability.md), [scope](03_scope.md).
