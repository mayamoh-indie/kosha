const $ = id => document.getElementById(id);
const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
const fullDate = date => date.toLocaleDateString('en-CA', {month: 'short', day: 'numeric', year: 'numeric'});
const dayKey = date => `${monthKey(date)}-${String(date.getDate()).padStart(2, '0')}`;
let plan, scheduled = [], records = [], shownMonth;

async function load() {
  let sample;
  ({plan, sample} = await loadPlan());
  const results = await calculatePlan(plan), result = results[plan.strategy] || results[0];
  const debts = Object.fromEntries(plan.debts.map(debt => [debt.name.trim(), debt]));
  scheduled = result.schedule.map(payment => {
    const date = planDate(plan, payment.month), debt = debts[payment.debt];
    return {key: `${payment.debt}|${monthKey(date)}`, debt: payment.debt, date, amount: payment.payment,
            category: categoryOf(debt), extra: Number(payment.payment) > Number(debt.minimum)};
  });
  records = readStore(PAYMENTS_KEY) || [];
  $('source').textContent = `Payments are due on day ${plan.pay_day} of each month${sample ? ' · fictional example' : ''}.`;
  const today = new Date(); shownMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  render();
}

const isPaid = item => records.some(record => record.key === item.key);

function render() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const open = scheduled.filter(item => !isPaid(item));
  const late = open.filter(item => item.date < today);
  const dates = [...new Set(open.filter(item => item.date >= today).map(item => item.date.getTime()))].slice(0, 2);
  const soon = open.filter(item => dates.includes(item.date.getTime()));
  $('upcoming').replaceChildren(...section('Past due', late, 'late'), ...section('Coming up', soon, ''));
  if (!late.length && !soon.length) $('upcoming').append(el('p', 'empty', 'Nothing due. Nice work.'));
  const done = [...records].sort((a, b) => b.paid_on.localeCompare(a.paid_on));
  $('complete').replaceChildren(...done.map(record => {
    const row = paymentRow({debt: record.debt, category: categoryOf({category: record.category}), extra: record.extra,
      amount: record.amount, when: `Paid ${fullDate(new Date(`${record.paid_on}T00:00`))} · due ${fullDate(new Date(`${record.due}T00:00`))}`});
    const undo = el('button', 'secondary', 'Undo'); undo.type = 'button';
    undo.addEventListener('click', () => { records = records.filter(other => other.key !== record.key); writeStore(PAYMENTS_KEY, records); render(); });
    row.append(undo); return row;
  }));
  if (!done.length) $('complete').append(el('p', 'empty', 'No payments recorded yet.'));
  drawCalendar(today);
}

function section(title, items, tone) {
  if (!items.length) return [];
  return [el('h3', `list-title ${tone}`, title), ...items.map(item => {
    const row = paymentRow({...item, when: fullDate(item.date), tone});
    const mark = el('button', 'secondary', 'Mark paid'); mark.type = 'button';
    mark.addEventListener('click', () => {
      records.push({key: item.key, debt: item.debt, category: item.category, extra: item.extra, amount: item.amount,
                    due: dayKey(item.date), paid_on: dayKey(new Date())});
      writeStore(PAYMENTS_KEY, records); render();
    });
    row.append(mark); return row;
  })];
}

function paymentRow({debt, category, extra, amount, when, tone = ''}) {
  const row = el('div', 'pay-row'), icon = el('span', 'pay-icon'); icon.innerHTML = iconSvg(category);
  icon.style.setProperty('--c', CATEGORIES[category].color);
  const text = el('div', 'pay-text'), name = el('strong', '', debt);
  name.append(el('span', extra ? 'tag extra' : 'tag', extra ? 'Extra' : 'Minimum'));
  text.append(name, el('span', `pay-date ${tone}`, when));
  row.append(icon, text, el('strong', 'pay-amount', money(amount)));
  return row;
}

function drawCalendar(today) {
  $('month-title').textContent = shownMonth.toLocaleDateString('en-CA', {month: 'long', year: 'numeric'});
  const first = shownMonth.getDay(), days = new Date(shownMonth.getFullYear(), shownMonth.getMonth() + 1, 0).getDate();
  const cells = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => el('b', 'weekday', day));
  for (let i = 0; i < first; i++) cells.push(el('div', 'day blank'));
  for (let day = 1; day <= days; day++) {
    const date = new Date(shownMonth.getFullYear(), shownMonth.getMonth(), day);
    const cell = el('div', 'day' + (date.getTime() === today.getTime() ? ' today' : '')); cell.append(el('span', 'day-number', day));
    const items = scheduled.filter(item => item.date.getTime() === date.getTime());
    for (const item of items.slice(0, 3)) {
      const status = isPaid(item) ? 'paid' : item.date < today ? 'late' : '';
      cell.append(el('span', `chip ${status}`, `${item.debt} ${money(item.amount)}`));
    }
    if (items.length > 3) cell.append(el('span', 'chip more', `+${items.length - 3} more`));
    cells.push(cell);
  }
  $('grid').replaceChildren(...cells);
}

for (const tab of document.querySelectorAll('[data-tab]')) tab.addEventListener('click', () => {
  for (const other of document.querySelectorAll('[data-tab]')) {
    other.setAttribute('aria-selected', String(other === tab)); $(other.dataset.tab).hidden = other !== tab;
  }
});
for (const [id, step] of [['prev', -1], ['next', 1]]) $(id).addEventListener('click', () => {
  shownMonth = new Date(shownMonth.getFullYear(), shownMonth.getMonth() + step, 1); drawCalendar(new Date(new Date().setHours(0, 0, 0, 0)));
});
load().catch(error => { $('error').textContent = error.message; });
