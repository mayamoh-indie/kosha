# thermo-nuclear-review (security and correctness)

- Reviewed SHA: `474273c83f64f6ac81d97b3ae348a9cd239fe6fd`, scope `92b2251...474273c`
- Model: Claude Fable 5.2 (`claude-fable-5-2`), Claude Code
- Instructions: pstack `bc09365`, `plugins/pstack/skills/thermo-nuclear-review/SKILL.md`

## Result

No open findings. One low accessibility finding was fixed in the reviewed commit. One intended breakage is recorded.

## Fixed: the current sidebar section was not exposed on inner debt pages (low, accessibility)

On the five inner debt pages the sidebar Debts link had the `active` class but no `aria-current`. Before this change `planner.html` set `aria-current="page"` on it. A screen-reader user opening the phone menu on Strategy would not hear which section they were in. The link now has `aria-current="true"` on those pages. `aria-current="page"` stays on exactly one sidebar link on the pages that are a sidebar destination, and on exactly one link in the debt row on every debt page.

## Recorded: `finance.html` is gone (intended)

The page is deleted and removed from the local server's list, so the address returns 404. This is the stated intent of the change. No redirect page was added. Nothing in `web/`, `app/`, `tests/`, `docs/`, the README or the workflow still refers to `finance.html` or `home.js`.

## What was traced

**The moves.** `finance.html` became `index.html`; the old `index.html` became `debts.html`; the old `debts.html` became `debt-list.html`. `home.js` became `debts.js` and the old `debts.js` became `debt-list.js`. Both scripts are byte-identical to their originals (same blob hashes, `936f214` and `b3e60a6`), so no logic changed. Each page's script tag points at the renamed file.

**Links that meant the old Home.** The brand link and the sidebar Home link use `./`, which is now the money overview, as intended. No page body or script linked to `./` or `index.html` expecting the payoff dashboard. "Clear my saved plan" reloads its own page.

**Saved data.** No storage key changed. `finance.js` and `finance-data.js` are untouched and load the same `kosha-finances-v1` data on the new address under the same origin.

**Local server.** `PAGES` drops `finance.html` and `home.js` and adds `debt-list.html` and `debt-list.js`. `/` still maps to `index.html`. The fixed allowlist and the 404 checks for paths outside it are unchanged. The content-security policy is unchanged and the new markup has no inline script or style.

**Theme bootstrap.** Every page still carries the same inline bootstrap before the stylesheet; the hash test passes. `tests/test_theme.mjs` reads `web/index.html`, which still has it.

**Static site.** The deploy step copies `web` whole, so the new files ship and the deleted ones do not. The root `index.html` still forwards to `web/`.

**Sidebar.** Rebuilt on all 11 pages with six links in one order; the order test passes. Strategy, Payoff plan and Tracking are no longer in the sidebar and are reached from the debt row.

**Phone menu.** `menu.js` does not read the link list. The debt row sits inside `main`, so it is inert while the menu is open.

**Search descriptions.** Each page keeps a unique description; the test passes.

**Devex and feature gates.** No new commands, ports, variables or dependencies. The repo has no feature gates.

**PR discussion.** No PR existed when this review ran.
