import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function load() {
  const node = () => ({children:[],textContent:'',innerHTML:'',append(...children) { this.children.push(...children); },
    replaceChildren() { this.children=[]; this.innerHTML=''; }});
  const elements=Object.fromEntries(['savings-form','savings-results','savings-chart','savings-table','error'].map(id=>[id,node()]));
  const values={starting:'1000',contribution:'100',years:'2',frequency:'annually',compounding:'annually',
    timing:'end',rate:'10',fee:'0',tax:'0',inflation:'0'};
  const context=vm.createContext({
    document:{getElementById:id=>elements[id],createElement:node},
    FormData:class { constructor() { return Object.entries(values); } },
    Intl,
  });
  for (const file of ['savings-data.js','savings.js']) {
    vm.runInContext(readFileSync(new URL('../web/'+file,import.meta.url),'utf8'),context);
  }
  return {elements,values};
}

test('the savings page renders the hand-calculated result and an annual table',()=>{
  const {elements}=load();
  assert.equal(elements['savings-results'].children[0].children[1].textContent,'$1,420.00');
  assert.equal(elements['savings-table'].children.length,3);
  assert.match(elements['savings-chart'].innerHTML,/Projected balance and total invested/);
});

test('changing input clears stale results; submitting invalid input keeps them cleared',()=>{
  const {elements,values}=load();
  elements['savings-form'].oninput();
  for (const id of ['savings-results','savings-chart','savings-table']) assert.equal(elements[id].children.length,0);
  assert.match(elements.error.textContent,/Calculate again/);
  values.starting='';
  elements['savings-form'].onsubmit({preventDefault() {}});
  assert.match(elements.error.textContent,/valid starting/);
  assert.equal(elements['savings-chart'].innerHTML,'');
  assert.equal(elements['savings-results'].children.length,0);
});
