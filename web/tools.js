const money = value => new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'}).format(Number(value));
const el = id => document.getElementById(id);
const revisions = {salary:0,rrsp:0};
function line(container,label,value,hero=false) {
  const row=document.createElement('div'); row.className=hero?'tool-hero':'tool-line';
  const title=document.createElement('span'); title.textContent=label;
  const amount=document.createElement('strong'); amount.textContent=value; row.append(title,amount); container.append(row);
}
async function run(tool,event) {
  if(event) event.preventDefault();
  const version=++revisions[tool], output=el(`${tool}-results`), error=el(`${tool}-error`);
  output.replaceChildren(); error.textContent='';
  const payload=tool==='salary'?{salary:el('salary').value}:{amount:el('amount').value,mode:el('mode').value};
  try {
    const response=await fetch('/'+tool,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const data=await response.json(); if(version!==revisions[tool]) return;
    if(!response.ok) throw new Error(data.error||'Please check your inputs.');
    if(tool==='salary') {
      line(output,'Estimated monthly take-home',money(data.monthly_net),true);
      for(const [label,key] of [['Annual take-home','annual_net'],['Biweekly average (26 pays)','biweekly_net'],['Weekly average (52 pays)','weekly_net'],['Federal income tax / year','federal_tax'],['Ontario income tax / year','ontario_tax'],['Ontario health premium / year','health_premium'],['CPP / year','cpp'],['CPP2 / year','cpp2'],['EI / year','ei']]) line(output,label,money(data[key]));
    } else {
      line(output,'Cash received after withholding',money(data.net),true);
      line(output,'Gross RRSP withdrawal',money(data.gross)); line(output,'Withholding rate',`${Number(data.rate_percent)}%`); line(output,'Tax withheld',money(data.withheld));
      const note=document.createElement('p'); note.className='muted'; note.textContent='Your final tax may be higher or lower. Withholding does not settle the tax owed.'; output.append(note);
    }
  } catch(err) {if(version===revisions[tool]) error.textContent=err.message;}
}
for(const tool of ['salary','rrsp'].filter(tool=>el(`${tool}-form`))) {
  el(`${tool}-form`).addEventListener('submit',event=>run(tool,event));
  el(`${tool}-form`).addEventListener('input',()=>{revisions[tool]++;el(`${tool}-results`).replaceChildren();el(`${tool}-error`).textContent='Inputs changed. Calculate again to update your estimate.';});
  run(tool);
}
el('mode')?.addEventListener('change',()=>{el('amount-label').textContent=el('mode').value==='net'?'Target cash received (CAD)':'Gross withdrawal (CAD)';});
