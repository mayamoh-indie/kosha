# Ponytail review

- Reviewed SHA: `d3f50fd91a23a9c65a47ce1bde425eb8e5dbb46b`, scope `5c76342...d3f50fd`
- Model: Claude Fable 5.2 (`claude-fable-5-2`), Claude Code
- Instructions: Ponytail `96608e0`, `skills/ponytail/SKILL.md` (full mode) and `skills/ponytail-review/SKILL.md`

What this change does: on a phone, the row of page links at the top of every page is gone. A ☰ button in the top bar opens the links as a panel that slides over the page, and the ✕ button, a tap outside, or Escape closes it. Desktop looks the same as before.

Looks good. Ship.

Checked: `menu.js`; the phone rules in `style.css`; that nothing still refers to the removed link row; the menu on Home and Tracking at phone width, with dark mode on and off; desktop width; every way of closing.

One issue was found and fixed before the reviewed commit: keyboard focus could move into the page hidden behind the open menu (see `01_thermo-nuclear-review.md`).

Lean: the change deletes the second copy of the links from all 11 pages and reuses the sidebar. It uses the platform's `inert` attribute and `matchMedia` instead of a focus-trap helper or a resize handler.

No test was added for opening and closing. The repo has no browser test harness, and the logic is one function with no branches worth one. The existing test now fails if a page forgets to load the script.

Not checked: a real phone, tablet widths, and the static GitHub Pages site. On a phone with JavaScript off there is no menu; the pages need JavaScript anyway.
