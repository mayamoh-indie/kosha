# thermo-nuclear-code-quality-review (maintainability)

- Reviewed SHA: `d3f50fd91a23a9c65a47ce1bde425eb8e5dbb46b`, scope `5c76342...d3f50fd`
- Model: Claude Fable 5.2 (`claude-fable-5-2`), Claude Code
- Instructions: pstack `bc09365`, `plugins/pstack/skills/thermo-nuclear-code-quality-review/SKILL.md`

## Result

Approve. This change removes a structural problem instead of adding to one.

## One menu instead of two

Before this change every page held the page links twice: in `<aside class="sidebar">` for desktop and in `<nav class="mobile-nav">` for phones. Adding a page meant editing 22 lists, and PR #2 exists because two of them drifted. A slide-out menu could have been built as a third structure. Instead the sidebar itself becomes the panel at phone width, and the phone list is deleted from all 11 pages. The diff removes 40 lines and adds 62, of which 25 are the new script and 11 are its script tags.

The sidebar is still copied into each page. That duplication is now half what it was, and the existing order test still guards it.

## How the open state is expressed

There is one piece of state: the `menu-open` class on `body`. The stylesheet derives everything from it (links shown, sidebar fixed, backdrop shown, scroll locked). `menu.js` has one function, `set(open)`, that every path calls, so the class, the button label, `aria-expanded` and `inert` cannot disagree with each other.

The closed-state hide rule became `body:not(.menu-open) :is(...)`. A negative selector is slightly harder to read than a positive one, but the alternative is re-declaring the display of five different elements for the open state, which would repeat their desktop styles.

## `--menu-bar`

The script measures the bar and passes its height to CSS so the page does not jump when the bar leaves the flow. This is one line of layout knowledge in JavaScript. A pure-CSS version would need a fixed bar height, which would break if the brand size changes. Kept, with a comment saying why.

## Size

- `web/menu.js` is 25 lines with no globals.
- `web/style.css`: the three phone-list rules are removed, one hide rule is rescoped, and a 7-line block is added.
- `test_dashboard.py` gets shorter: the local `links` helper is no longer needed.
- No file approaches 1,000 lines.
