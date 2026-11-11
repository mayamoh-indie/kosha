# thermo-nuclear-code-quality-review (maintainability)

- Reviewed SHA: `474273c83f64f6ac81d97b3ae348a9cd239fe6fd`, scope `92b2251...474273c`
- Model: Claude Fable 5.2 (`claude-fable-5-2`), Claude Code
- Instructions: pstack `bc09365`, `plugins/pstack/skills/thermo-nuclear-code-quality-review/SKILL.md`

## Result

Approve. The change is a regrouping of pages with no new logic.

## Structure

The sidebar goes from ten links to six on every page, and one page is deleted. The debt pages become a section with one landing page. No script changed: the two renames keep each script named after the page it runs (`debts.html` with `debts.js`, `debt-list.html` with `debt-list.js`).

## The debt row is copied into six pages

The row of links is static markup repeated in each debt page, with only the `aria-current` position differing. This is the same approach as the sidebar. The alternative is to build the row in a script, which would add a script to six pages and make the links depend on JavaScript. The copies are guarded instead: `test_debt_pages_link_to_each_other_in_the_same_order` fails if a page has a different list, links to a page without the row, or marks the wrong page as current. Left as is.

## Home is run by `finance.js`

`index.html` loads `finance.js` and `finance-data.js`. The names describe the module (accounts, income, budgets, goals), not the page, and the tests and `whatif-data.js` load `finance-data.js` by name. Renaming them would touch more files for no behaviour change. Left as is.

## Size

- `web/style.css` gains one line for the row.
- `tests/test_dashboard.py` gains one 10-line test.
- `app/dashboard.py` changes three entries in one list.
- No file approaches 1,000 lines.
