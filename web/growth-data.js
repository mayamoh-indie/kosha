// Scenario mathematics only. Annual returns are nominal, compounded monthly.
function projectGrowth(values) {
  const read=(key,min,max)=>{
    const value=values[key];
    if(typeof value!=='string'||!value.trim()||!Number.isFinite(Number(value))||Number(value)<min||Number(value)>max)throw new Error(`Enter a valid ${key} between ${min} and ${max}.`);
    return Number(value);
  };
  const balance=read('balance',0,1e9), monthly=read('monthly',0,1e7), years=read('years',0,60);
  if(!Number.isInteger(years))throw new Error('Years must be a whole number.');
  const rate=read('rate',-50,30),fee=read('fee',0,10),inflation=read('inflation',0,20);
  for(const key of ['balance','monthly','room'])if(values[key]!==undefined&&values[key]!==''&&!/^\d+(\.\d{1,2})?$/.test(values[key]))throw new Error(`${key} needs an amount with at most two decimal places.`);
  const room=values.room===undefined||values.room===''?null:read('room',0,1e9);
  let total=balance,withoutFees=balance;
  const rows=[{year:0,contributions:0,balance}];
  for(let month=1;month<=years*12;month++) {
    total=total*(1+(rate-fee)/1200)+monthly;
    withoutFees=withoutFees*(1+rate/1200)+monthly;
    if(month%12===0)rows.push({year:month/12,contributions:monthly*month,balance:total});
  }
  const contributions=monthly*years*12,firstPeriod=monthly*Math.min(12,years*12);
  return {balance:total,contributions,growth:total-balance-contributions,real:total/((1+inflation/100)**years),feeImpact:withoutFees-total,firstPeriod,room,roomRemaining:room===null?null:room-firstPeriod,rows};
}
