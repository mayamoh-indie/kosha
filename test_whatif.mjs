// What-if rules for the Strategy page (web/whatif-data.js). Run with: node --test
// The browser scripts are classic scripts, so they are loaded into one sandbox the way the page loads them.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function load(finances) {
  const store = new Map(finances === undefined ? [] : [['kosha-finances-v1', JSON.stringify(finances)]]);
  const localStorage = {getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value),
    removeItem: key => store.delete(key)};
  const context = vm.createContext({localStorage});
  for (const file of ['store.js', 'expense-data.js', 'finance-data.js', 'whatif-data.js']) {
    vm.runInContext(readFileSync(new URL(`web/${file}`, import.meta.url), 'utf8'), context);
  }
  return code => vm.runInContext(code, context);
}

// Values made inside the sandbox have their own Array/Object prototypes; compare plain copies.
const plain = value => JSON.parse(JSON.stringify(value));
const paid = (months, interest) => ({status: 'paid_off', months, interest, message: ''});

test('spending less adds to the debt budget and spending more takes away, to the cent', () => {
  const whatIfBudget = load()('whatIfBudget');
  assert.equal(whatIfBudget('800', '150', 'less'), '950.00');
  assert.equal(whatIfBudget(800, '0.1', 'less'), '800.10');
  assert.equal(whatIfBudget('800.10', '0.20', 'more'), '799.90');
  assert.equal(whatIfBudget('800', '800', 'more'), '0.00');
});

test('amounts that are not money, zero, or more than the whole budget are rejected', () => {
  const whatIfBudget = load()('whatIfBudget');
  for (const amount of ['', 'abc', '-5', '1.001', '1e2']) assert.throws(() => whatIfBudget('800', amount, 'less'), /two decimal places/, amount);
  assert.throws(() => whatIfBudget('800', '0', 'less'), /outside the supported range/);
  assert.throws(() => whatIfBudget('800', '800.01', 'more'), /more than your whole debt budget/);
  assert.throws(() => whatIfBudget('abc', '50', 'less'), /monthly budget/);
});

test('outcome reports months and interest saved, lost, or a plan that stops paying off', () => {
  const whatIfOutcome = load()('whatIfOutcome');
  assert.deepEqual(plain(whatIfOutcome(paid(34, '2890.12'), paid(29, '2400.02'))), {kind: 'moved', months: 5, interestCents: 49010});
  assert.deepEqual(plain(whatIfOutcome(paid(29, '2400.02'), paid(34, '2890.12'))), {kind: 'moved', months: -5, interestCents: -49010});
  const stuck = {status: 'insufficient_budget', months: 0, interest: '0', message: 'Budget is below minimum payments.'};
  assert.deepEqual(plain(whatIfOutcome(paid(29, '2400.02'), stuck)), {kind: 'unpaid', broken: true, message: 'Budget is below minimum payments.'});
  assert.deepEqual(plain(whatIfOutcome(stuck, stuck)), {kind: 'unpaid', broken: false, message: 'Budget is below minimum payments.'});
  assert.deepEqual(plain(whatIfOutcome(stuck, paid(40, '3000'))), {kind: 'now_paid', months: 40});
});

test('guide uses last month\'s spending and this month\'s budget for one category', () => {
  const spendingGuide = load()('spendingGuide'), today = new Date(2026, 10, 10);
  const expenses = [{date: '2026-10-03', category: 'dining', cents: 4000}, {date: '2026-10-28', category: 'dining', cents: 2550},
    {date: '2026-10-05', category: 'groceries', cents: 9000}, {date: '2026-11-02', category: 'dining', cents: 700}];
  const budgets = [{month: '2026-11', category: 'dining', cents: 20000}, {month: '2026-10', category: 'groceries', cents: 30000}];
  assert.deepEqual(plain(spendingGuide(expenses, budgets, 'dining', today)), {spentCents: 6550, budgetCents: 20000});
  assert.deepEqual(plain(spendingGuide(expenses, budgets, 'groceries', today)), {spentCents: 9000, budgetCents: null});
  // January looks back to December of the year before.
  assert.equal(spendingGuide([{date: '2025-12-31', category: 'fun', cents: 500}], [], 'fun', new Date(2026, 0, 15)).spentCents, 500);
});

test('saved budgets that are malformed are ignored', () => {
  const good = {id: 'a', name: 'Food', month: '2026-11', category: 'groceries', cents: 40000};
  const bad = [null, 'text', {...good, category: 'constructor'}, {...good, cents: 1.5}, {...good, cents: -1}, {...good, month: 202611}];
  assert.deepEqual(plain(load({budgets: [good, ...bad]})('savedBudgets()')), [good]);
  assert.deepEqual(plain(load({budgets: 'nope'})('savedBudgets()')), []);
  assert.deepEqual(plain(load()('savedBudgets()')), []);
});
