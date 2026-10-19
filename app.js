const modules = window.IslandCatalog;

const world = document.querySelector('#world');
const viewport = document.querySelector('#viewport');
const avatar = document.querySelector('#avatar');
const nearby = document.querySelector('#nearby');
const nearbyName = document.querySelector('#nearbyName');
const enterButton = document.querySelector('#enterButton');
const sheet = document.querySelector('#sheet');
const arrival = document.querySelector('#arrival');
const enterIslandButton = document.querySelector('#enterIsland');
const spots = [...document.querySelectorAll('.landmark')];
const keys = new Set();
let position = { x: 52, y: 82 };
let target = null;
let nearId = null;
let lastTime = performance.now();

const orderTraffic = document.querySelector('#orderTraffic');
const inventoryTraffic = document.querySelector('#inventoryTraffic');
const orderRoutes = [
  [[101,68],[95,67],[90,62],[84,59]],
  [[103,61],[96,59],[91,57],[84,57]],
  [[101,76],[94,72],[88,67],[81,63]]
];
const inventoryRoute = [[20,68],[24,58],[36,56],[42,65],[38,72],[25,74]];
const motionTokens = [];

function addToken(layer, className, route, duration, delay) {
  const element = document.createElement('i');
  element.className = className;
  layer.appendChild(element);
  motionTokens.push({element, route, duration, delay});
}
for (let i=0;i<9;i++) addToken(orderTraffic,`order-token${i>5?' alert':''}`,orderRoutes[i>5?2:i%2],10.5+(i%3)*1.2,i/9);
for (let i=0;i<5;i++) addToken(inventoryTraffic,'inventory-token',inventoryRoute,18,i/5);

function cubic(route,t){
  if(route.length===4){const u=1-t,[a,b,c,d]=route;return [u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*d[0],u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*d[1]]}
  const scaled=t*route.length,i=Math.floor(scaled)%route.length,j=(i+1)%route.length,local=scaled-Math.floor(scaled),a=route[i],b=route[j];return[a[0]+(b[0]-a[0])*local,a[1]+(b[1]-a[1])*local]
}
function updateIslandMotion(now){
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  motionTokens.forEach(token=>{const t=reduced?token.delay:((now/1000/token.duration+token.delay)%1),p=cubic(token.route,t),p2=cubic(token.route,Math.min(.999,t+.006));token.element.style.left=`${p[0]}%`;token.element.style.top=`${p[1]}%`;token.element.style.transform=`translate(-50%,-50%) rotate(${Math.atan2(p2[1]-p[1],p2[0]-p[0])*180/Math.PI}deg)`});
}

// A hand-tuned walkable island contour in map percentages. It keeps the character on land
// while preserving the natural, non-grid layout of the painted map.
const island = [[8,53],[17,43],[28,34],[38,30],[49,34],[60,29],[71,36],[86,43],[94,57],[94,69],[84,78],[73,84],[62,86],[52,82],[42,88],[27,86],[14,77],[8,65]];

function inPolygon(x, y) {
  let inside = false;
  for (let i = 0, j = island.length - 1; i < island.length; j = i++) {
    const xi = island[i][0], yi = island[i][1], xj = island[j][0], yj = island[j][1];
    const crosses = ((yi > y) !== (yj > y)) && x < (xj - xi) * (y - yi) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

function setPosition(x, y) {
  if (!inPolygon(x, y)) return false;
  position.x = x; position.y = y;
  avatar.style.left = `${x}%`; avatar.style.top = `${y}%`;
  return true;
}

function nearestModule() {
  let result = null;
  let best = Infinity;
  for (const [id, item] of Object.entries(modules)) {
    const dx = position.x - item.entrance[0];
    const dy = (position.y - item.entrance[1]) * 1.28;
    const distance = Math.hypot(dx, dy);
    if (distance < best) { best = distance; result = id; }
  }
  return best < 6.8 ? result : null;
}

function updateNearby() {
  const next = nearestModule();
  if (next === nearId) return;
  nearId = next;
  spots.forEach(spot => spot.classList.toggle('is-near', spot.dataset.id === next));
  if (!next) { nearby.classList.remove('show'); return; }
  const item = modules[next];
  nearbyName.textContent = item.name;
  nearby.style.left = `${position.x}%`;
  nearby.style.top = `${position.y}%`;
  nearby.classList.add('show');
}

function moveTo(x, y) {
  if (!inPolygon(x, y)) return;
  target = { x, y };
  avatar.classList.add('walking');
  if (x < position.x) avatar.classList.add('facing-left');
  else avatar.classList.remove('facing-left');
}

function tick(now) {
  const dt = Math.min((now - lastTime) / 1000, .04);
  lastTime = now;
  let dx = 0, dy = 0;
  if (keys.has('w') || keys.has('arrowup')) dy -= 1;
  if (keys.has('s') || keys.has('arrowdown')) dy += 1;
  if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
  if (keys.has('d') || keys.has('arrowright')) dx += 1;

  if (dx || dy) {
    target = null;
    const mag = Math.hypot(dx, dy);
    dx /= mag; dy /= mag;
    avatar.classList.add('walking');
    avatar.classList.toggle('facing-left', dx < 0);
    setPosition(position.x + dx * 10.5 * dt, position.y + dy * 10.5 * dt);
  } else if (target) {
    const tx = target.x - position.x, ty = target.y - position.y;
    const dist = Math.hypot(tx, ty);
    if (dist < .22) { target = null; avatar.classList.remove('walking'); }
    else setPosition(position.x + tx / dist * 9.2 * dt, position.y + ty / dist * 9.2 * dt);
  } else avatar.classList.remove('walking');

  updateNearby();
  updateIslandMotion(now);
  requestAnimationFrame(tick);
}

viewport.addEventListener('pointerdown', event => {
  if (event.target.closest('button,a,.sheet')) return;
  const rect = world.getBoundingClientRect();
  moveTo((event.clientX - rect.left) / rect.width * 100, (event.clientY - rect.top) / rect.height * 100);
});

spots.forEach(spot => spot.addEventListener('click', event => {
  event.stopPropagation();
  const item = modules[spot.dataset.id];
  moveTo(item.entrance[0], item.entrance[1]);
}));

window.addEventListener('keydown', event => {
  if (!sheet.hidden || (arrival && !arrival.hidden)) {
    if (event.key === 'Escape' && !sheet.hidden) closeSheet();
    return;
  }
  const key = event.key.toLowerCase();
  if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key)) {
    event.preventDefault(); keys.add(key);
  }
  if (key === 'e' && nearId && sheet.hidden) openModule(nearId);
  if (key === 'escape' && !sheet.hidden) closeSheet();
});
window.addEventListener('keyup', event => keys.delete(event.key.toLowerCase()));
window.addEventListener('blur', () => keys.clear());

function openModule(id) {
  target = null;
  keys.clear();
  const item = modules[id];
  document.querySelector('#sheetIndex').textContent = item.index;
  document.querySelector('#sheetTitle').textContent = item.name;
  document.querySelector('#sheetEn').textContent = item.en;
  document.querySelector('#sheetDescription').textContent = item.description;
  document.querySelector('#sheetStatus').textContent = item.status;
  const open = document.querySelector('#sheetOpen');
  open.href = item.href || '#';
  open.classList.toggle('is-disabled', !item.href);
  open.innerHTML = '进入研究空间 <span>↗</span>';
  sheet.hidden = false;
  requestAnimationFrame(() => document.querySelector('.sheet__close').focus());
}
function closeSheet() { sheet.hidden = true; enterButton.focus({preventScroll:true}); }
enterButton.addEventListener('click', () => nearId && openModule(nearId));
document.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeSheet));
document.querySelector('#dismissHint').addEventListener('click', () => document.querySelector('#hint').classList.add('is-hidden'));

function enterIsland() {
  if (!arrival || arrival.classList.contains('is-entering')) return;
  setIslandAudio(true);
  arrival.classList.add('is-entering');
  document.body.classList.add('has-arrived');
  window.setTimeout(() => {
    arrival.hidden = true;
    viewport.focus({preventScroll:true});
  }, 1250);
}
enterIslandButton?.addEventListener('click', enterIsland);
arrival?.addEventListener('keydown', event => {
  if (event.key === 'Enter' || event.key === ' ') enterIsland();
});
if (location.hash === '#island' && arrival) {
  arrival.hidden = true;
  document.body.classList.add('has-arrived');
}

// Delicate data motes: cool prediction particles across the island and sparse warm
// anomaly signals near the harbor. Canvas owns motion only; the illustrated world stays intact.
const waterCanvas = document.querySelector('#waterMotion');
const waterCtx = waterCanvas.getContext('2d');
const ripples = [];
const canvas = document.querySelector('#atmosphere');
const ctx = canvas.getContext('2d');
const motes = [];
function resizeCanvas() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  waterCanvas.width = Math.round(world.clientWidth * dpr); waterCanvas.height = Math.round(world.clientHeight * dpr);
  waterCanvas.style.width = `${world.clientWidth}px`; waterCanvas.style.height = `${world.clientHeight}px`;
  waterCtx.setTransform(dpr,0,0,dpr,0,0);
  canvas.width = Math.round(world.clientWidth * dpr); canvas.height = Math.round(world.clientHeight * dpr);
  canvas.style.width = `${world.clientWidth}px`; canvas.style.height = `${world.clientHeight}px`;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  motes.length = 0;
  for (let i = 0; i < 72; i++) motes.push({
    x: Math.random() * world.clientWidth, y: Math.random() * world.clientHeight,
    r: Math.random() * 1.25 + .25, vx: Math.random() * .08 + .015,
    vy: (Math.random() - .7) * .055, phase: Math.random() * Math.PI * 2
  });
  ripples.length = 0;
  const regions = [
    {x:[0,100],y:[86,101],amount:34},
    {x:[0,15],y:[51,88],amount:12},
    {x:[88,101],y:[53,88],amount:14},
    {x:[44,55],y:[69,86],amount:8},
    {x:[75,91],y:[55,69],amount:7}
  ];
  regions.forEach(region => {
    for (let i=0;i<region.amount;i++) ripples.push({
      x:(region.x[0]+Math.random()*(region.x[1]-region.x[0]))/100*world.clientWidth,
      y:(region.y[0]+Math.random()*(region.y[1]-region.y[0]))/100*world.clientHeight,
      region,
      width:12+Math.random()*42,
      speed:4+Math.random()*8,
      phase:Math.random()*Math.PI*2,
      alpha:.08+Math.random()*.13
    });
  });
}
function drawWater(time) {
  const width=world.clientWidth,height=world.clientHeight;
  waterCtx.clearRect(0,0,width,height);
  waterCtx.lineCap='round';
  for (const ripple of ripples) {
    ripple.x += ripple.speed/60;
    const maxX=ripple.region.x[1]/100*width;
    if(ripple.x-ripple.width>maxX) ripple.x=ripple.region.x[0]/100*width-ripple.width;
    const lift=Math.sin(time*.00055+ripple.phase)*2.2;
    const pulse=.55+(Math.sin(time*.0008+ripple.phase)+1)*.22;
    waterCtx.beginPath();
    waterCtx.moveTo(ripple.x,ripple.y+lift);
    waterCtx.quadraticCurveTo(ripple.x+ripple.width*.48,ripple.y+lift-1.8,ripple.x+ripple.width,ripple.y+lift);
    waterCtx.strokeStyle=`rgba(244,255,248,${ripple.alpha*pulse})`;
    waterCtx.lineWidth=.7+(ripple.width/60);
    waterCtx.stroke();
  }
  requestAnimationFrame(drawWater);
}
function drawMotes(time) {
  ctx.clearRect(0,0,world.clientWidth,world.clientHeight);
  for (const mote of motes) {
    mote.x += mote.vx; mote.y += mote.vy;
    if (mote.x > world.clientWidth + 5) mote.x = -5;
    if (mote.y < -5) mote.y = world.clientHeight + 5;
    const alpha = .12 + (Math.sin(time * .0007 + mote.phase) + 1) * .15;
    ctx.beginPath(); ctx.arc(mote.x,mote.y,mote.r,0,Math.PI*2);
    ctx.fillStyle = `rgba(235,255,255,${alpha})`; ctx.fill();
  }
  requestAnimationFrame(drawMotes);
}
new ResizeObserver(resizeCanvas).observe(world);
requestAnimationFrame(drawWater);
requestAnimationFrame(drawMotes);

// Selected score: “Sea-flower Walk”. It starts from the explicit arrival click,
// respecting browser autoplay rules, and fades instead of cutting abruptly.
const islandBgm=document.querySelector('#islandBgm');
let bgmFadeFrame=null;
function fadeBgm(target,duration=900){
  if(bgmFadeFrame) cancelAnimationFrame(bgmFadeFrame);
  const initial=islandBgm.volume;
  const started=performance.now();
  const step=now=>{
    const progress=Math.min(1,(now-started)/duration);
    const eased=progress*(2-progress);
    islandBgm.volume=initial+(target-initial)*eased;
    if(progress<1) bgmFadeFrame=requestAnimationFrame(step);
    else if(target===0) islandBgm.pause();
  };
  bgmFadeFrame=requestAnimationFrame(step);
}
async function setIslandAudio(enabled) {
  const button=document.querySelector('#soundToggle');
  button.setAttribute('aria-pressed',String(enabled));
  if(enabled){
    islandBgm.volume=0;
    try{await islandBgm.play();fadeBgm(.32,1400)}catch(error){button.setAttribute('aria-pressed','false')}
  }else fadeBgm(0,700);
}
document.querySelector('#soundToggle').addEventListener('click',event=>setIslandAudio(event.currentTarget.getAttribute('aria-pressed')!=='true'));

setPosition(position.x, position.y);
requestAnimationFrame(tick);
