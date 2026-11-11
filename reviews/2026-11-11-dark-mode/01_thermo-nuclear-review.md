# thermo-nuclear-review (security and correctness)

- Reviewed SHA: `fcc78e88d568d4acf2745dc0a95d7dd22e9f4dcb`, scope `f441bdf...fcc78e8`
- Model: Claude Fable 5.2 (`claude-fable-5-2`), Claude Code
- Instructions: pstack `bc09365`, `plugins/pstack/skills/thermo-nuclear-review/SKILL.md`

## Result

No open findings. Two low-to-medium findings were found during review and fixed in the reviewed commit.

## Fixed: accessible name did not contain the visible text (medium, accessibility)

The first draft of `web/theme.js` set `aria-label="Dark mode"` with `aria-pressed`, while the visible text changed to "Light mode" when dark was on. The accessible name then did not contain the visible label, which breaks voice-control commands that use the on-screen words. The label and pressed state were removed. The button text is now "Dark mode" or "Light mode", naming the theme a click switches to, and the icon is in an `aria-hidden` span.

## Fixed: dark pages would print unreadable (low)

`[data-theme=dark] main` uses `filter: invert(.9) hue-rotate(180deg)`. Browsers leave out backgrounds when printing by default, so the dark body background would be dropped while the filter still turned text light. `@media print` now sets `filter: none` for `main` and `.countdown`. Printing itself was not tested.

## What was traced

**Stored value.** `kosha-theme` is read inside `try/catch` and used only if it is exactly `dark` or `light`. Anything else falls back to the system setting. The value is assigned to `dataset.theme` and never placed in markup.

**Script loading.** `theme.js` is a plain script in `<head>`, so it runs before the body exists and only touches `document.documentElement` at that point. The button is added on `DOMContentLoaded`. The local server's content security policy is `script-src 'self'`, and the file is same-origin with no inline code. It is added to the server's file allowlist and the served-file test. A new test fails if any page lacks the tag or adds `defer`.

**Every page has a header.** The button is appended to `document.querySelector('header')`. All 11 pages in `web/` contain exactly one `<header>`. The repo-root `index.html` redirect does not load `theme.js`.

**Filter side effects.** A filter makes its element the containing block for fixed-position descendants. `main` has none: the sidebar and the storage warning are outside `main`. The storage warning keeps its own amber colours in both themes. The sticky table header inside `.table-wrap` is unaffected.

**Form controls.** The root gets `color-scheme: dark` so the page scrollbar is dark, and `main` is set back to `color-scheme: light` so native controls are not darkened and then inverted to light.

**Layout.** `header .pill{margin-left:auto}` keeps the pill and the new button together on the right. Checked at desktop width and at 375px.

**Existing behaviour.** With `data-theme="light"` no new rule applies except the header spacing, so light mode is unchanged. Note the behaviour change for people whose system is set to dark: they now get dark mode on first visit. This is intended and documented in the README.

**Devex and feature gates.** No new commands, ports or dependencies. The repo has no feature gates.

**PR discussion.** No PR existed when this review ran.
