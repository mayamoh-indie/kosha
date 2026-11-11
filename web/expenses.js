// Expense log. Entries stay in this browser's localStorage; nothing is sent anywhere.
// Amounts are whole cents so monthly totals add up exactly.
const EXPENSES_KEY = 'kosha-expenses', MAX_CENTS = 100000000;
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
const $ = id => document.getElementById(id);
const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
const icon = key => {
  const node = el('span', 'pay-icon'); node.style.setProperty('--c', EXPENSE_CATEGORIES[key].color);
  node.innerHTML = `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${EXPENSE_CATEGORIES[key].icon}</svg>`;
  return node;
};
const dayKey = date => `${monthKey(date)}-${String(date.getDate()).padStart(2, '0')}`;
const isDay = text => /^\d{4}-\d{2}-\d{2}$/.test(text) && dayKey(new Date(`${text}T00:00`)) === text;
const dollars = cents => money(cents / 100);
const titleOf = item => item.description || EXPENSE_CATEGORIES[item.category].label;

// Stored data is untrusted: keep only well-formed entries. All text is rendered with textContent.
const isExpense = item => item !== null && typeof item === 'object' && typeof item.id === 'string' && isDay(item.date)
  && typeof item.description === 'string' && item.description.length <= 80 && Object.hasOwn(EXPENSE_CATEGORIES, item.category)
  && Number.isInteger(item.cents) && item.cents > 0 && item.cents <= MAX_CENTS;
const stored = readStore(EXPENSES_KEY);
let expenses = Array.isArray(stored) ? stored.filter(isExpense) : [];
let shown = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
const save = () => writeStore(EXPENSES_KEY, expenses);
const inMonth = date => expenses.filter(item => item.date.startsWith(monthKey(date)));
const sum = items => items.reduce((total, item) => total + item.cents, 0);

function render() {
  const items = inMonth(shown).sort((a, b) => b.date.localeCompare(a.date)), total = sum(items);
  const name = shown.toLocaleDateString('en-CA', {month: 'long', year: 'numeric'});
  $('month-title').textContent = name;
  $('total-label').textContent = `Spent in ${name}`;
  $('total').textContent = dollars(total);
  $('previous').textContent = dollars(sum(inMonth(new Date(shown.getFullYear(), shown.getMonth() - 1, 1))));
  $('count').textContent = items.length;
  $('expense-list').replaceChildren(...items.map(item => {
    const row = el('div', 'pay-row'), text = el('div', 'pay-text'), label = EXPENSE_CATEGORIES[item.category].label;
    const day = new Date(`${item.date}T00:00`).toLocaleDateString('en-CA', {month: 'short', day: 'numeric'});
    text.append(el('strong', '', titleOf(item)), el('span', 'pay-date', `${day} · ${label}`));
    const remove = el('button', 'secondary', 'Delete'); remove.type = 'button';
    remove.setAttribute('aria-label', `Delete ${titleOf(item)}, ${dollars(item.cents)}`);
    remove.addEventListener('click', () => { expenses = expenses.filter(other => other.id !== item.id); save(); render(); });
    row.append(icon(item.category), text, el('strong', 'pay-amount', dollars(item.cents)), remove);
    return row;
  }));
  if (!items.length) $('expense-list').append(el('p', 'empty', 'No expenses logged this month.'));
  const totals = Object.keys(EXPENSE_CATEGORIES).map(key => [key, sum(items.filter(item => item.category === key))])
    .filter(([, cents]) => cents).sort((a, b) => b[1] - a[1]);
  $('by-category').replaceChildren(...totals.map(([key, cents]) => {
    const row = el('div', 'spend-row'), share = cents / total;
    row.style.setProperty('--c', EXPENSE_CATEGORIES[key].color); row.style.setProperty('--p', `${(share * 100).toFixed(1)}%`);
    const top = el('div', 'spend-top'), label = el('span', 'spend-label');
    label.append(icon(key), EXPENSE_CATEGORIES[key].label);
    top.append(label, el('strong', '', `${dollars(cents)} · ${Math.round(share * 100)}%`));
    const bar = el('div', 'bar'); bar.append(el('span'));
    row.append(top, bar); return row;
  }));
  if (!totals.length) $('by-category').append(el('p', 'empty', 'Nothing to show yet.'));
}

$('category').append(...Object.entries(EXPENSE_CATEGORIES).map(([key, {label}]) => { const option = el('option', '', label); option.value = key; return option; }));
$('date').value = dayKey(new Date());
$('expense-form').addEventListener('submit', event => {
  event.preventDefault();
  const date = $('date').value, category = $('category').value, description = $('description').value.trim().slice(0, 80);
  const cents = Math.round(Number($('amount').value) * 100);
  const problems = [!isDay(date) && 'Choose a date.', !Object.hasOwn(EXPENSE_CATEGORIES, category) && 'Choose a category.',
    !(cents > 0 && cents <= MAX_CENTS) && 'Enter an amount between $0.01 and $1,000,000.'].filter(Boolean);
  $('error').textContent = problems.join('\n');
  if (problems.length) return;
  expenses.push({id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`, date, description, category, cents});
  save();
  const [year, month] = date.split('-').map(Number); shown = new Date(year, month - 1, 1);
  $('amount').value = ''; $('description').value = ''; $('amount').focus();
  render();
});
for (const [id, step] of [['prev', -1], ['next', 1]]) $(id).addEventListener('click', () => {
  shown = new Date(shown.getFullYear(), shown.getMonth() + step, 1); render();
});
render();
