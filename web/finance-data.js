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
  // A bill is a goal for a known yearly or irregular charge. The form sends 'on'; saved records hold true.
  const bill = values.bill === true || values.bill === 'on';
  return {...record, date: values.date, cents: financeAmount(values.amount, true), saved: financeAmount(values.saved), ...(bill && {bill})};
}
const BILL_SOON_DAYS = 30;
// `today` is a YYYY-MM-DD key. `due` is only set for bills: 'soon' within 30 days, 'past' after the date.
function goalStatus(item, today) {
  const remaining = Math.max(0, item.cents - item.saved);
  const months = (Number(item.date.slice(0, 4)) - Number(today.slice(0, 4))) * 12 + Number(item.date.slice(5, 7)) - Number(today.slice(5, 7));
  const days = (Date.parse(item.date) - Date.parse(today)) / 86400000;
  const due = item.bill !== true ? null : days < 0 ? 'past' : days <= BILL_SOON_DAYS ? 'soon' : null;
  return {remaining, months, monthly: months > 0 ? Math.ceil(remaining / months) : remaining, due};
}
// After a bill is paid: same bill, due one year later, nothing earmarked yet. 29 February falls back to the 28th.
function nextBillCycle(item) {
  const year = Number(item.date.slice(0, 4)) + 1, same = `${year}${item.date.slice(4)}`;
  const date = isDay(same) ? same : `${year}-02-28`;
  if (!isDay(date)) throw new Error('The next due date is outside the supported range.');
  return {...item, date, saved: 0};
}
function financeTotals(data, expenses, debts, month) {
  const assets = data.accounts.reduce((sum, account) => sum + account.cents, 0);
  const cash = data.accounts.filter(account => ['Chequing','Savings','Cash'].includes(account.type)).reduce((sum, account) => sum + account.cents, 0);
  const income = data.income.filter(item => item.date.startsWith(month)).reduce((sum,item) => sum+item.cents,0);
  const spending = expenses.filter(item => item.date.startsWith(month)).reduce((sum,item) => sum+item.cents,0);
  const debt = debts === null ? null : debts.reduce((sum,item) => sum+financeAmount(String(item.balance)),0);
  return {assets,cash,income,spending,recordedSurplus:income-spending,debt,netWorth:debt===null?null:assets-debt};
}
