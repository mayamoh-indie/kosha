// What-if rules for the Strategy page: how a monthly spending change would move the debt plan.
// Nothing here saves anything. Kept free of page code so test_whatif.mjs can check it.

// Spending less frees money for debt; spending more takes it away.
// Returns the new monthly debt budget as text with two decimals, the form the engine accepts.
function whatIfBudget(budget, amount, direction) {
  const change = financeAmount(String(amount), true), current = Math.round(Number(budget) * 100);
  if (!Number.isSafeInteger(current) || current < 0) throw new Error('Enter your monthly budget first.');
  const next = direction === 'more' ? current - change : current + change;
  if (next < 0) throw new Error('That is more than your whole debt budget.');
  return (next / 100).toFixed(2);
}

// Compares the plan as it is (`current`) with the plan after the change (`changed`).
// `months` and `interestCents` are positive when the change helps.
function whatIfOutcome(current, changed) {
  // `broken` tells a change that stops a working plan from one that just fails to rescue a stuck plan.
  if (changed.status !== 'paid_off') return {kind: 'unpaid', broken: current.status === 'paid_off', message: changed.message};
  if (current.status !== 'paid_off') return {kind: 'now_paid', months: changed.months};
  return {kind: 'moved', months: current.months - changed.months,
    interestCents: Math.round((Number(current.interest) - Number(changed.interest)) * 100)};
}

// Category budgets saved by Money overview. Stored data is untrusted, so only well-formed ones are used.
function savedBudgets() {
  const stored = readStore(FINANCE_KEY), list = stored && Array.isArray(stored.budgets) ? stored.budgets : [];
  return list.filter(item => item !== null && typeof item === 'object' && typeof item.month === 'string'
    && isCategory(item.category) && Number.isSafeInteger(item.cents) && item.cents >= 0);
}

// A guide for choosing an amount: what was logged last month and budgeted this month for one category.
function spendingGuide(expenses, budgets, category, today) {
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const budget = budgets.find(item => item.month === monthKey(today) && item.category === category);
  return {spentCents: sumCents(expensesIn(expenses, lastMonth).filter(item => item.category === category)),
    budgetCents: budget ? budget.cents : null};
}
