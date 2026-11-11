const $ = id => document.getElementById(id);
const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
const fullDate = (plan, offset) => planDate(plan, offset).toLocaleDateString('en-CA', {month: 'short', day: 'numeric', year: 'numeric'});

async function load() {
  const {plan, sample} = await loadPlan();
  const results = await calculatePlan(plan), result = results[plan.strategy] || results[0];
  $('source').textContent = `${STRATEGIES[result.strategy]} · ${money(plan.monthly_budget)} a month${sample ? ' · fictional example' : ''}.`;
  if (result.status !== 'paid_off') $('error').textContent = result.message;
  $('steps').replaceChildren(...steps(plan, result).map((step, i) => renderStep(plan, step, i)));
  if (!result.schedule.length) $('steps').innerHTML = '<p class="empty">No debt left to plan. You’re debt-free.</p>';
}

// A step runs from the month after the previous payoff through the next payoff month.
function steps(plan, result) {
  const payoff = payoffMonths(result), minimums = Object.fromEntries(plan.debts.map(debt => [debt.name.trim(), Number(debt.minimum)]));
  const last = Math.max(0, ...result.schedule.map(payment => payment.month));
  const ends = [...new Set([...Object.values(payoff), last])].filter(month => month > 0).sort((a, b) => a - b);
  return ends.map((end, i) => {
    const start = i ? ends[i - 1] + 1 : 1, rows = result.schedule.filter(payment => payment.month >= start && payment.month <= end);
    const first = rows.filter(payment => payment.month === start);
    return {start, end, rows, active: first.length,
      extra: first.filter(payment => Number(payment.payment) > minimums[payment.debt]).map(payment => payment.debt),
      paid: Object.keys(payoff).filter(name => payoff[name] === end)};
  });
}

function renderStep(plan, step, index) {
  const card = el('article', 'step');
  const head = el('div', 'step-head'), badge = el('div', 'step-badge');
  badge.append(el('strong', '', `STEP ${index + 1}`), el('span', '', `${step.active} to go`));
  const months = step.end - step.start + 1, when = el('div', 'step-when');
  when.append(el('span', '', `Completes ${fullDate(plan, step.end)}`), el('small', '', `${months} month${months === 1 ? '' : 's'}`));
  head.append(badge, when); card.append(head);
  for (const name of step.paid) {
    const trophy = el('div', 'milestone'); trophy.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8"/></svg>';
    const text = el('div'); text.append(el('strong', '', `${name} paid off`), el('span', '', fullDate(plan, step.end)));
    trophy.append(text); card.append(trophy);
  }
  const list = el('ul', 'step-list');
  for (const name of step.extra) { const item = el('li', '', name); item.append(el('span', 'tag extra', 'Extra')); list.append(item); }
  const minimumOnly = step.active - step.extra.length;
  if (minimumOnly > 0) { const item = el('li', '', `${minimumOnly} debt${minimumOnly === 1 ? '' : 's'}`); item.append(el('span', 'tag', 'Minimum')); list.append(item); }
  card.append(list);
  const details = el('details', 'step-details'); details.append(el('summary', '', 'Monthly payments'));
  const table = el('table'); table.innerHTML = '<thead><tr><th>Date</th><th>Debt</th><th>Payment</th><th>Balance</th></tr></thead>';
  const body = el('tbody');
  for (const payment of step.rows) {
    const row = el('tr');
    for (const value of [fullDate(plan, payment.month), payment.debt, money(payment.payment), money(payment.balance)]) row.append(el('td', '', value));
    body.append(row);
  }
  table.append(body); details.append(table); card.append(details);
  return card;
}

load().catch(error => { $('error').textContent = error.message; });
