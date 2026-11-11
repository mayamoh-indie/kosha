// Expenses page: the form, the monthly list, and totals. Record rules live in expense-data.js.
const $ = id => document.getElementById(id);
const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
const dollars = cents => money(cents / 100);
const labelOf = key => EXPENSE_CATEGORIES[key].label;
const titleOf = item => item.description || labelOf(item.category);
const icon = key => {
  const node = el('span', 'pay-icon'); node.style.setProperty('--c', EXPENSE_CATEGORIES[key].color);
  node.innerHTML = svgIcon(EXPENSE_CATEGORIES[key].icon);
  return node;
};

let {expenses, unreadable} = loadExpenses();
let shown = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
const save = () => saveExpenses(expenses, unreadable);

function render() {
  const items = expensesIn(expenses, shown).sort((a, b) => b.date.localeCompare(a.date)), total = sumCents(items);
  const name = shown.toLocaleDateString('en-CA', {month: 'long', year: 'numeric'});
  $('month-title').textContent = name;
  $('total-label').textContent = `Spent in ${name}`;
  $('total').textContent = dollars(total);
  $('previous').textContent = dollars(sumCents(expensesIn(expenses, new Date(shown.getFullYear(), shown.getMonth() - 1, 1))));
  $('count').textContent = items.length;
  $('expense-list').replaceChildren(...items.map(item => {
    const row = el('div', 'pay-row'), text = el('div', 'pay-text');
    const day = new Date(`${item.date}T00:00`).toLocaleDateString('en-CA', {month: 'short', day: 'numeric'});
    text.append(el('strong', '', titleOf(item)), el('span', 'pay-date', `${day} · ${labelOf(item.category)}`));
    const remove = el('button', 'secondary', 'Delete'); remove.type = 'button';
    remove.setAttribute('aria-label', `Delete ${titleOf(item)}, ${dollars(item.cents)}`);
    remove.addEventListener('click', () => { expenses = expenses.filter(other => other.id !== item.id); save(); render(); });
    row.append(icon(item.category), text, el('strong', 'pay-amount', dollars(item.cents)), remove);
    return row;
  }));
  if (!items.length) $('expense-list').append(el('p', 'empty', 'No expenses logged this month.'));
  const totals = totalsByCategory(items);
  $('by-category').replaceChildren(...totals.map(([key, cents]) => {
    const row = el('div', 'spend-row'), share = cents / total;
    row.style.setProperty('--c', EXPENSE_CATEGORIES[key].color); row.style.setProperty('--p', `${(share * 100).toFixed(1)}%`);
    const top = el('div', 'spend-top'), label = el('span', 'spend-label');
    label.append(icon(key), labelOf(key));
    top.append(label, el('strong', '', `${dollars(cents)} · ${Math.round(share * 100)}%`));
    const bar = el('div', 'bar'); bar.append(el('span'));
    row.append(top, bar); return row;
  }));
  if (!totals.length) $('by-category').append(el('p', 'empty', 'Nothing to show yet.'));
}

$('category').append(...Object.keys(EXPENSE_CATEGORIES).map(key => { const option = el('option', '', labelOf(key)); option.value = key; return option; }));
$('date').value = dayKey(new Date());
if (unreadable.length) {
  $('unreadable').textContent = `${unreadable.length} saved ${unreadable.length === 1 ? 'entry' : 'entries'} couldn’t be read and ${unreadable.length === 1 ? 'is' : 'are'} hidden. ${unreadable.length === 1 ? 'It stays' : 'They stay'} saved in this browser.`;
}
$('expense-form').addEventListener('submit', event => {
  event.preventDefault();
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const {expense, problems = []} = makeExpense({date: $('date').value, amount: $('amount').value,
    description: $('description').value, category: $('category').value}, id);
  $('error').textContent = problems.join('\n');
  if (!expense) return;
  expenses.push(expense); save();
  const [year, month] = expense.date.split('-').map(Number); shown = new Date(year, month - 1, 1);
  $('amount').value = ''; $('description').value = ''; $('amount').focus();
  render();
});
for (const [id, step] of [['prev', -1], ['next', 1]]) $(id).addEventListener('click', () => {
  shown = new Date(shown.getFullYear(), shown.getMonth() + step, 1); render();
});
render();
