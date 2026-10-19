const catalog=window.IslandCatalog;
const params=new URLSearchParams(location.search);
const moduleId=catalog[params.get('module')]?params.get('module'):'overview';
const room=catalog[moduleId];
const manifest=window.IslandManifest||{resources:{},flows:[],capturedAt:'尚未同步'};
const escapeText=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
document.title=`${room.name} · 零售数据研究岛`;
document.querySelector('#roomEn').textContent=room.en+' / '+room.tag;
document.querySelector('#roomName').textContent=room.name;
document.querySelector('#roomDescription').textContent=room.description;
document.querySelector('#roomNumber').textContent=room.index;
document.querySelector('#snapshotTime').textContent=''+manifest.capturedAt;

function resourceUrl(id){
  const item=IslandResources[id],source=manifest.resources[id]||{};
  return source.url || item.url || (source.available&&item.file?'../integrations/resources/'+item.file:null);
}
function renderResources(){
  document.querySelector('#resourceGrid').innerHTML=room.resources.map(id=>{
    const item=IslandResources[id],source=manifest.resources[id]||{},url=resourceUrl(id);
    const actions=[];
    if(url) actions.push(`<button class="primary" data-preview="${id}">${item.remote?'查看线上档案':'打开'+(item.kind==='Demo'?'演示':item.kind==='工具'?'工具':'看板')} ↗</button>`);
    for(const file of source.files||[]) actions.push(`<a href="../integrations/${encodeURI(file.path)}" download>${escapeText(file.label)} ↓</a>`);
    if(!url&&!source.files?.length) actions.push(`<span class="unavailable">${source.note?escapeText(source.note):'尚未同步成果'}</span>`);
    const stamp=source.updated?'虚构数据示例 '+source.updated:item.remote?'线上页面 · 需联网':item.url?'交互演示':source.note||'按需执行';
    const guide=id==='discount-guide'?'<details><summary>查看执行步骤</summary><p>1. 确认门店全名、闪购门店 ID、调整货号与已核验模板。<br>2. 每批不超过 1000 个货号，查询并下线原活动。<br>3. 上传模板后复核折扣、限购、库存、日期与行数。<br>4. 创建活动，核验实际活动 ID 和成功结果。<br>5. 保存执行记录，并在活动调整看板登记交付。平台执行由原工具完成。</p></details>':'';
    return `<article class="resource-card" data-kind="${item.kind}"><div class="resource-meta"><span class="resource-kind">${item.kind}</span><span>${item.kind==='Demo'?'演示与验证':item.kind==='档案'?'历史留存':'研究资源'}</span></div><h2>${escapeText(item.name)}</h2><p>${escapeText(item.description)}</p><div class="resource-stamp">${escapeText(stamp)}</div><div class="resource-actions">${actions.join('')}</div>${guide}</article>`;
  }).join('');
}
function renderFlows(flows){
  const selected=(params.get('scope')==='all'?flows:flows.filter(flow=>room.flows.includes(flow.id))).slice().sort((a,b)=>(a.status==='PAUSED')-(b.status==='PAUSED')||a.time.localeCompare(b.time));
  document.querySelector('#flowList').innerHTML=selected.length?selected.map(flow=>`<article class="flow-row"><div class="flow-time">${escapeText(flow.time||'按需')}</div><div><h3>${escapeText(flow.name)}</h3><p>${escapeText(flow.evidence||'未读取执行回执；调度启用不代表本次执行完成。')}</p>${flow.observedAt?`<p>记录更新：${escapeText(flow.observedAt)}</p>`:''}</div><span class="flow-state ${flow.status==='PAUSED'?'paused':flow.receiptVerified?'success':''}">${flow.status==='DEMO'?'示例流程':flow.status==='PAUSED'?'调度已暂停':flow.receiptVerified?'有发送回执':'调度已启用'}</span></article>`).join(''):'<p class="source-detail">这个研究空间按需使用，当前没有单独配置的定时任务。</p>';
}
function switchView(view){
  document.querySelectorAll('[data-view]').forEach(button=>button.classList.toggle('active',button.dataset.view===view));
  ['resources','flows','islands'].forEach(id=>document.querySelector('#'+id+'View').hidden=id!==view);
}
document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>switchView(button.dataset.view)));
document.querySelector('#islandDirectory').innerHTML=['overview','store','inventory','forecast','loss','basket','garden'].map(id=>`<a href="?module=${id}"><small>${catalog[id].index} / ${catalog[id].en}</small><h3>${catalog[id].name} ↗</h3><p>${catalog[id].status}</p></a>`).join('');
const viewer=document.querySelector('#viewer');
document.querySelector('#resourceGrid').addEventListener('click',event=>{
  const button=event.target.closest('[data-preview]');if(!button)return;
  const id=button.dataset.preview,item=IslandResources[id],url=resourceUrl(id);if(!url)return;
  document.querySelector('#viewerTitle').textContent=item.name;
  document.querySelector('#viewerType').textContent=item.kind;
  document.querySelector('#viewerOpen').href=url;
  document.querySelector('#viewerNote').textContent=item.remote?'线上档案需要联网；若无法嵌入，可在新窗口打开。':id==='activity-board'?'已同步的活动档案，可筛选查看；上传和平台执行请使用原活动工具。':item.kind==='Demo'?'演示空间 · 请按页面标注区分规则、模拟与模型能力。':'来源时间见研究空间；可在新窗口独立查看。';
  const frame=document.createElement('iframe');frame.src=url;frame.title=item.name;frame.allow='fullscreen';
  document.querySelector('#frameHost').replaceChildren(frame);viewer.showModal();
});
document.querySelector('#closeViewer').addEventListener('click',()=>viewer.close());
viewer.addEventListener('close',()=>document.querySelector('#frameHost').replaceChildren());
async function refreshStatus(){document.querySelector('#refreshStatus').textContent='公开示例 · 不连接实际任务';renderFlows(manifest.flows);}
document.querySelector('#refreshStatus').addEventListener('click',refreshStatus);
renderResources();renderFlows(manifest.flows);switchView(['flows','islands'].includes(params.get('view'))?params.get('view'):'resources');
