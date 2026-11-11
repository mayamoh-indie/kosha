// Expense records and their rules, kept free of page code so test_expenses.mjs can check them.
// Entries stay in this browser's localStorage; nothing is sent anywhere.
// Amounts are whole cents so totals add up exactly.
const EXPENSES_KEY = 'kosha-expenses', MAX_CENTS = 100000000, MAX_DESCRIPTION = 80;
// Icons are fixed markup, never user input.
const EXPENSE_CATEGORIES = {
  groceries: {label: 'Groceries', color: '#397d70', icon: '<path d="M3 4h2l2 11h11l2-8H6"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>'},
  housing: {label: 'Housing', color: '#0f3440', icon: '<path d="M3 11l9-7 9 7M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>'},
  bills: {label: 'Bills and utilities', color: '#1a4f61', icon: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>'},
  transport: {label: 'Transport', color: '#3d7fa3', icon: '<path d="M3 16v-4l2-5h14l2 5v4z"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>'},
  dining: {label: 'Dining out', color: '#69a8a9', icon: '<path d="M7 2v20M4 2v6a3 3 0 006 0V2M17 2c-2 2-3 5-3 8h3v12"/>'},
  health: {label: 'Health', color: '#5b7d9e', icon: '<path d="M12 21s-8-5-8-11a4.5 4.5 0 018-3 4.5 4.5 0 018 3c0 6-8 11-8 11z"/>'},
  shopping: {label: 'Shopping', color: '#2f6f88', icon: '<path d="M6 7h12l1 14H5zM9 7a3 3 0 016 0"/>'},
  fun: {label: 'Entertainment', color: '#4f9a8f', icon: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l6-3.5z"/>'},
  other: {label: 'Other', color: '#8aa7ad', icon: '<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>'},
};

const dayKey = date => `${monthKey(date)}-${String(date.getDate()).padStart(2, '0')}`;
const isDay = text => /^\d{4}-\d{2}-\d{2}$/.test(text) && dayKey(new Date(`${text}T00:00`)) === text;
const isCategory = key => Object.hasOwn(EXPENSE_CATEGORIES, key);
const toCents = text => Math.round(Number(text) * 100);
const validCents = cents => Number.isInteger(cents) && cents > 0 && cents <= MAX_CENTS;

const isExpense = item => item !== null && typeof item === 'object' && typeof item.id === 'string' && isDay(item.date)
  && typeof item.description === 'string' && item.description.length <= MAX_DESCRIPTION && isCategory(item.category)
  && validCents(item.cents);

// Form input → {expense} or {problems}. The description is trimmed and cut to the maximum length.
function makeExpense({date, amount, description, category}, id) {
  const cents = toCents(amount);
  const problems = [!isDay(date) && 'Choose a date.', !isCategory(category) && 'Choose a category.',
    !validCents(cents) && 'Enter an amount between $0.01 and $1,000,000.'].filter(Boolean);
  if (problems.length) return {problems};
  return {expense: {id, date, description: String(description).trim().slice(0, MAX_DESCRIPTION), category, cents}};
}

// Stored data is untrusted. Entries that can't be read are kept as they are, so saving never drops them.
function loadExpenses() {
  const stored = readStore(EXPENSES_KEY), list = Array.isArray(stored) ? stored : [];
  return {expenses: list.filter(isExpense), unreadable: list.filter(item => !isExpense(item))};
}
const saveExpenses = (expenses, unreadable) => writeStore(EXPENSES_KEY, [...unreadable, ...expenses]);

const sumCents = items => items.reduce((total, item) => total + item.cents, 0);
const expensesIn = (expenses, date) => expenses.filter(item => item.date.startsWith(monthKey(date)));
// [category, cents] for categories with spending, largest first.
const totalsByCategory = items => Object.keys(EXPENSE_CATEGORIES)
  .map(key => [key, sumCents(items.filter(item => item.category === key))])
  .filter(([, cents]) => cents).sort((a, b) => b[1] - a[1]);
