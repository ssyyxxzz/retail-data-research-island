const source = window.LOSS_DATA;
const snapshot = source?.snapshots?.['all|全部'];
const scenarios = snapshot?.structure?.scenarios || [];
const delivery = scenarios.find(item => item.action.includes('配送'));
const discount = scenarios.find(item => item.action.includes('活动'));

const money = value => `¥${Number(value).toLocaleString('zh-CN',{maximumFractionDigits:0})}`;
const count = value => Number(value).toLocaleString('zh-CN');
const pct = value => `${Number(value).toFixed(1)}%`;

function makeParcels(container, total=40){
  container.replaceChildren(...Array.from({length:total},()=>{
    const el=document.createElement('i'); el.className='parcel'; return el;
  }));
}
function makeCoupons(container,total=40){
  container.replaceChildren(...Array.from({length:total},(_,i)=>{
    const el=document.createElement('div'); el.className='coupon'; el.innerHTML=`<i>${i%2?'−':'%'}</i>`; return el;
  }));
}

makeParcels(document.querySelector('#deliveryIcons'));
makeCoupons(document.querySelector('#discountIcons'));

function illuminate(selector, ratio){
  const items=[...document.querySelectorAll(selector)];
  const n=Math.round(Math.max(0,Math.min(1,ratio))*items.length);
  items.forEach((el,i)=>el.classList.toggle('on',i<n));
}

function renderDelivery(index){
  if(!delivery) return;
  const point=delivery.curve[index];
  const ratio=point.recoverableLoss/delivery.associatedLoss;
  document.querySelector('#deliveryStep').textContent=point.step.toFixed(1);
  document.querySelector('#deliveryGate').textContent=`− ¥${point.step.toFixed(1)}`;
  document.querySelector('#deliveryOrders').textContent=`${count(delivery.applicableOrders)} 笔`;
  document.querySelector('#deliveryTurned').textContent=count(point.turnedNonLoss);
  document.querySelector('#deliveryProfit').textContent=money(point.profitLift);
  document.querySelector('#deliveryRecovery').textContent=money(point.recoverableLoss);
  document.querySelector('#deliveryRate').textContent=pct(ratio*100);
  illuminate('#deliveryIcons .parcel',point.turnedNonLoss/delivery.applicableOrders);
}

function renderDiscount(index){
  if(!discount) return;
  const point=discount.curve[index];
  const ratio=point.recoverableLoss/discount.associatedLoss;
  document.querySelector('#discountStep').textContent=point.step;
  document.querySelector('#discountOrders').textContent=`${count(discount.applicableOrders)} 笔`;
  document.querySelector('#discountTurned').textContent=count(point.turnedNonLoss);
  document.querySelector('#discountProfit').textContent=money(point.profitLift);
  document.querySelector('#discountRecovery').textContent=money(point.recoverableLoss);
  document.querySelector('#discountRate').textContent=pct(ratio*100);
  document.querySelector('#discountPerOrder').textContent=`¥${(point.profitLift/discount.applicableOrders).toFixed(2)}`;
  illuminate('#discountIcons .coupon',ratio);
}

document.querySelector('#deliveryRange').addEventListener('input',event=>renderDelivery(+event.target.value));
document.querySelector('#discountRange').addEventListener('input',event=>renderDiscount(+event.target.value));
document.querySelectorAll('.lab-tabs button').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('.lab-tabs button').forEach(item=>item.classList.toggle('active',item===button));
  document.querySelectorAll('.experiment').forEach(item=>item.classList.remove('active'));
  document.querySelector(`#${button.dataset.tab}Lab`).classList.add('active');
}));

renderDelivery(1);
renderDiscount(2);
if(location.hash==='#query') document.querySelector('[data-tab="query"]').click();
