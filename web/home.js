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
  drawTimeline(balance, result);
  renderDebts(debts, result);
}

function drawTimeline(start, result) {
  const totals = [start];
  for (const payment of result.schedule) totals[payment.month] = (totals[payment.month] || 0) + Number(payment.balance);
  if (totals.length < 2) { $('timeline').innerHTML = '<p class="empty">No balance left to chart.</p>'; return; }
  const top = Math.max(...totals, 1), last = totals.length - 1;
  const x = i => 70 + i / last * 610, y = value => 190 - value / top * 165;
  const points = totals.map((value, i) => `${x(i).toFixed(1)},${y(value).toFixed(1)}`).join(' ');
  const grid = [0, .25, .5, .75, 1].map(f => `<line x1="70" x2="680" y1="${y(top * f)}" y2="${y(top * f)}" stroke="#e3ebe8"/><text x="62" y="${y(top * f) + 3}" text-anchor="end">${Math.round(top * f).toLocaleString('en-CA')}</text>`).join('');
  const step = Math.max(1, Math.ceil(last / 6));
  const ticks = totals.map((_, i) => i).filter(i => (i % step === 0 && last - i >= step / 2) || i === last).map(i => `<text x="${x(i)}" y="212" text-anchor="middle">${i ? monthLabel(i) : 'Today'}</text>`).join('');
  // Only calculated numbers and dates enter this markup; debt names use textContent elsewhere.
  $('timeline').innerHTML = `<svg viewBox="0 0 700 220" role="img" aria-label="Total balance falls to zero by ${monthLabel(last)}"><defs><linearGradient id="fade" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#a8d5e2" stop-opacity=".7"/><stop offset="1" stop-color="#a8d5e2" stop-opacity=".08"/></linearGradient></defs>${grid}<polygon points="${x(0)},190 ${points} ${x(last)},190" fill="url(#fade)"/><polyline points="${points}" fill="none" stroke="#1a4f61" stroke-width="2.5" stroke-linejoin="round"/>${ticks}</svg>`;
}

function renderDebts(debts, result) {
  const payoff = {};
  for (const payment of result.schedule) if (Number(payment.balance) === 0) payoff[payment.debt] ??= payment.month;
  const order = [...debts].sort((a, b) => (payoff[a.name.trim()] ?? 0) - (payoff[b.name.trim()] ?? 0));
  $('debt-progress').replaceChildren(...order.map(debt => {
    const balance = Number(debt.balance), original = Math.max(Number(debt.original) || 0, balance);
    const share = original ? (original - balance) / original : 1, month = payoff[debt.name.trim()];
    const card = document.createElement('div'); card.className = 'debt-card';
    const top = document.createElement('div'); top.className = 'debt-card-top';
    const name = document.createElement('strong'); name.textContent = debt.name;
    const when = document.createElement('span'); when.textContent = !balance ? 'Paid off' : month ? `Paid off by ${monthLabel(month)}` : 'No payoff yet';
    top.append(name, when);
    const bar = document.createElement('div'); bar.className = 'bar'; bar.setAttribute('role', 'progressbar');
    bar.setAttribute('aria-valuenow', Math.round(share * 100)); bar.setAttribute('aria-label', `${debt.name} paid`);
    const fill = document.createElement('span'); fill.style.width = `${share * 100}%`; bar.append(fill);
    const meta = document.createElement('div'); meta.className = 'debt-card-meta';
    const left = document.createElement('span'); left.textContent = `Balance ${money(balance)}`;
    const pct = document.createElement('span'); pct.textContent = `${(share * 100).toFixed(1)}% paid`;
    meta.append(left, pct); card.append(top, bar, meta); return card;
  }));
}

$('clear').addEventListener('click', () => { try { localStorage.removeItem('kosha-plan'); } catch {} location.reload(); });
load().catch(error => { $('error').textContent = error.message; $('source').textContent = 'Something went wrong loading your plan.'; });
