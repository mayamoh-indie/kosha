import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function load(saved) {
  const node=()=>({children:[],value:'',textContent:'',hidden:false,disabled:false,checked:false,
    append(...children){this.children.push(...children);},replaceChildren(...children){this.children=children;},
    setAttribute(key,value){this[key]=value;},focus(){}});
  const elements={}, get=id=>elements[id]??=node();
  const defaults={kind:'accounts',type:'Chequing',name:'',amount:'',saved:'0',contributed:'',date:'',month:'',accountId:'',direction:'contribution'};
  const reset=()=>{for(const [id,value] of Object.entries(defaults))get(id).value=value;};reset();
  get('entry-form').reset=reset;
  const fields={type:'type-field',category:'category-field',date:'date-field',month:'month-field',
    saved:'saved-field',bill:'bill-field',contributed:'contributed-field',accountId:'account-field',direction:'direction-field'};
  const inputs=['kind','name','amount',...Object.keys(fields)].map(id=>{
    const input=get(id);input.closest=()=>fields[id]&&get(fields[id]).hidden?get(fields[id]):null;return input;
  });
  get('entry-form').querySelectorAll=()=>inputs;get('entry-form').elements=inputs;
  let stored=JSON.stringify(saved), blocked=false;
  const context=vm.createContext({document:{getElementById:get,createElement:node},
    localStorage:{getItem:()=>stored,setItem:(key,value)=>{if(blocked)throw new Error('Storage full');stored=value;}},
    loadExpenses:()=>({expenses:[]}),readStore:()=>null,PLAN_KEY:'plan',
    money:value=>value.toFixed(2),monthKey:date=>date.toISOString().slice(0,7),
    Option:class {constructor(label,value){this.textContent=label;this.value=value;}},
    FormData:class {constructor(){return Object.keys(defaults).filter(id=>!get(id).disabled).map(id=>[id,String(get(id).value)]);}},
    crypto:{randomUUID:()=> 'new'},
  });
  for(const file of ['expense-data.js','finance-data.js','finance.js']) {
    vm.runInContext(readFileSync(new URL('../web/'+file,import.meta.url),'utf8'),context);
  }
  return {elements,get,stored:()=>JSON.parse(stored),block:()=>{blocked=true;}};
}
const account={id:'a',name:'TFSA account',type:'TFSA',date:'2026-11-11',cents:10000};
const data=accounts=>({accounts,income:[],budgets:[],goals:[]});
const text=node=>[node.textContent,...(node.children||[]).map(child=>typeof child==='string'?child:text(child))].join(' ');

test('Home groups legacy accounts and editing an unknown contribution keeps it unknown',()=>{
  const page=load(data([account,{...account,id:'b',name:'Older investment',type:'Investments'}]));
  const sections=page.get('accounts-list').children;
  assert.match(text(sections[0]),/Registered investments.*Manual contribution total: not recorded/);
  assert.match(text(sections[1]),/Non-registered investments.*Legacy account/);
  sections[0].children.at(-1).children[1].onclick();
  assert.equal(page.get('contributed').value,'');assert.equal(page.get('contributed-field').hidden,false);
  page.get('amount').value='125';page.get('entry-form').onsubmit({preventDefault(){}});
  assert.equal(page.stored().accounts.find(item=>item.id==='a').cents,12500);
  assert.equal(page.stored().accounts.find(item=>item.id==='a').contributedCents,undefined);
});

test('Home saves contribution cents and a blocked update leaves saved and displayed balances unchanged',()=>{
  const page=load(data([account]));
  page.get('accounts-list').children[0].children.at(-1).children[1].onclick();
  page.get('contributed').value='150.29';page.get('entry-form').onsubmit({preventDefault(){}});
  assert.equal(page.stored().accounts[0].contributedCents,15029);
  page.get('accounts-list').children[0].children.at(-1).children[1].onclick();
  assert.equal(page.get('contributed').value,150.29);
  page.block();page.get('amount').value='999';page.get('entry-form').onsubmit({preventDefault(){}});
  assert.equal(page.stored().accounts[0].cents,10000);
  assert.match(text(page.get('accounts-list').children[0]),/100.00/);
  assert.match(page.get('error').textContent,/Storage full/);
});

test('Home logs and edits investment activity without changing snapshots and protects linked accounts',()=>{
  const page=load(data([account]));
  page.get('kind').value='investmentActivity';page.get('kind').onchange();
  page.get('name').value='November deposit';page.get('accountId').value='a';page.get('amount').value='25.29';
  page.get('entry-form').onsubmit({preventDefault(){}});
  assert.equal(page.stored().investmentActivity[0].cents,2529);
  assert.equal(page.stored().accounts[0].cents,10000);
  assert.match(text(page.get('investmentActivity-list')),/Contribution.*TFSA account.*25.29/);
  page.get('investmentActivity-list').children[0].children[1].onclick();
  page.get('direction').value='withdrawal';page.get('entry-form').onsubmit({preventDefault(){}});
  assert.equal(page.stored().investmentActivity[0].direction,'withdrawal');
  assert.match(text(page.get('accounts-list')),/Net logged: -25.29/);
  page.get('view-month').value='2000-01';page.get('view-month').onchange();
  assert.match(text(page.get('investmentActivity-list')),/No entries yet/);
  assert.match(text(page.get('accounts-list')),/Net logged: -25.29/);
  page.get('accounts-list').children[0].children.at(-1).children[2].onclick();
  assert.equal(page.stored().accounts.length,1);assert.match(page.get('error').textContent,/linked investment account/);
});

test('changing an investment to cash requires explicitly clearing a recorded contribution total',()=>{
  const page=load(data([{...account,contributedCents:5000}]));
  page.get('accounts-list').children[0].children.at(-1).children[1].onclick();
  page.get('type').value='Cash';page.get('type').onchange();
  assert.equal(page.get('contributed-field').hidden,false);
  page.get('entry-form').onsubmit({preventDefault(){}});
  assert.equal(page.stored().accounts[0].type,'TFSA');assert.match(page.get('error').textContent,/clear the contribution/);
  page.get('contributed').value='';page.get('entry-form').onsubmit({preventDefault(){}});
  assert.equal(page.stored().accounts[0].type,'Cash');
});
