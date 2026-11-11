import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import test from 'node:test';
import vm from 'node:vm';

const web = new URL('../web/', import.meta.url);
const html = readFileSync(new URL('index.html', web), 'utf8');
const bootstrap = html.match(/<script>(.*?)<\/script>/is)[1];

function load(saved, systemDark, blocked = false) {
  const header = {append(button) { this.button = button; }};
  const context = vm.createContext({
    document: {
      documentElement: {dataset: {}},
      querySelector: () => header,
      createElement: () => ({
        append() {}, setAttribute() {},
        addEventListener(name, callback) { this[name] = callback; },
      }),
    },
    localStorage: {
      getItem() { if (blocked) throw new Error('Storage blocked'); return saved; },
      setItem(key, value) { if (blocked) throw new Error('Storage blocked'); saved = value; },
    },
    matchMedia: () => ({matches: systemDark}),
  });
  vm.runInContext(bootstrap, context);
  return {context, header, saved: () => saved};
}

test('every page applies the same authorized bootstrap before CSS and defers theme.js', () => {
  const hash = 'sha256-' + createHash('sha256').update(bootstrap).digest('base64');
  assert.ok(readFileSync(new URL('../app/dashboard.py', import.meta.url), 'utf8').includes(hash));
  for (const file of readdirSync(web).filter(file => file.endsWith('.html'))) {
    const head = readFileSync(new URL(file, web), 'utf8').split('</head>')[0];
    assert.equal(head.match(/<script>(.*?)<\/script>/is)[1], bootstrap, file);
    assert.ok(head.indexOf('<script>') < head.indexOf('href="style.css"'), file);
    assert.ok(head.includes('<script src="theme.js" defer></script>'), file);
    assert.ok(!head.includes('<script src="theme.js"></script>'), file);
  }
});

test('saved choices override the system; absent or invalid choices follow it', () => {
  for (const [saved, system, expected] of [
    ['dark', false, 'dark'], ['light', true, 'light'],
    [null, true, 'dark'], [null, false, 'light'], ['invalid', true, 'dark'],
  ]) {
    const {context} = load(saved, system);
    assert.equal(context.document.documentElement.dataset.theme, expected);
  }
});

test('deferred button toggles and saves the theme', () => {
  const state = load('dark', false);
  vm.runInContext(readFileSync(new URL('theme.js', web), 'utf8'), state.context);
  state.header.button.click();
  assert.equal(state.context.document.documentElement.dataset.theme, 'light');
  assert.equal(state.saved(), 'light');
  state.header.button.click();
  assert.equal(state.saved(), 'dark');
});

test('blocked storage still allows system selection and toggling', () => {
  const {context, header} = load(null, true, true);
  assert.equal(context.document.documentElement.dataset.theme, 'dark');
  vm.runInContext(readFileSync(new URL('theme.js', web), 'utf8'), context);
  header.button.click();
  assert.equal(context.document.documentElement.dataset.theme, 'light');
});
