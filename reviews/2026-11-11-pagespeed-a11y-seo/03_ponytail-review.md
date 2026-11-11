# Ponytail review

- Reviewed SHA: `6642793610b590a4627c8327e6094d4ea7bef949`, scope `origin/main...6642793`
- Model: Claude Opus 5.5 (`claude-opus-5-5`), Claude Code
- Instructions: Ponytail `96608e0`, `skills/ponytail/SKILL.md` (full mode) and `skills/ponytail-review/SKILL.md`

What this change does: it makes grey and small teal text dark enough to read easily, and gives each page a short summary for search engines. It also stops the home page from jumping when the plan finishes calculating, by holding space for the ring and chart before they are drawn. Two scrolling tables can now be reached with the keyboard.

Looks good. Ship.

Checked: every place the changed colours are used (CSS only; no script uses them); the home page's ring and chart code that the reserved space must match; both table pages; and both colour themes, with numbers. axe found no accessibility violations on any of the 11 pages. The new test fails on the old pages and passes on the new ones. Expected load is one person in a browser, so there is no scale concern.

Lean: none. Each fix uses the browser feature made for it (`aspect-ratio`, `color-mix()`, `tabindex` with `role="region"`).

Not checked: a visual look at the pages, because the browser pane could not take screenshots. A known limit: if the plan fails to load, the empty chart area keeps its space.
