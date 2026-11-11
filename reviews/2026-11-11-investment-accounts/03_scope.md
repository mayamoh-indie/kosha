# Scope and integration

Implementation SHA: 47de523932f533714c3d3ca4c0a5a28d82468d6e. Base: aae9c5ef96b10e6329b59c15c11f33d8856df876. Reviewer: GPT-6.1 Sol, implementing agent, Ponytail full scope pass.

The user asked for investment tracking split into registered and non-registered accounts and clarified that both manual contribution totals and a dated contribution/withdrawal log are wanted. Inputs are existing account snapshots plus an optional contribution total and dated positive activity entries linked to account IDs. Outputs are three account groups, their balances, per-account reference and logged-flow totals, and editable monthly activity entries.

Reached all affected paths: account-type options, conditional fields, saved-record parsing, form editing, shared saves/deletes, group rendering, monthly activity filtering, totals and user documentation. Existing registered types are TFSA/RRSP/FHSA; RESP/RRIF/LIRA and explicit Non-registered choices were added. Legacy Investments values are preserved and visibly flagged for confirmation. Old records are not rewritten on page load, and malformed storage blocks edits. No account balance is synthesized from logs.

The implementation extends Home and existing finance assets, which are already served and recursively packaged. There are no server, worker, API, workflow or navigation changes. README adds the feature and a dedicated how-to guide explains both tracking methods, backward compatibility, linked-account protection, storage limits and what totals mean. Browser data, account history, growth scenarios and real money are distinct.

Verification evidence is 44 passing JavaScript tests, 26 passing Python tests, all web script syntax checks and git diff --check. Fake-DOM tests use synthetic accounts and local storage. No live financial integration or real user records were used. Browser verification has not yet run; local loopback browser access failed during prior work. CI must establish lint, CodeQL and build success on the final PR head.

Excluded follow-ups: prices, holdings, bank sync, automatic transfers/balance reconciliation, performance returns, contribution-room and cost-base calculation, historical balance snapshots, CSV import/export and automatic growth-prefill. These require separate requirements and are not implied by the account grouping or cash-flow log.
