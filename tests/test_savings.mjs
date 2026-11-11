import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
const context=vm.createContext({});
vm.runInContext(readFileSync(new URL('../web/savings-data.js',import.meta.url),'utf8'),context);
const {projectSavings}=context;
const base={starting:'1000',contribution:'100',years:'2',frequency:'annually',compounding:'annually',
  timing:'end',rate:'10',fee:'0',tax:'0',inflation:'0'};
const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-7,`${actual} != ${expected}`);
test('annual beginning and end deposits agree with hand-calculated balances',()=>{
  const end=projectSavings(base),begin=projectSavings({...base,timing:'beginning'});
  close(end.balance,1420); close(begin.balance,1441);
  close(end.invested,1200); close(end.growth,220);
  assert.equal(end.rows.length,3);
});
test('monthly result agrees with the ordinary annuity formula',()=>{
  const result=projectSavings({...base,frequency:'monthly',compounding:'monthly',years:'1',rate:'12'});
  close(result.balance,1000*1.01**12+100*(1.01**12-1)/0.01);
});
test('all deposit frequencies reconcile at zero return',()=>{
  for(const [frequency,count] of Object.entries({weekly:52,biweekly:26,monthly:12,quarterly:4,annually:1})) {
    const result=projectSavings({...base,frequency,rate:'0'});
    close(result.balance,1000+100*count*2);close(result.growth,0);
  }
});
test('compounding converts the nominal rate across deposit frequencies',()=>{
  for(const [compounding,count] of Object.entries({daily:365,monthly:12,quarterly:4,semiannually:2,annually:1})) {
    const result=projectSavings({...base,frequency:'weekly',contribution:'0',years:'1',compounding});
    close(result.balance,1000*(1+0.1/count)**count);
  }
});
test('inflation increases deposits annually and discounts the final balance',()=>{
  const result=projectSavings({...base,rate:'0',inflation:'10',increase:'on'});
  close(result.contributions,210); close(result.balance,1210);close(result.real,1000);
  close(projectSavings({...base,rate:'0',inflation:'10'}).contributions,200);
});
test('fees and assumed tax reduce positive returns; losses get no tax credit',()=>{
  close(projectSavings({...base,contribution:'0',years:'1',fee:'2',tax:'25'}).balance,1060);
  close(projectSavings({...base,contribution:'0',years:'1',rate:'-10',tax:'25'}).balance,900);
});
test('zero years, zero balances and cents work without invented growth',()=>{
  const result=projectSavings({...base,years:'0'});
  close(result.balance,1000);close(result.contributions,0);assert.equal(result.rows.length,1);
  close(projectSavings({...base,starting:'0',contribution:'0'}).balance,0);
  close(projectSavings({...base,starting:'0',contribution:'0.29',rate:'0'}).balance,0.58);
});
test('invalid values and missing fields fail clearly',()=>{
  for(const values of [{starting:''},{contribution:'1.001'},{years:'1.5'},{years:'61'},{rate:'NaN'},
    {rate:'Infinity'},{fee:null},{inflation:'-1'},{tax:'76'},{frequency:'constructor'},
    {compounding:'bad'},{timing:'maybe'},{increase:'yes'},{starting:'-1'}]) {
    assert.throws(()=>projectSavings({...base,...values}));
  }
  assert.throws(()=>projectSavings({}));
});
