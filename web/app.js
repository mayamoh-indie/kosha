const $ = id => document.getElementById(id);
const labels = {avalanche:'Highest interest first',snowball:'Smallest balance first',custom:'Your entered order'};
let results = [], selected = 0, shown = 24, revision = 0, snapshot = [], persist = false;

function invalidate() {
  revision++;
  results = [];
  $('cards').replaceChildren(); $('chart').replaceChildren(); $('summary').replaceChildren();
  $('schedule').replaceChildren(); $('schedule-note').textContent = '';
  $('download').disabled = true; $('more').hidden = true;
  $('status').textContent = 'Your inputs changed. Compare again to update your plan.';
}

function addDebt(debt = {}) {
  const row = document.createElement('div'); row.className = 'debt';
  row.innerHTML = '<div class="debt-top"><label>Debt name<input name="name" required maxlength="100" placeholder="e.g. Visa card"></label><label class="category">Category<select name="category"></select></label><button class="remove" type="button">Remove</button></div><div class="fields"><label>Balance (CAD)<input name="balance" type="number" min="0" step="0.01" required></label><label>APR (%)<input name="apr" type="number" min="0" max="100" step="any" required></label><label>Minimum (CAD)<input name="minimum" type="number" min="0" step="0.01" required></label><label>Original amount (optional)<input name="original" type="number" min="0" step="0.01" placeholder="For progress"></label></div>';
  row.querySelector('select').append(...Object.entries(CATEGORIES).map(([key, {label}]) => new Option(label, key)));
  for (const input of row.querySelectorAll('input,select')) input.value = input.name === 'category' ? categoryOf(debt) : debt[input.name] ?? '';
  row.querySelector('button').addEventListener('click', () => {persist = true; row.remove(); invalidate();});
  $('debts').append(row);
}

function rows() {
  return [...$('debts').children].map(row => Object.fromEntries([...row.querySelectorAll('input,select')].map(input => [input.name,input.value])));
}

async function calculate(event) {
  if (event) event.preventDefault();
  invalidate(); const version = revision;
  $('error').textContent = ''; $('calculate').disabled = true;
  $('status').textContent = 'Comparing your repayment plans…';
  const debts = rows();
  try {
    // Submitted balances are as of this month, which restarts the plan clock; reloading keeps it.
    const base = withDefaults(readStore(PLAN_KEY) || {}), restart = Boolean(event);
    const data = await calculatePlan({...base, debts, monthly_budget:$('budget').value, start:restart ? monthKey(new Date()) : base.start});
    if (version !== revision) return;
    snapshot = debts; results = data; selected = data[base.strategy] ? base.strategy : 0; shown = 24; if (restart) save(true); render();
  } catch (error) {
    if (version !== revision) return;
    $('error').textContent = error.message;
    $('status').textContent = 'Check your inputs and try again.';
  } finally { $('calculate').disabled = false; }
}

function render() {
  $('cards').replaceChildren();
  results.forEach((result,index) => {
    const button = document.createElement('button'); button.className = 'plan' + (index === selected ? ' selected' : '');
    button.setAttribute('aria-pressed', String(index === selected));
    const title = document.createElement('span'); title.textContent = labels[result.strategy];
    const duration = document.createElement('strong'); duration.textContent = result.status === 'paid_off' ? `${result.months} mo` : 'No payoff';
    const cost = document.createElement('small'); cost.textContent = `${money(result.interest)} interest${result.status === 'paid_off' ? '' : ' so far'}`;
    button.append(title,duration,cost); button.addEventListener('click',() => {selected=index; shown=24; save(); render();}); $('cards').append(button);
  });
  const result = results[selected];
  $('status').textContent = result.status === 'paid_off' ? (result.months ? 'Same monthly budget. Three ways forward. Select a plan to explore.' : 'No outstanding debt. You’re starting with a clean slate.') : result.message;
  $('chart-label').textContent = labels[result.strategy];
  drawChart(result);
  $('summary').replaceChildren();
  for (const [label,value] of [['Starting debt',money(snapshot.reduce((sum,debt)=>sum+Number(debt.balance),0))],['Total payments',money(result.paid)],['Remaining',money(result.remaining)]]) {
    const box=document.createElement('div'); box.textContent=label; const strong=document.createElement('strong'); strong.textContent=value; box.append(strong); $('summary').append(box);
  }
  renderSchedule(); $('download').disabled = !result.schedule.length;
}

function drawChart(result) {
  const start = snapshot.reduce((sum,debt)=>sum+Number(debt.balance),0);
  const totals = [start];
  for (const payment of result.schedule) totals[payment.month] = (totals[payment.month] || 0) + Number(payment.balance);
  if (totals.length < 2) { $('chart').innerHTML='<p class="empty"></p>'; $('chart').firstChild.textContent=start ? 'Adjust your monthly budget to see a payoff path.' : 'No debt left to chart.'; return; }
  const maximum = Math.max(...totals,1), last=totals.length-1;
  const points = totals.map((value,i) => `${48+i/last*490},${175-value/maximum*145}`).join(' ');
  // Only calculated numeric values enter the SVG markup; user labels use textContent.
  $('chart').innerHTML=`<svg viewBox="0 0 560 210" role="img" aria-label="Remaining debt over ${last} months"><line x1="48" y1="30" x2="538" y2="30" stroke="#e3ebe5"/><line x1="48" y1="102" x2="538" y2="102" stroke="#e3ebe5"/><line x1="48" y1="175" x2="538" y2="175" stroke="#e3ebe5"/><polygon points="48,175 ${points} 538,175" fill="#e8f3ee"/><polyline points="${points}" fill="none" stroke="#397d70" stroke-width="3" stroke-linejoin="round"/><text x="0" y="34">${Math.round(maximum).toLocaleString('en-CA')}</text><text x="24" y="178">0</text><text x="48" y="200">Today</text><text x="470" y="200">Month ${last}</text></svg>`;
}

function renderSchedule() {
  const schedule=results[selected].schedule; $('schedule').replaceChildren();
  for (const payment of schedule.slice(0,shown)) {
    const row=document.createElement('tr');
    for (const value of [payment.month,payment.debt,money(payment.interest),money(payment.payment),money(payment.balance)]) {const cell=document.createElement('td'); cell.textContent=value; row.append(cell);}
    $('schedule').append(row);
  }
  $('schedule-note').textContent = schedule.length ? `Showing ${Math.min(shown,schedule.length)} of ${schedule.length} payments. Download includes the full schedule.` : 'No payments to show.';
  $('more').hidden = shown >= schedule.length;
}

function download() {
  const result=results[selected];
  // Prefix potential spreadsheet formulas before quoting exported user text.
  const cell=value => '"'+String(value).replace(/^[=+\-@\t\r]/,"'$&").replaceAll('"','""')+'"';
  const lines=[['Month','Debt','Interest CAD','Payment CAD','Balance CAD'],...result.schedule.map(p=>[p.month,p.debt,p.interest,p.payment,p.balance])];
  const url=URL.createObjectURL(new Blob([lines.map(row=>row.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));
  const link=document.createElement('a'); link.href=url; link.download=`kosha-${result.strategy}.csv`; link.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
}

// The home page reads this plan. It stays in this browser's storage only.
function save(restart = false) {
  if (persist) savePlan({...readStore(PLAN_KEY), debts:snapshot, monthly_budget:$('budget').value, strategy:selected}, restart);
}

function loadSaved() {
  const plan = readStore(PLAN_KEY);
  if (!plan) return loadSample();
  persist = true;
  $('debts').replaceChildren(); plan.debts.forEach(addDebt); $('budget').value = plan.monthly_budget;
  calculate();
}

async function loadSample() {
  persist = false; invalidate(); const version=revision;
  try {
    const response=await fetch(REPO_ROOT + 'data/sample-debts.json'); if (!response.ok) throw new Error('Sample data unavailable.');
    const sample=await response.json(); if (version!==revision) return;
    $('debts').replaceChildren(); sample.debts.forEach(addDebt); $('budget').value=sample.monthly_budget; await calculate();
  } catch(error) { $('error').textContent=error.message; }
}
$('form').addEventListener('submit',calculate);
$('form').addEventListener('input',()=>{persist=true; invalidate();});
$('add').addEventListener('click',()=>{persist=true; addDebt(); invalidate(); $('debts').lastChild.querySelector('input').focus();});
$('sample').addEventListener('click',loadSample);
$('download').addEventListener('click',download);
$('more').addEventListener('click',()=>{shown+=60;renderSchedule();});
loadSaved();
