# Ponytail review

- Reviewed SHA: `fcc78e88d568d4acf2745dc0a95d7dd22e9f4dcb`, scope `f441bdf...fcc78e8`
- Model: Claude Fable 5.2 (`claude-fable-5-2`), Claude Code
- Instructions: Ponytail `96608e0`, `skills/ponytail/SKILL.md` (full mode) and `skills/ponytail-review/SKILL.md`

What this change does: every page gets a button in the top-right corner that switches between light and dark. The choice is remembered in this browser. If you have never chosen, the page follows your device's setting.

Looks good. Ship.

Checked: `theme.js` and where each page loads it; the dark rules in `style.css`; every page except RRSP withdrawal in dark mode in a browser, including phone width; the toggle saving and surviving a reload; the local server allowlist and its tests.

Two issues were found and fixed before the reviewed commit: the button's screen-reader name did not match its visible text, and a dark page would have printed as light text on white (see `01_thermo-nuclear-review.md`).

The dark colours come from inverting the page, which is a shortcut. It is marked in `style.css` with a `shortcut:` comment that names the limit and when to upgrade.

No test was added for the toggle itself. It is a few lines with no branching worth a test harness; the one test added guards the part that can silently break, a page that forgets to load the script.

Not checked: printing, a device whose system setting is dark, and the static GitHub Pages site.
