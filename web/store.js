// Shared plan storage, dates, and calculation for the planning pages.
// Plans and payment records stay in this browser's localStorage; nothing is sent anywhere.
const PLAN_KEY = 'kosha-plan', PAYMENTS_KEY = 'kosha-payments';
const STRATEGY_KEYS = ['avalanche', 'snowball', 'custom'];
const STRATEGIES = {avalanche: 'Highest interest first', snowball: 'Smallest balance first', custom: 'Your entered order'};
const money = value => new Intl.NumberFormat('en-CA', {style: 'currency', currency: 'CAD'}).format(Number(value));
const monthKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

function readStore(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }
function writeStore(key, value) {
  try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(value)); }
  catch {
    // Best effort: keep the current page usable, but never imply the data was saved.
    let warning = document.getElementById('storage-warning');
    if (!warning) {
      warning = document.createElement('p'); warning.id = 'storage-warning'; warning.setAttribute('role', 'alert');
      document.body.prepend(warning);
    }
    warning.textContent = 'Your changes could not be saved in this browser. Keep this page open and copy your entries before leaving.';
  }
}

// Plan month 0 is the month balances were entered (`start`); month 1 is the next calendar month.
const planDate = (plan, offset, day = plan.pay_day) => {
  const [year, month] = plan.start.split('-').map(Number);
  return new Date(year, month - 1 + offset, Math.min(Math.max(Number(day) || 1, 1), 28));
};
const planMonth = (plan, offset) => planDate(plan, offset, 1).toLocaleDateString('en-CA', {month: 'short', year: 'numeric'});
const offsetOf = (plan, key) => {
  const [year, month] = key.split('-').map(Number), [startYear, startMonth] = plan.start.split('-').map(Number);
  return (year - startYear) * 12 + month - startMonth;
};

const withDefaults = plan => ({strategy: 0, pay_day: 1, extra_payments: [], start: monthKey(new Date()), ...plan});

async function loadPlan() {
  const saved = readStore(PLAN_KEY);
  if (saved) return {plan: withDefaults(saved), sample: false};
  const response = await fetch(REPO_ROOT + 'data/sample-debts.json');
  if (!response.ok) throw new Error('Sample data unavailable.');
  return {plan: withDefaults(await response.json()), sample: true};
}

// Pass restart when balances were just entered, so month 0 becomes this month.
function savePlan(plan, restart = false) {
  writeStore(PLAN_KEY, restart ? {...plan, start: monthKey(new Date())} : plan);
}

// Returns results for all three strategies. One-time payments are stored by calendar month.
async function calculatePlan(plan) {
  const extra_payments = plan.extra_payments
    .map(payment => ({month: offsetOf(plan, payment.month), amount: payment.amount}))
    .filter(payment => payment.month >= 1 && payment.month <= 1200);
  const response = await api('/calculate', {debts: plan.debts, monthly_budget: plan.monthly_budget, extra_payments});
  if (!response.ok) throw new Error(response.data.error || 'Unable to calculate this plan.');
  return response.data;
}

// First plan month in which each debt reaches a zero balance.
function payoffMonths(result) {
  const months = {};
  for (const payment of result.schedule) if (Number(payment.balance) === 0) months[payment.debt] ??= payment.month;
  return months;
}
