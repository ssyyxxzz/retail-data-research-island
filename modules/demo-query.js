/* Local-only query adapter: no database, credentials, network requests or persistence. */
const demoQueryColumns=[{name:'store_name',type:'text'},{name:'sku_name',type:'text'},{name:'channel_name',type:'text'},{name:'business_date',type:'date'},{name:'sales_qty',type:'numeric'},{name:'income_amount',type:'numeric'},{name:'online_gross_profit',type:'numeric'}];
const demoQueryRows=Array.from({length:18},(_,i)=>({store_name:'示例门店'+['A','B','C'][i%3],sku_name:'示例商品'+(i%6+1),channel_name:i%2?'渠道甲':'渠道乙',business_date:'2026-01-'+String(i%3+1).padStart(2,'0'),sales_qty:i+2,income_amount:30+i*7,online_gross_profit:6+i*2}));
window.demoQueryApi=async(path,options={})=>{
  const response=value=>({ok:true,json:async()=>value});
  if(path==='/schema')return response({database:'虚构数据 · 本地演示',tables:[{name:'demo.sales',columns:demoQueryColumns}]});
  const input=JSON.parse(options.body||'{}');
  let rows=demoQueryRows.filter(row=>(input.filters||[]).every(filter=>{const actual=row[filter.field],expected=filter.value;switch(filter.operator){case '>':return Number(actual)>Number(expected);case '<':return Number(actual)<Number(expected);case '>=':return Number(actual)>=Number(expected);case '<=':return Number(actual)<=Number(expected);case 'like':return String(actual).includes(String(expected).replaceAll('%',''));default:return String(actual)===String(expected)}}));
  const dims=input.dimensions||[],metrics=input.metrics||[];
  let columns;
  if(metrics.length){const groups=new Map();for(const row of rows){const key=JSON.stringify(dims.map(d=>row[d]));if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row)}columns=[...dims,...metrics.map(m=>m.aggregate+'_'+m.field)];rows=[...groups.values()].map(group=>{const result=Object.fromEntries(dims.map(d=>[d,group[0][d]]));for(const metric of metrics){const values=group.map(r=>Number(r[metric.field]));let value;switch(metric.aggregate){case 'count':value=values.length;break;case 'min':value=Math.min(...values);break;case 'max':value=Math.max(...values);break;case 'avg':value=values.reduce((s,n)=>s+n,0)/values.length;break;default:value=values.reduce((s,n)=>s+n,0)}result[metric.aggregate+'_'+metric.field]=value}return result});}
  else{columns=dims.length?dims:demoQueryColumns.map(c=>c.name);rows=rows.map(row=>Object.fromEntries(columns.map(c=>[c,row[c]])));}
  return response({columns,rows:rows.slice(0,Math.min(500,Number(input.limit)||100)),elapsedMs:1});
};
