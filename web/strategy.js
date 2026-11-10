const $ = id => document.getElementById(id);
let plan, results = [], view = 'split', revision = 0, timer;
const duration = months => months >= 12 ? `${Math.floor(months / 12)} yr ${months % 12} mo` : `${months} mo`;

async function load() {
  ({plan} = await loadPlan());
  $('pay-day').append(...Array.from({length: 28}, (_, i) => new Option(`Day ${i + 1} of each month`, i + 1)));
  $('pay-day').value = plan.pay_day; $('budget').value = plan.monthly_budget;
  plan.extra_payments.forEach(addExtra);
  await update(false);
}

function addExtra(payment = {month: '', amount: ''}) {
  const row = document.createElement('div'); row.className = 'extra-row';
  row.innerHTML = '<label>Month<input name="month" type="month" required></label><label>Amount (CAD)<input name="amount" type="number" min="0.01" step="0.01" required></label><button class="remove" type="button">Remove</button>';
  row.querySelector('[name=month]').value = payment.month; row.querySelector('[name=amount]').value = payment.amount;
  row.querySelector('button').addEventListener('click', () => { row.remove(); schedule(); });
  $('extras').append(row);
}

function draft() {
  const extras = [...$('extras').children].map(row => ({month: row.querySelector('[name=month]').value, amount: row.querySelector('[name=amount]').value}));
  return {...plan, pay_day: Number($('pay-day').value), monthly_budget: $('budget').value, extra_payments: extras.filter(extra => extra.month || extra.amount)};
}

const schedule = () => { clearTimeout(timer); timer = setTimeout(update, 350); };

// Recalculate with the form's values and save them once they are valid.
async function update(persist = true) {
  const next = draft(), version = ++revision;
  $('error').textContent = '';
  const minimums = next.debts.reduce((sum, debt) => sum + (Number(debt.balance) ? Number(debt.minimum) : 0), 0);
  $('minimums').textContent = money(minimums);
  $('extra').textContent = money(Math.max(0, Number(next.monthly_budget) - minimums));
  const early = next.extra_payments.find(extra => !extra.month || offsetOf(next, extra.month) < 1);
  if (early) { $('error').textContent = `Choose a month after ${planMonth(next, 0)} for each one-time payment.`; return; }
  try {
    const data = await calculatePlan(next);
    if (version !== revision) return;
    plan = next; results = data;
    if (persist) savePlan(plan);
    render();
  } catch (error) { if (version === revision) $('error').textContent = error.message; }
}

function render() {
  const result = results[plan.strategy] || results[0];
  $('priorities').replaceChildren(...results.map((option, i) => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'plan' + (i === plan.strategy ? ' selected' : '');
    button.setAttribute('role', 'radio'); button.setAttribute('aria-checked', String(i === plan.strategy));
    const title = document.createElement('span'); title.textContent = STRATEGIES[option.strategy];
    const months = document.createElement('strong'); months.textContent = option.status === 'paid_off' ? duration(option.months) : 'No payoff';
    const cost = document.createElement('small'); cost.textContent = `${money(option.interest)} interest`;
    button.append(title, months, cost);
    button.addEventListener('click', () => { plan.strategy = i; savePlan(plan); render(); });
    return button;
  }));
  if (result.status !== 'paid_off') $('error').textContent = result.message;
  const payoff = Object.values(payoffMonths(result)), first = result.schedule.filter(payment => payment.month === 1);
  const sum = (rows, key) => rows.reduce((total, row) => total + Number(row[key]), 0);
  $('summary-rows').replaceChildren(...[
    ['Payoff', 'Next debt', payoff.length ? duration(Math.min(...payoff)) : '–', 'All debts', result.status === 'paid_off' ? duration(result.months) : '–'],
    ['Interest', 'Next month', money(sum(first, 'interest')), 'Total', money(result.interest)],
    ['Payments', 'Next month', money(sum(first, 'payment')), 'Total', money(result.paid)],
  ].map(([title, ...cells]) => {
    const row = document.createElement('div'); row.className = 'summary-row';
    const heading = document.createElement('strong'); heading.textContent = title; row.append(heading);
    for (let i = 0; i < cells.length; i += 2) {
      const cell = document.createElement('span'); cell.textContent = cells[i];
      const value = document.createElement('b'); value.textContent = cells[i + 1]; cell.append(value); row.append(cell);
    }
    return row;
  }));
  drawPayments(result);
}

function drawPayments(result) {
  const minimums = Object.fromEntries(plan.debts.map(debt => [debt.name.trim(), Number(debt.minimum)]));
  const last = Math.max(0, ...result.schedule.map(payment => payment.month));
  if (!last) { $('payments-chart').innerHTML = '<p class="empty">No payments to chart.</p>'; $('payments-legend').replaceChildren(); return; }
  const months = Array.from({length: last}, () => [0, 0]);
  for (const payment of result.schedule) {
    const amount = Number(payment.payment), lower = view === 'split' ? Math.min(amount, minimums[payment.debt]) : amount - Number(payment.interest);
    months[payment.month - 1][0] += lower; months[payment.month - 1][1] += amount - lower;
  }
  const colors = view === 'split' ? ['#1a4f61', '#a8d5e2'] : ['#397d70', '#a8d5e2'];
  const labels = view === 'split' ? ['Minimum', 'Extra'] : ['Principal', 'Interest'];
  const top = Math.max(...months.map(([a, b]) => a + b), 1), width = 300 / last;
  const y = value => 150 - value / top * 130;
  const bars = months.map(([a, b], i) => `<rect x="${(40 + i * width).toFixed(2)}" y="${y(a).toFixed(1)}" width="${Math.max(width - .6, .6).toFixed(2)}" height="${(150 - y(a)).toFixed(1)}" fill="${colors[0]}"/><rect x="${(40 + i * width).toFixed(2)}" y="${y(a + b).toFixed(1)}" width="${Math.max(width - .6, .6).toFixed(2)}" height="${(y(a) - y(a + b)).toFixed(1)}" fill="${colors[1]}"/>`).join('');
  const dots = Object.values(payoffMonths(result)).map(month => `<circle cx="${(40 + (month - .5) * width).toFixed(1)}" cy="12" r="3.5" fill="#0f3440"/>`).join('');
  const ticks = [1, Math.ceil(last / 2), last].filter((month, i, all) => all.indexOf(month) === i).map(month => `<text x="${(40 + (month - .5) * width).toFixed(1)}" y="166" text-anchor="middle">${planMonth(plan, month)}</text>`).join('');
  // Only calculated numbers, fixed colours, and dates enter this markup.
  $('payments-chart').innerHTML = `<svg viewBox="0 0 350 172" role="img" aria-label="Payments by month for ${last} months"><line x1="40" x2="340" y1="150" y2="150" stroke="#cfdcd8"/><text x="34" y="24" text-anchor="end">${Math.round(top).toLocaleString('en-CA')}</text><text x="34" y="153" text-anchor="end">0</text>${bars}${dots}${ticks}</svg>`;
  $('payments-legend').replaceChildren(...[...labels.map((label, i) => [label, colors[i]]), ['Debt paid off', '#0f3440']].map(([label, color]) => {
    const item = document.createElement('span'), swatch = document.createElement('i'); swatch.style.background = color; item.append(swatch, label); return item;
  }));
}

for (const tab of document.querySelectorAll('[data-view]')) tab.addEventListener('click', () => {
  view = tab.dataset.view;
  for (const other of document.querySelectorAll('[data-view]')) other.setAttribute('aria-selected', String(other === tab));
  if (results.length) drawPayments(results[plan.strategy] || results[0]);
});
$('budget').addEventListener('input', schedule);
$('pay-day').addEventListener('change', schedule);
$('extras').addEventListener('input', schedule);
$('add-extra').addEventListener('click', () => { addExtra(); $('extras').lastChild.querySelector('input').focus(); });
load().catch(error => { $('error').textContent = error.message; });
