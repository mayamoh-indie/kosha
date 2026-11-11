# Scope and documentation checks

Reviewed SHA: 12a01eba5d5f940a8760e0dcd03afa0fca721cff. Base: 2b9fc8bba718552462132abaa034fcdf132fe115.
Reviewer: GPT-6.1 Sol; sequential scope, security/correctness and maintainability passes by the same agent.

Used Ponytail full instructions already read in this session. The user clarified that guides mean app features, not agent skills, and then asked to organize the root. Scope is one coherent documentation and file-layout cleanup.

The smallest complete layout groups source, tests, sample data and docs while retaining root files needed by hosting, project rules and existing local launch configurations. Runtime references were updated along with moves: Python imports, CLI tests, browser worker downloads and package import, sample fetches, local server mapping, and deployment copy list. No financial formula, API response, account rule or persistence schema changed.

The two task guides explain starting a debt plan and preparing a yearly bill. They use existing UI labels and preserve the distinctions between forecasts, payment records, expenses, earmarks and account snapshots. Setup and test commands moved under docs/how-to; calculation and tax detail under docs/reference. Current features are separated from planned work.

25 Python tests and 26 JavaScript tests passed, including relocated sample HTTP routing, denied source paths, worker package paths and missing engine downloads. All web JavaScript syntax checks and git diff --check passed. The documented avalanche example produced 18 months and CAD 1,095.54 interest at CAD 800/month. Seven documentation files passed a local-link target check. A temporary static artifact matching the workflow imported app.api and calculated an empty paid-off plan successfully. The artifact excludes the local server.

A live static browser check was attempted but timed out; offline worker and packaged-Python checks cover only the stated behavior. Remote pipeline status must be verified on the final head. AI discoverability was researched for the user's separate question; no speculative metadata, tool registration or promised traffic is part of this PR.
