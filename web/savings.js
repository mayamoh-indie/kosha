const $ = id => document.getElementById(id);
const money = value => new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'}).format(value);
function clearSavings() {
  for (const id of ['savings-results','savings-chart','savings-table']) $(id).replaceChildren();
}
function renderSavings(event) {
  if (event) event.preventDefault();
  clearSavings(); $('error').textContent='';
  try {
    const result = projectSavings(Object.fromEntries(new FormData($('savings-form'))));
    for (const [label,value] of [['Projected balance',result.balance],['Starting balance',result.starting],
      ['Additional deposits',result.contributions],['Total money invested',result.invested],
      ['Growth after assumed fees and tax drag',result.growth],['Final balance in today’s dollars',result.real]]) {
      const line=document.createElement('div'); line.className='tool-line';
      const title=document.createElement('span'), amount=document.createElement('strong');
      title.textContent=label; amount.textContent=money(value); line.append(title,amount); $('savings-results').append(line);
    }
    for (const item of result.rows) {
      const row=document.createElement('tr');
      for (const value of [item.year,money(item.invested),money(item.balance),money(item.real)]) {
        const cell=document.createElement('td'); cell.textContent=value; row.append(cell);
      }
      $('savings-table').append(row);
    }
    const max=Math.max(...result.rows.flatMap(row=>[row.balance,row.invested]),1), last=Math.max(result.rows.length-1,1);
    const points=key=>result.rows.map((row,index)=>`${40+index/last*460},${180-row[key]/max*150}`).join(' ');
    // Only validated calculated numbers enter the chart markup.
    $('savings-chart').innerHTML=`<svg viewBox="0 0 530 210" role="img" aria-label="Projected balance and total invested by year"><line x1="40" y1="180" x2="500" y2="180" stroke="#cfdcd8"/><polyline points="${points('invested')}" stroke="#1a4f61" stroke-dasharray="5 4" stroke-width="2" fill="none"/><polyline points="${points('balance')}" stroke="#397d70" stroke-width="3" fill="none"/><text x="40" y="202">Year 0</text><text x="450" y="202">Year ${result.rows.length-1}</text></svg>`;
  } catch (error) { clearSavings(); $('error').textContent=error.message; }
}
$('savings-form').onsubmit=renderSavings;
$('savings-form').oninput=()=>{clearSavings();$('error').textContent='Inputs changed. Calculate again to update your scenario.';};
renderSavings();
