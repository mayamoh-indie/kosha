# thermo-nuclear-review (security and correctness)

- Reviewed SHA: `d3f50fd91a23a9c65a47ce1bde425eb8e5dbb46b`, scope `5c76342...d3f50fd`
- Model: Claude Fable 5.2 (`claude-fable-5-2`), Claude Code
- Instructions: pstack `bc09365`, `plugins/pstack/skills/thermo-nuclear-review/SKILL.md`

## Result

No open findings. One medium accessibility finding was fixed in the reviewed commit. One low-priority trade-off is recorded.

## Fixed: focus could leave the open menu into the hidden page (medium, accessibility)

The first draft dimmed the page and locked scrolling but left the page's controls focusable. A keyboard or screen-reader user could Tab from the last menu link into inputs under the backdrop. `set()` in `web/menu.js` now sets `document.querySelector('main').inert = open`, so the page behind takes no focus or clicks while the menu is open. Confirmed in the browser: `inert` is false when closed, true when open, false again after closing.

## Recorded: no menu on a phone without JavaScript (low)

Before this change the phone link row was static markup. Now, at phone width, the sidebar links are hidden unless `body` has `menu-open`, and only `menu.js` can add that. With scripts off, a phone user sees the brand bar and no links. Every page here already depends on JavaScript for its content (the plan, expenses and calculators all render from scripts), so the page was not usable without it before either. Left as is.

## What was traced

**The hide rule.** The old phone rule hid `.tagline, .nav-label, .nav, .sidebar-note, .sidebar small` always. It is now scoped with `body:not(.menu-open) :is(...)`, inside the same `max-width:600px` block, so desktop and tablet rules are untouched. When open, those elements fall back to their normal sidebar styles.

**Open state.** `body.menu-open .sidebar` becomes `position: fixed` at up to 290px wide with `z-index: 30`; the backdrop is fixed at `z-index: 20`. The storage warning (`z-index: 1000`) still sits above both. The sidebar already had `overflow-y: auto`, so a long menu scrolls on short screens.

**Page jump.** A fixed sidebar leaves the page flow, which would pull the page up by the bar's height. `set(true)` measures the bar first and stores it in `--menu-bar`, and `body.menu-open` uses it as top padding. It is set through `style.setProperty`, which the local server's `style-src 'self'` policy allows (the same method the category cards use).

**Closing paths.** The button, the backdrop and Escape all call `set(false)`. A `matchMedia` listener closes the menu when the width crosses 600px, so a rotated or resized window cannot be left with `inert` and `overflow: hidden` stuck on. Confirmed by widening the window with the menu open.

**Removed markup.** `<nav class="mobile-nav">` is deleted from all 11 pages along with its three CSS rules. Nothing else referenced it: `grep mobile-nav` over `web/`, the tests and the README returns nothing. The menu-order test no longer checks the phone list and instead checks that each page loads `menu.js`.

**Script loading.** `menu.js` is same-origin and loaded with `defer`, so `.sidebar`, `.brand` and `main` exist when it runs; all 11 pages have each of them. It defines no globals. It is added to the local server allowlist and the served-file test.

**Dark mode.** The sidebar and backdrop are outside `main`, so the dark filter does not affect them. Checked with dark mode on.

**Devex and feature gates.** No new commands or dependencies. The repo has no feature gates.

**PR discussion.** No PR existed when this review ran.
