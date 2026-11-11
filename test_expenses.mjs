// Expense record rules (web/expense-data.js). Run with: node --test
// The browser scripts are classic scripts, so they are loaded into one sandbox the way the page loads them.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function load(saved) {
  const store = new Map(saved === undefined ? [] : [['kosha-expenses', JSON.stringify(saved)]]);
  const localStorage = {getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value),
    removeItem: key => store.delete(key)};
  const context = vm.createContext({localStorage});
  for (const file of ['store.js', 'expense-data.js']) vm.runInContext(readFileSync(new URL(`web/${file}`, import.meta.url), 'utf8'), context);
  const run = code => vm.runInContext(code, context);
  return {run, saved: () => JSON.parse(store.get('kosha-expenses'))};
}

// Values made inside the sandbox have their own Array/Object prototypes; compare plain copies.
const plain = value => JSON.parse(JSON.stringify(value));
const entry = (cents, date = '2026-11-03', category = 'groceries') => ({id: `${date}-${cents}`, date, description: '', category, cents});

test('form amounts become exact cents and totals add up exactly', () => {
  const {run} = load();
  const makeExpense = run('makeExpense'), sumCents = run('sumCents');
  const cents = ['0.1', '0.2', '142.37', '1800'].map(amount =>
    makeExpense({date: '2026-11-03', amount, description: '', category: 'groceries'}, 'id').expense.cents);
  assert.deepEqual(plain(cents), [10, 20, 14237, 180000]);
  assert.equal(sumCents(cents.map(value => ({cents: value}))), 194267);
});

test('bad form input is rejected with a message for each problem', () => {
  const makeExpense = load().run('makeExpense');
  for (const amount of ['', 'abc', '0', '-5', '1000000.01']) {
    assert.deepEqual(plain(makeExpense({date: '2026-11-03', amount, description: '', category: 'other'}, 'id').problems),
      ['Enter an amount between $0.01 and $1,000,000.'], amount);
  }
  assert.deepEqual(plain(makeExpense({date: '2026-02-31', amount: '5', description: '', category: 'constructor'}, 'id').problems),
    ['Choose a date.', 'Choose a category.']);
  const {expense} = makeExpense({date: '2026-11-03', amount: '1000000', description: `  ${'x'.repeat(90)} `, category: 'fun'}, 'id');
  assert.equal(expense.cents, 100000000);
  assert.equal(expense.description.length, 80);
});

test('unreadable saved entries are hidden but never dropped on save', () => {
  const bad = [null, 'text', {...entry(5), category: 'constructor'}, {...entry(5), cents: 1.5}, {...entry(5), date: '2026-13-01'}];
  const {run, saved} = load([entry(500), ...bad]);
  run('var loaded = loadExpenses()');
  assert.equal(run('loaded.expenses.length'), 1);
  assert.equal(run('loaded.unreadable.length'), bad.length);
  run(`saveExpenses([...loaded.expenses, ${JSON.stringify(entry(700))}], loaded.unreadable)`);
  assert.deepEqual(saved(), [...bad, entry(500), entry(700)]);
});

test('storage that is not a list loads as empty', () => {
  assert.equal(load({not: 'a list'}).run('loadExpenses().expenses.length'), 0);
  assert.equal(load().run('loadExpenses().unreadable.length'), 0);
});

test('monthly totals and category breakdown', () => {
  const {run} = load();
  const items = [entry(1000, '2026-10-31'), entry(250, '2026-11-01'), entry(400, '2026-11-30', 'housing'), entry(50, '2026-11-15')];
  const month = run('expensesIn')(items, new Date(2026, 10, 1));
  assert.deepEqual(plain(month.map(item => item.date)), ['2026-11-01', '2026-11-30', '2026-11-15']);
  assert.deepEqual(plain(run('totalsByCategory')(month)), [['housing', 400], ['groceries', 300]]);
});
