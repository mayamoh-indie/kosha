# Ponytail review

- Reviewed SHA: `a614e80dc427bd42e275dbbba02a53c33b324c47`, scope `main...a614e80`
- Model: Claude Opus 5.5 (`claude-opus-5-5`), Claude Code
- Instructions: Ponytail `96608e0`, `skills/ponytail/SKILL.md` (full mode) and `skills/ponytail-review/SKILL.md`

What this change does: on the Debts page and the debt worksheet, Home moves back to the top of the sidebar, matching every other page. A new test checks that every page shows its menu links in the same order, starting with Home.

Looks good. Ship.

Checked: both edited pages, the other nine pages' sidebars and all mobile menus (same order after the fix), and the planner's active link. I also confirmed the new test fails when the fix is reverted. Expected load is one person in a browser, so there is no scale concern.

Lean: none. The fix is two reordered lines, and the test is the one check this regression needs.

Not checked: the pages were not opened in a browser for this PR.
