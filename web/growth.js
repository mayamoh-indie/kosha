const $=id=>document.getElementById(id);
const dollars=value=>new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'}).format(value);
function growthLine(label,value) {
  const row=document.createElement('div');row.className='tool-line';
  const title=document.createElement('span');title.textContent=label;
  const amount=document.createElement('strong');amount.textContent=value;row.append(title,amount);$('growth-results').append(row);
}
function clearGrowth(){for(const id of ['growth-results','growth-chart','growth-table'])$(id).replaceChildren();}
function renderGrowth(event) {
  if(event)event.preventDefault();clearGrowth();$('error').textContent='';
  try {
    const result=projectGrowth(Object.fromEntries(new FormData($('growth-form'))));
    for(const [label,value] of [['Projected balance before withdrawal tax',result.balance],['New contributions',result.contributions],['Net investment growth',result.growth],['Balance in today’s dollars',result.real],['Fee impact including lost growth',result.feeImpact]])growthLine(label,dollars(value));
    growthLine('Contributions over first 12 months (or shorter term)',dollars(result.firstPeriod));
    growthLine('Room check',result.room===null?'Not entered — room unverified':result.roomRemaining<0?`${dollars(-result.roomRemaining)} exceeds entered room`:`${dollars(result.roomRemaining)} of entered room remains`);
    if(result.roomRemaining!==null&&result.roomRemaining<0)$('error').textContent='Planned contributions exceed the available room you entered. Reduce contributions or verify room before contributing.';
    for(const item of result.rows){const row=document.createElement('tr');for(const value of [item.year,dollars(item.contributions),dollars(item.balance)]){const cell=document.createElement('td');cell.textContent=value;row.append(cell);}$('growth-table').append(row);}
    const max=Math.max(...result.rows.map(row=>row.balance),1),last=Math.max(result.rows.length-1,1);
    const points=result.rows.map((row,index)=>`${40+index/last*460},${180-row.balance/max*150}`).join(' ');
    $('growth-chart').innerHTML=`<svg viewBox="0 0 530 210" role="img" aria-label="Projected RRSP balance by year"><line x1="40" y1="180" x2="500" y2="180" stroke="#cfdcd8"/><polyline points="${points}" stroke="#397d70" stroke-width="3" fill="none"/><text x="40" y="202">Year 0</text><text x="450" y="202">Year ${result.rows.length-1}</text></svg>`;
  }catch(error){$('error').textContent=error.message;}
}
$('growth-form').onsubmit=renderGrowth;
$('growth-form').oninput=()=>{clearGrowth();$('error').textContent='Inputs changed. Project again to update your scenario.';};
renderGrowth();
