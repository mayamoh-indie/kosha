// Hypothetical growth in equal periods, independent of account balances and tax-return rules.
const SAVINGS_FREQUENCIES = {weekly:52, biweekly:26, monthly:12, quarterly:4, annually:1};
const SAVINGS_COMPOUNDING = {daily:365, monthly:12, quarterly:4, semiannually:2, annually:1};
function projectSavings(values) {
  const read = (key, min, max) => {
    const value = values[key];
    if (typeof value !== 'string' || !value.trim() || !Number.isFinite(Number(value)) || Number(value) < min || Number(value) > max) {
      throw new Error(`Enter a valid ${key} between ${min} and ${max}.`);
    }
    return Number(value);
  };
  const starting = read('starting',0,1e9), contribution = read('contribution',0,1e7), years = read('years',0,60);
  for (const key of ['starting','contribution']) {
    if (!/^\d+(\.\d{1,2})?$/.test(values[key])) throw new Error(`${key} needs an amount with at most two decimal places.`);
  }
  if (!Number.isInteger(years)) throw new Error('Years must be a whole number.');
  if (!Object.hasOwn(SAVINGS_FREQUENCIES,values.frequency)) throw new Error('Choose a contribution frequency.');
  if (!Object.hasOwn(SAVINGS_COMPOUNDING,values.compounding)) throw new Error('Choose a compounding frequency.');
  if (!['beginning','end'].includes(values.timing)) throw new Error('Choose when contributions happen.');
  if (![undefined,'on'].includes(values.increase)) throw new Error('Choose whether contributions increase with inflation.');
  const rate = read('rate',-50,50), fee = read('fee',0,10), tax = read('tax',0,75), inflation = read('inflation',0,25);
  const periods = SAVINGS_FREQUENCIES[values.frequency], compounds = SAVINGS_COMPOUNDING[values.compounding];
  // Simplified tax drag: reduce positive after-fee nominal return; no tax credit for losses.
  const afterFee = (rate-fee)/100, netRate = afterFee > 0 ? afterFee*(1-tax/100) : afterFee;
  const factor = (1+netRate/compounds)**(compounds/periods);
  let balance = starting, contributions = 0;
  const rows = [{year:0,contributions:0,invested:starting,balance:starting,real:starting}];
  for (let year=1; year<=years; year++) {
    const amount = Math.round(contribution*(values.increase==='on' ? (1+inflation/100)**(year-1) : 1)*100)/100;
    for (let period=0; period<periods; period++) {
      if (values.timing==='beginning') balance += amount;
      balance *= factor;
      if (values.timing==='end') balance += amount;
      contributions += amount;
    }
    rows.push({year,contributions,invested:starting+contributions,balance,real:balance/(1+inflation/100)**year});
  }
  if (!Number.isFinite(balance)) throw new Error('This scenario is too large to calculate. Reduce its amounts or return.');
  return {starting,contributions,invested:starting+contributions,balance,growth:balance-starting-contributions,
    real:balance/(1+inflation/100)**years,rows};
}
