import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const context=vm.createContext({});
vm.runInContext(`const monthKey=date=>date.toISOString().slice(0,7);\n${readFileSync('web/expense-data.js','utf8')}\n${readFileSync('web/finance-data.js','utf8')}\n${readFileSync('web/growth-data.js','utf8')}`,context);
const {financeRecord,financeTotals,financeAmount,goalStatus,nextBillCycle,projectGrowth}=context;
test('a bill is a flagged goal and plain goals stay unflagged',()=>{
  const values={name:'Car insurance',date:'2027-05-10',amount:'1200',saved:'300'};
  assert.equal(financeRecord('goals',{...values,bill:'on'},'id').bill,true);
  assert.equal(financeRecord('goals',{...values,bill:true},'id').bill,true);
  for(const bill of [undefined,false,'yes',1])assert.equal('bill' in financeRecord('goals',{...values,bill},'id'),false);
  assert.throws(()=>financeRecord('goals',{...values,bill:'on',date:'2027-02-30'},'id'));
});
test('bill status gives the monthly reserve and the due-soon window',()=>{
  const bill={bill:true,date:'2027-05-10',cents:120000,saved:30000};
  const status=goalStatus(bill,'2026-11-11');
  assert.equal(status.remaining,90000);assert.equal(status.months,6);assert.equal(status.monthly,15000);assert.equal(status.due,null);
  assert.equal(goalStatus(bill,'2027-04-09').due,null);
  assert.equal(goalStatus(bill,'2027-04-10').due,'soon');
  assert.equal(goalStatus(bill,'2027-05-10').due,'soon');
  assert.equal(goalStatus(bill,'2027-05-11').due,'past');
  assert.equal(goalStatus({...bill,saved:120000},'2027-05-01').due,'soon');
  assert.equal(goalStatus({...bill,bill:undefined},'2027-05-01').due,null);
  assert.equal(goalStatus({...bill,saved:200000},'2026-11-11').remaining,0);
  const late=goalStatus(bill,'2027-05-02');assert.equal(late.months,0);assert.equal(late.monthly,90000);
  assert.equal(goalStatus({...bill,cents:100000,saved:0},'2027-02-10').monthly,33334);
});
test('marking a bill paid moves it one year on and clears the earmark only',()=>{
  const bill={id:'a',name:'Car insurance',bill:true,date:'2027-05-10',cents:120000,saved:120000};
  assert.deepEqual({...nextBillCycle(bill)},{...bill,date:'2028-05-10',saved:0});
  assert.equal(bill.saved,120000);
  assert.equal(nextBillCycle({...bill,date:'2028-02-29'}).date,'2029-02-28');
  assert.equal(nextBillCycle({...bill,date:'2027-02-28'}).date,'2028-02-28');
  assert.throws(()=>nextBillCycle({...bill,date:'9999-05-10'}));
});
test('account snapshots and goals do not double count assets',()=>{
  const data={accounts:[{type:'Savings',cents:100000},{type:'RRSP',cents:50000}],income:[{date:'2026-11-01',cents:20000}],goals:[{saved:50000}]};
  const totals=financeTotals(data,[{date:'2026-11-02',cents:1000}],[{balance:'200'}],'2026-11');
  assert.equal(totals.assets,150000);assert.equal(totals.cash,100000);assert.equal(totals.netWorth,130000);assert.equal(totals.recordedSurplus,19000);
  assert.equal(financeTotals(data,[],null,'2026-11').netWorth,null);
});
test('money entries reject missing, negative, fractional-cent and invalid dates',()=>{
  for(const value of ['',null,'-1','NaN','1.001'])assert.throws(()=>financeAmount(value));
  assert.equal(financeAmount('0.29'),29);
  assert.throws(()=>financeRecord('income',{name:'Pay',date:'2026-02-30',amount:'100'},'id'));
  assert.throws(()=>financeRecord('budgets',{name:'Food',month:'2026-13',category:'groceries',amount:'100'},'id'));
  assert.equal(financeRecord('goals',{name:'Trip',date:'2027-01-01',amount:'100',saved:'20'},'id').saved,2000);
});
const base={balance:'1000',monthly:'100',years:'1',rate:'0',fee:'0',inflation:'0',room:'1200'};
test('zero-return growth reconciles and checks room',()=>{
  const result=projectGrowth(base);assert.equal(result.balance,2200);assert.equal(result.contributions,1200);assert.equal(result.growth,0);assert.equal(result.roomRemaining,0);
  assert.equal(projectGrowth({...base,room:'1000'}).roomRemaining,-200);
  assert.equal(projectGrowth({...base,room:''}).room,null);
  assert.equal(projectGrowth({...base,years:'0'}).balance,1000);
});
test('compounding, fees, inflation and losses behave as stated',()=>{
  const result=projectGrowth({...base,monthly:'0',rate:'12'});
  assert.ok(Math.abs(result.balance-1000*1.01**12)<1e-8);
  const fees=projectGrowth({...base,rate:'6',fee:'1',inflation:'2'});
  assert.ok(fees.feeImpact>0);assert.ok(fees.real<fees.balance);
  assert.ok(projectGrowth({...base,monthly:'0',rate:'-10'}).balance<1000);
  assert.throws(()=>projectGrowth({...base,years:'1.5'}));
  assert.throws(()=>projectGrowth({...base,monthly:'NaN'}));
});
