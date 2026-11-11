const $ = id => document.getElementById(id);
let plan, payoff = {};

async function load() {
  let sample;
  ({plan, sample} = await loadPlan());
  $('source').textContent = sample ? 'Showing a fictional example. Edit debts to add your own.' : `${plan.debts.length} debts in your saved plan.`;
  const results = await calculatePlan(plan);
  payoff = payoffMonths(results[plan.strategy] || results[0]);
  renderList();
  donut($('by-category'), [...plan.debts.reduce((groups, debt) => {
    const key = categoryOf(debt), group = groups.get(key) || {label: CATEGORIES[key].label, color: CATEGORIES[key].color, value: 0};
    group.value += Number(debt.balance); return groups.set(key, group);
  }, new Map()).values()]);
  donut($('by-debt'), plan.debts.map((debt, i) => ({label: debt.name, color: PALETTE[i % PALETTE.length], value: Number(debt.balance)})));
}

function renderList() {
  const query = $('search').value.trim().toLowerCase(), month = debt => Number(debt.balance) ? payoff[debt.name.trim()] ?? Infinity : 0;
  const sorters = {payoff: (a, b) => month(a) - month(b), balance: (a, b) => b.balance - a.balance,
                   apr: (a, b) => b.apr - a.apr, name: (a, b) => a.name.localeCompare(b.name)};
  const debts = plan.debts.filter(debt => debt.name.toLowerCase().includes(query)).sort(sorters[$('sort').value]);
  $('debt-list').replaceChildren(...debts.map(debt => {
    const balance = Number(debt.balance), original = Math.max(Number(debt.original) || 0, balance);
    return progressCard({category: categoryOf(debt), title: debt.name, balance,
      status: payoffStatus(balance, month(debt) || undefined, offset => planMonth(plan, offset)),
      detail: `Minimum ${money(debt.minimum)} · APR ${Number(debt.apr).toFixed(2)}%`,
      share: original ? (original - balance) / original : 1});
  }));
  if (!debts.length) $('debt-list').innerHTML = '<p class="empty">No debts match your search.</p>';
}

// Donut of balances; labels go into the legend with textContent.
function donut(container, slices) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  let start = 0;
  const arcs = total ? slices.filter(slice => slice.value).map(slice => {
    const length = slice.value / total * 100, arc = `<circle cx="60" cy="60" r="46" fill="none" stroke="${slice.color}" stroke-width="16" pathLength="100" stroke-dasharray="${length.toFixed(2)} ${(100 - length).toFixed(2)}" stroke-dashoffset="${(-start).toFixed(2)}" transform="rotate(-90 60 60)"/>`;
    start += length; return arc;
  }).join('') : '<circle cx="60" cy="60" r="46" fill="none" stroke="#e8f4f7" stroke-width="16"/>';
  container.innerHTML = `<svg class="donut" viewBox="0 0 120 120" role="img" aria-label="Total ${money(total)}">${arcs}<text x="60" y="58" text-anchor="middle">Total</text><text x="60" y="72" text-anchor="middle" class="donut-total">${money(total)}</text></svg>`;
  const legend = document.createElement('div'); legend.className = 'legend';
  legend.append(...slices.map(slice => {
    const item = document.createElement('span'), swatch = document.createElement('i');
    swatch.style.background = slice.color; item.append(swatch, `${slice.label} · ${total ? Math.round(slice.value / total * 100) : 0}%`); return item;
  }));
  container.append(legend);
}

$('search').addEventListener('input', () => plan && renderList());
$('sort').addEventListener('change', () => plan && renderList());
load().catch(error => { $('error').textContent = error.message; });
