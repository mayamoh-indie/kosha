# thermo-nuclear-code-quality-review (maintainability)

- Reviewed SHA: `a614e80dc427bd42e275dbbba02a53c33b324c47`, scope `main...a614e80`
- Model: Claude Opus 5.5 (`claude-opus-5-5`), Claude Code
- Instructions: pstack `bc09365`, `plugins/pstack/skills/thermo-nuclear-code-quality-review/SKILL.md`

## Result

Approve. No structural regression is added. One structural issue that already existed is recorded as a follow-up.

## The root cause is duplicated menu markup

The bug exists because each of the 11 files in `web/*.html` holds its own copy of the sidebar and the mobile menu. When `finance.html` and `growth.html` were added, two copies were updated with the links in a different place. The code-judo move would be one shared source for the menu, for example a small script that builds both menus from one list and marks the current page. That would delete about 20 copies of the same markup.

I did not ask for it in this PR, for three reasons:
- It touches every page and changes how each one loads.
- Without JavaScript the pages would have no menu, which matters on these mostly static pages.
- AGENTS.md asks for one focused change per PR.

It is a reasonable separate change if the menu keeps growing.

## The test makes the rule structural

`test_every_page_lists_navigation_in_the_same_order` checks the real rule ("one order everywhere, Home first") instead of a hard-coded list. A future page can therefore add a link without editing the test, but it can't add the link to only some pages. The helper `links` is local to the test and used twice. There are no casts, flags or new branches in shared code.

## Size and layering

- `test_dashboard.py` grows by 15 lines, to well under 100 lines in the class.
- No production file changes size.
- No logic moves between layers.
