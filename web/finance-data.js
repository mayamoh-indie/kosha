// Whole cents internally; account snapshots and activity are deliberately separate.
const FINANCE_KEY = 'kosha-finances-v1';
const ACCOUNT_TYPES = ['Chequing', 'Savings', 'Cash', 'TFSA', 'RRSP', 'FHSA', 'Investments', 'Property', 'Other asset'];
function financeAmount(value, positive = false) {
  if (typeof value !== 'string' || !/^\d+(\.\d{1,2})?$/.test(value.trim())) throw new Error('Enter an amount with up to two decimal places.');
  const cents = Math.round(Number(value) * 100);
  if (!Number.isSafeInteger(cents) || cents > 100000000000 || cents < (positive ? 1 : 0)) throw new Error('Amount is outside the supported range.');
  return cents;
}
function financeRecord(kind, values, id) {
  const name = String(values.name || '').trim();
  if (!name || name.length > 80) throw new Error('Enter a name up to 80 characters.');
  const record = {id, name};
  if (kind === 'accounts') {
    if (!ACCOUNT_TYPES.includes(values.type)) throw new Error('Choose an account type.');
    if (!isDay(values.date)) throw new Error('Choose a valid balance date.');
    return {...record, type: values.type, date: values.date, cents: financeAmount(values.amount)};
  }
  if (kind === 'income') {
    if (!isDay(values.date)) throw new Error('Choose a valid received date.');
    return {...record, date: values.date, cents: financeAmount(values.amount, true)};
  }
  if (kind === 'budgets') {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(values.month) || !isCategory(values.category)) throw new Error('Choose a month and category.');
    return {...record, month: values.month, category: values.category, cents: financeAmount(values.amount)};
  }
  if (kind !== 'goals' || !isDay(values.date)) throw new Error('Choose a valid goal date.');
  return {...record, date: values.date, cents: financeAmount(values.amount, true), saved: financeAmount(values.saved)};
}
function financeTotals(data, expenses, debts, month) {
  const assets = data.accounts.reduce((sum, account) => sum + account.cents, 0);
  const cash = data.accounts.filter(account => ['Chequing','Savings','Cash'].includes(account.type)).reduce((sum, account) => sum + account.cents, 0);
  const income = data.income.filter(item => item.date.startsWith(month)).reduce((sum,item) => sum+item.cents,0);
  const spending = expenses.filter(item => item.date.startsWith(month)).reduce((sum,item) => sum+item.cents,0);
  const debt = debts === null ? null : debts.reduce((sum,item) => sum+financeAmount(String(item.balance)),0);
  return {assets,cash,income,spending,recordedSurplus:income-spending,debt,netWorth:debt===null?null:assets-debt};
}
