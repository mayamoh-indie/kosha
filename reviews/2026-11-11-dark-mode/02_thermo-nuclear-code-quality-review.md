# thermo-nuclear-code-quality-review (maintainability)

- Reviewed SHA: `fcc78e88d568d4acf2745dc0a95d7dd22e9f4dcb`, scope `f441bdf...fcc78e8`
- Model: Claude Fable 5.2 (`claude-fable-5-2`), Claude Code
- Instructions: pstack `bc09365`, `plugins/pstack/skills/thermo-nuclear-code-quality-review/SKILL.md`

## Result

Approve, with one design trade-off stated plainly.

## The design choice: invert instead of a second palette

`web/style.css` uses 46 fixed colours across 86 lines, and the page scripts draw charts with fixed fills (`PALETTE`, axis strokes, legend swatches set through `style.background`). A conventional dark theme would turn those into variables and give each a dark value, touching most of the stylesheet and five scripts, and every new page or chart would need dark values too.

This change instead inverts `main` as a whole and rotates the hue so teals stay teal. That is five CSS rules. Charts, cards mixed from category colours, and anything added later follow with no extra work. The sidebar is already dark and is left alone.

What this costs:
- The dark colours are derived, not chosen. They looked right on every page checked, but a designer cannot set one of them without leaving this approach.
- The Home countdown card is dark in light mode, so it is inverted a second time. Because the inversion is 90%, the round trip is not exact and the card comes out a little lighter than in light mode.
- One exception rule exists (`.countdown`), and any future element that is dark in light mode would need the same.

The stylesheet says this in a `shortcut:` comment with the upgrade path (colour variables). For a portfolio prototype with one maintainer this is the simpler structure, and it can be replaced later without touching `theme.js` or the pages.

## `theme.js`

One self-contained function of 27 lines: read the choice, set `data-theme`, add the button. It defines no globals, so it cannot clash with the page scripts, which share one global scope. The button is created in script, so its markup lives in one place instead of 11 pages.

## The script tag is still copied into every page

Each page needed one new tag. That is the same per-page duplication noted in the sidebar-order review. A new test (`test_every_page_applies_the_theme_before_it_paints`) fails if a page is missed, which is the guard this repo already uses for the menu.

## Size

- `web/style.css` grows by 9 lines.
- No file approaches 1,000 lines.
- No conditionals were added to existing scripts.
