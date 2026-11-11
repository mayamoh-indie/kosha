const $ = id => document.getElementById(id);
const element = (tag,text) => Object.assign(document.createElement(tag),{textContent:text});
const dollars = cents => money(cents/100);
let data, editing = null, expenses = [], debts = null;
const blank = () => ({accounts:[],income:[],budgets:[],goals:[]});
function loadFinance() {
  const raw = localStorage.getItem(FINANCE_KEY);
  if (!raw) return blank();
  const stored = JSON.parse(raw);
  for (const kind of Object.keys(blank())) {
    if (!Array.isArray(stored[kind])) throw new Error('Saved money overview cannot be read. It has been kept unchanged.');
    for (const item of stored[kind]) {
      if (!item || typeof item.id!=='string') throw new Error('An unreadable overview record was found. Saved data is unchanged.');
      const values={...item,amount:String(item.cents/100),saved:String(item.saved/100)};
      const validated=financeRecord(kind,values,item.id);
      if (validated.cents!==item.cents || (kind==='goals' && validated.saved!==item.saved)) throw new Error('Invalid saved amount. Saved data is unchanged.');
    }
  }
  return stored;
}
function persist() { localStorage.setItem(FINANCE_KEY,JSON.stringify(data)); }
function refreshForm() {
  const kind=$('kind').value;
  $('type-field').hidden=kind!=='accounts'; $('category-field').hidden=kind!=='budgets';
  $('month-field').hidden=kind!=='budgets'; $('date-field').hidden=kind==='budgets'; $('saved-field').hidden=$('bill-field').hidden=kind!=='goals';
  $('date-label').textContent=kind==='goals'?'Target or due date':kind==='income'?'Date received':'Balance as of';
  $('amount-label').textContent=kind==='goals'?'Target or bill amount (CAD)':kind==='income'?'Net amount received (CAD)':kind==='budgets'?'Category limit (CAD)':'Asset balance (CAD)';
  for(const input of $('entry-form').querySelectorAll('input,select')) input.disabled=Boolean(input.closest('[hidden]'));
}
function clearForm() { editing=null; $('entry-form').reset(); $('date').value=dayKey(new Date()); $('month').value=$('view-month').value; $('submit').textContent='Save entry'; refreshForm(); }
function edit(kind,item) {
  clearForm(); editing=item.id; $('kind').value=kind;
  for(const key of ['name','type','category','date','month']) if(item[key]!==undefined) $(key).value=item[key];
  $('amount').value=item.cents/100; $('saved').value=(item.saved||0)/100; $('bill').checked=item.bill===true; $('submit').textContent='Update entry'; refreshForm(); $('name').focus();
}
// Saves a replacement data set; on failure the saved data and the page stay as they were.
function commit(next, action) {
  try{localStorage.setItem(FINANCE_KEY,JSON.stringify(next));data=next;clearForm();render();}catch(error){$('error').textContent=`Could not save ${action}: ${error.message}`;}
}
function render() {
  const month=$('view-month').value, totals=financeTotals(data,expenses,debts,month);
  $('metrics').replaceChildren();
  for(const [label,value] of [['Assets',totals.assets],['Accessible cash',totals.cash],['Debt',totals.debt],['Net worth',totals.netWorth],['Income received',totals.income],['Recorded income less spending',totals.recordedSurplus]]) {
    const box=element('div','');box.className='panel';box.append(element('span',label),element('h2',value===null?'Debt not entered':dollars(value)));$('metrics').append(box);
  }
  for(const kind of Object.keys(blank())) {
    const list=$(kind+'-list'); list.replaceChildren();
    const items=kind==='income'?data[kind].filter(item=>item.date.startsWith(month)):kind==='budgets'?data[kind].filter(item=>item.month===month):data[kind];
    for(const item of items) {
      const row=element('div','');row.className='finance-row';const text=element('div','');text.append(element('strong',item.name));
      let detail=kind==='accounts'?`${item.type} · as of ${item.date} · ${dollars(item.cents)}`:kind==='income'?`${item.date} · ${dollars(item.cents)}`:'';
      if(kind==='budgets') {
        const spent=expenses.filter(e=>e.date.startsWith(month)&&e.category===item.category).reduce((sum,e)=>sum+e.cents,0);
        detail=`${EXPENSE_CATEGORIES[item.category].label}: ${dollars(spent)} spent of ${dollars(item.cents)} · ${dollars(Math.abs(item.cents-spent))} ${spent>item.cents?'over budget':'left'}`;
      }
      if(kind==='goals') {
        const {remaining,months,monthly,due}=goalStatus(item,dayKey(new Date())), [noun,what,verb]=item.bill===true?['Bill','bill','Reserve']:['Goal','target','Set aside'];
        detail=`${dollars(item.saved)} earmarked of ${dollars(item.cents)} · due ${item.date}. `+(remaining===0?`${noun} funded.`:months<=0?`${dollars(remaining)} still needed; ${what} is due or past.`:`${verb} about ${dollars(monthly)}/month for ${months} months.`);
        if(due){const tag=element('span',due==='soon'?'Due soon':'Past due date');tag.className='pill';text.append(' ',tag);}
        const progress=document.createElement('progress');progress.max=item.cents;progress.value=Math.min(item.saved,item.cents);progress.setAttribute('aria-label',item.name+' progress');text.append(progress);
      }
      text.append(element('p',detail));row.append(text);
      const change=element('button','Edit');change.className='secondary';change.onclick=()=>edit(kind,item);
      const remove=element('button','Delete');remove.className='secondary';remove.onclick=()=>commit({...data,[kind]:data[kind].filter(other=>other.id!==item.id)},'deletion');
      row.append(change,remove);
      if(kind==='goals'&&item.bill===true) {
        // Paying is confirmed by the user and never logs an expense: the money leaves through their own records.
        const paid=element('button','Mark paid');paid.className='secondary';paid.setAttribute('aria-label','Mark paid: '+item.name);paid.onclick=()=>{
          $('error').textContent='';
          try {
            const next=nextBillCycle(item);
            if(confirm(`Mark ${item.name} as paid? The next due date becomes ${next.date} and the earmarked amount restarts at ${dollars(0)}. No expense is logged.`))commit({...data,goals:data.goals.map(other=>other.id===item.id?next:other)},'the next cycle');
          }catch(error){$('error').textContent=error.message;}
        };row.append(paid);
      }
      list.append(row);
    }
    if(!items.length)list.append(element('p','No entries yet.'));
  }
}
$('type').append(...ACCOUNT_TYPES.map(type=>new Option(type,type)));
$('category').append(...Object.entries(EXPENSE_CATEGORIES).map(([key,value])=>new Option(value.label,key)));
$('view-month').value=monthKey(new Date());
$('kind').onchange=()=>{editing=null;$('submit').textContent='Save entry';refreshForm();};
$('cancel').onclick=clearForm;$('view-month').onchange=()=>{if($('view-month').value)render();};
$('entry-form').onsubmit=event=>{
  event.preventDefault();$('error').textContent='';
  try {
    const kind=$('kind').value, values=Object.fromEntries(new FormData($('entry-form'))), id=editing||crypto.randomUUID();
    const record=financeRecord(kind,values,id);
    if(kind==='budgets'&&data.budgets.some(item=>item.id!==id&&item.month===record.month&&item.category===record.category))throw new Error('This category already has a budget for that month. Edit its existing entry.');
    const previous=data;data={...data,[kind]:[...data[kind].filter(item=>item.id!==id),record]};
    try{persist();}catch(error){data=previous;throw error;}
    clearForm();render();
  }catch(error){$('error').textContent=error.message;}
};
try {
  data=loadFinance();expenses=loadExpenses().expenses;
  const saved=readStore(PLAN_KEY);if(saved){if(!Array.isArray(saved.debts))throw new Error('Saved debt plan cannot be read.');debts=saved.debts;}
  clearForm();render();
} catch(error){$('error').textContent=error.message;for(const control of $('entry-form').elements)control.disabled=true;}
