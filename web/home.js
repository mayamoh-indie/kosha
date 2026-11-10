const $ = id => document.getElementById(id);
const money = value => new Intl.NumberFormat('en-CA', {style:'currency',currency:'CAD'}).format(Number(value));
const strategies = ['Highest interest first', 'Smallest balance first', 'Your entered order'];
// Month 1 of the plan is the next calendar month.
const monthLabel = offset => { const date = new Date(); date.setDate(1); date.setMonth(date.getMonth() + offset); return date.toLocaleDateString('en-CA', {month:'short', year:'numeric'}); };

function savedPlan() {
  try { return JSON.parse(localStorage.getItem('kosha-plan')); } catch { return null; }
}

async function load() {
  let plan = savedPlan();
  const sample = !plan;
  if (sample) {
    const response = await fetch('sample-debts.json');
    if (!response.ok) throw new Error('Sample data unavailable.');
    plan = {...await response.json(), strategy: 0};
  }
  $('source').textContent = sample ? 'Showing a fictional example. Add your own debts in the Debt planner.' : 'Your saved plan, kept only in this browser.';
  $('clear').hidden = sample;
  const response = await api('/calculate', {debts: plan.debts, monthly_budget: plan.monthly_budget});
  if (!response.ok) throw new Error(response.data.error || 'Unable to calculate this plan.');
  render(plan.debts, response.data[plan.strategy] || response.data[0]);
}

function render(debts, result) {
  const balance = debts.reduce((sum, debt) => sum + Number(debt.balance), 0);
  const original = debts.reduce((sum, debt) => sum + Math.max(Number(debt.original) || 0, Number(debt.balance)), 0);
  const share = original ? (original - balance) / original : 1;
  $('paid').textContent = money(original - balance);
  $('balance').textContent = money(balance);
  $('interest').textContent = money(result.interest);
  $('ring').innerHTML = `<svg viewBox="0 0 120 120" role="img" aria-label="${Math.round(share * 100)}% paid"><circle cx="60" cy="60" r="50" fill="none" stroke="#e8f4f7" stroke-width="12"/><circle cx="60" cy="60" r="50" fill="none" stroke="#1a4f61" stroke-width="12" stroke-linecap="round" pathLength="100" stroke-dasharray="${(share * 100).toFixed(1)} 100" transform="rotate(-90 60 60)"/><text x="60" y="62" text-anchor="middle" class="ring-value">${(share * 100).toFixed(1)}%</text><text x="60" y="80" text-anchor="middle">paid</text></svg>`;
  $('plan-label').textContent = strategies[['avalanche', 'snowball', 'custom'].indexOf(result.strategy)];
  if (result.status === 'paid_off') {
    $('target').textContent = result.months ? `${monthLabel(result.months).toUpperCase()}` : 'DEBT-FREE TODAY';
    $('years').textContent = Math.floor(result.months / 12);
    $('months').textContent = result.months % 12;
  } else {
    $('target').textContent = 'NOT YET IN REACH';
    $('years').textContent = $('months').textContent = '–';
    $('error').textContent = result.message;
  }
  current = {debts, result};
  drawTimeline();
  renderCategories();
}

let current, view = 'total';
const palette = ['#0f3440', '#397d70', '#3d7fa3', '#69a8a9', '#1a4f61', '#a8d5e2', '#5b7d9e', '#8aa7ad'];

// Monthly closing balance per debt; month 0 is today's balance.
function balancesByDebt() {
  const last = Math.max(0, ...current.result.schedule.map(payment => payment.month));
  const rows = new Map(current.debts.map(debt => [debt.name.trim(), Array.from({length: last + 1}, (_, i) => i ? 0 : Number(debt.balance))]));
  for (const payment of current.result.schedule) rows.get(payment.debt)[payment.month] = Number(payment.balance);
  return rows;
}

function series() {
  const rows = balancesByDebt(), values = [...rows.values()];
  if (view === 'debt') return current.debts.map((debt, i) => ({label: debt.name, color: palette[i % palette.length], values: rows.get(debt.name.trim())}));
  if (view === 'total') return [{label: 'Total', color: '#1a4f61', values: values[0].map((_, m) => values.reduce((sum, row) => sum + row[m], 0))}];
  const groups = new Map();
  for (const debt of current.debts) {
    const key = categoryOf(debt), row = rows.get(debt.name.trim());
    if (!groups.has(key)) groups.set(key, {label: CATEGORIES[key].label, color: CATEGORIES[key].color, values: row.map(() => 0)});
    row.forEach((value, m) => { groups.get(key).values[m] += value; });
  }
  return [...groups.values()];
}

function drawTimeline() {
  const layers = series(), last = layers[0] ? layers[0].values.length - 1 : 0;
  $('legend').replaceChildren();
  if (last < 1) { $('timeline').innerHTML = '<p class="empty">No balance left to chart.</p>'; return; }
  const stacked = layers.map((_, i) => layers[0].values.map((__, m) => layers.slice(0, i + 1).reduce((sum, layer) => sum + layer.values[m], 0)));
  const top = Math.max(...stacked.at(-1), 1);
  const x = i => 70 + i / last * 610, y = value => 190 - value / top * 165;
  const line = values => values.map((value, i) => `${x(i).toFixed(1)},${y(value).toFixed(1)}`);
  const grid = [0, .25, .5, .75, 1].map(f => `<line x1="70" x2="680" y1="${y(top * f)}" y2="${y(top * f)}" stroke="#e3ebe8"/><text x="62" y="${y(top * f) + 3}" text-anchor="end">${Math.round(top * f).toLocaleString('en-CA')}</text>`).join('');
  const step = Math.max(1, Math.ceil(last / 6));
  const ticks = stacked[0].map((_, i) => i).filter(i => (i % step === 0 && last - i >= step / 2) || i === last).map(i => `<text x="${x(i)}" y="212" text-anchor="middle">${i ? monthLabel(i) : 'Today'}</text>`).join('');
  const areas = view === 'total'
    ? `<polygon points="${x(0)},190 ${line(stacked[0]).join(' ')} ${x(last)},190" fill="url(#fade)"/><polyline points="${line(stacked[0]).join(' ')}" fill="none" stroke="#1a4f61" stroke-width="2.5" stroke-linejoin="round"/>`
    : stacked.map((upper, i) => `<polygon points="${line(upper).join(' ')} ${line(i ? stacked[i - 1] : upper.map(() => 0)).reverse().join(' ')}" fill="${layers[i].color}" fill-opacity=".85" stroke="#fff" stroke-width=".8"/>`).join('');
  // Only calculated numbers, dates, and fixed colours enter this markup; names use textContent below.
  $('timeline').innerHTML = `<svg viewBox="0 0 700 220" role="img" aria-label="Balance falls to zero by ${monthLabel(last)}"><defs><linearGradient id="fade" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#a8d5e2" stop-opacity=".7"/><stop offset="1" stop-color="#a8d5e2" stop-opacity=".08"/></linearGradient></defs>${grid}${areas}${ticks}</svg>`;
  if (view !== 'total') $('legend').replaceChildren(...layers.map(layer => {
    const item = document.createElement('span'), swatch = document.createElement('i');
    swatch.style.background = layer.color; item.append(swatch, layer.label); return item;
  }));
}

function renderCategories() {
  const payoff = {};
  for (const payment of current.result.schedule) if (Number(payment.balance) === 0) payoff[payment.debt] ??= payment.month;
  const groups = new Map();
  for (const debt of current.debts) {
    const key = categoryOf(debt), balance = Number(debt.balance);
    const group = groups.get(key) || {key, count: 0, balance: 0, original: 0, month: 0};
    group.count++; group.balance += balance; group.original += Math.max(Number(debt.original) || 0, balance);
    // A category is paid off when its last debt is; Infinity marks a debt with no payoff in this current.
    if (balance) group.month = Math.max(group.month, payoff[debt.name.trim()] ?? Infinity);
    groups.set(key, group);
  }
  $('category-progress').replaceChildren(...[...groups.values()].sort((a, b) => a.month - b.month).map(group => {
    const {label, color} = CATEGORIES[group.key];
    const share = group.original ? (group.original - group.balance) / group.original : 1, pct = (share * 100).toFixed(1);
    const card = document.createElement('div'); card.className = 'cat-card'; card.style.setProperty('--c', color);
    const top = document.createElement('div'); top.className = 'cat-top';
    const name = document.createElement('strong'); name.innerHTML = iconSvg(group.key); name.append(group.count > 1 ? `${label} · ${group.count} debts` : label);
    const when = document.createElement('span');
    when.textContent = !group.balance ? 'Paid off' : group.month === Infinity ? 'No payoff yet' : `Paid off in ${group.month} month${group.month === 1 ? '' : 's'} · ${monthLabel(group.month)}`;
    top.append(name, when);
    const row = document.createElement('div'); row.className = 'cat-row';
    const caption = document.createElement('span'); caption.className = 'eyebrow'; caption.textContent = 'PAYOFF PROGRESS';
    const track = document.createElement('div'); track.className = 'cat-track'; track.style.setProperty('--p', `${pct}%`);
    const bubble = document.createElement('b'); bubble.textContent = `Balance ${money(group.balance)}`;
    const bar = document.createElement('div'); bar.className = 'bar'; bar.setAttribute('role', 'progressbar');
    bar.setAttribute('aria-valuenow', Math.round(share * 100)); bar.setAttribute('aria-label', `${label} paid`);
    bar.append(document.createElement('span')); track.append(bubble, bar);
    const amount = document.createElement('strong'); amount.textContent = `${pct}%`;
    row.append(caption, track, amount); card.append(top, row); return card;
  }));
}

for (const tab of document.querySelectorAll('[data-view]')) tab.addEventListener('click', () => {
  view = tab.dataset.view;
  for (const other of document.querySelectorAll('[data-view]')) other.setAttribute('aria-selected', String(other === tab));
  if (current) drawTimeline();
});

$('clear').addEventListener('click', () => { try { localStorage.removeItem('kosha-plan'); } catch {} location.reload(); });
load().catch(error => { $('error').textContent = error.message; $('source').textContent = 'Something went wrong loading your plan.'; });
