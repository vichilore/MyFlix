/* ==========================
   VichiFlix – app.js (refactor, watch minimal + stagioni)
   ========================== */

/* ---------- utils DOM ---------- */
const $  = (s)=>document.querySelector(s);

/* ---------- AUTH ---------- */
const lockscreen = $('#lockscreen');
const app        = $('.app');
const devBtn     = $('#devBypassBtn');

if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
  devBtn.style.display = 'block';
}
devBtn?.addEventListener('click', () => {
  localStorage.setItem('vichi_auth','1');
  lockscreen.style.display='none';
  app.style.display='block';
});

async function checkPassword(password){
  try{
    const res = await fetch('/.netlify/functions/check-pass', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ password })
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.success === true;
  }catch{ return false; }
}
$('#passBtn').onclick = async ()=>{
  const val = $('#passInput').value.trim();
  const ok = await checkPassword(val);
  if (ok){ localStorage.setItem('vichi_auth','1'); lockscreen.style.display='none'; app.style.display='block'; }
  else alert('Password errata!');
};
(function initAuth(){
  if (localStorage.getItem('vichi_auth') === '1') { lockscreen.style.display='none'; app.style.display='block'; }
})();

/* ---------- SNAP DOCK (header + nav pill) ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const dockNodes = [
    document.querySelector('.main-header'),
    document.querySelector('.nav-center-box'),
  ].filter(Boolean);

  function setDockHeight(){
    if (!dockNodes.length) return;
    let maxBottom = 0;
    for (const el of dockNodes){
      const r = el.getBoundingClientRect();
      const pos = getComputedStyle(el).position;
      const isDocking = (pos==='fixed' || pos==='sticky') && r.top <= 0 && r.bottom > 0;
      if (isDocking) maxBottom = Math.max(maxBottom, r.bottom);
    }
    if (maxBottom === 0 && dockNodes[0]) maxBottom = dockNodes[0].offsetHeight;
    document.documentElement.style.setProperty('--dock-h', Math.ceil(maxBottom) + 'px');
  }
  const raf = () => requestAnimationFrame(setDockHeight);
  raf();
  window.addEventListener('resize', raf, { passive:true });
  window.addEventListener('scroll', raf, { passive:true });
  if (document.fonts?.ready) document.fonts.ready.then(setDockHeight);
});

/* ---------- CATALOGO (uguale) ---------- */
const CATALOG = [  { id:'onepiece', title:'One Piece (ITA)', poster:'https://i.imgur.com/TrSAzFm.jpeg', language:'ITA',
    structure:{ kind:'continuous', total:900, numbering:'absolute' },
    path:{ base:'https://serverfile.club/anime/onepiece/ita', folder:{ mode:'dynamic' }, file:{ pad:3 } }
  },
  { id:'onepiece-sub', title:'One Piece (SUB-ITA)', poster:'https://i.imgur.com/KVorMG3.jpeg', language:'SUB-ITA',
    structure:{ kind:'continuous', total:1200, numbering:'absolute' },
    path:{ base:'https://serverfile.club/anime/onepiece/subita', folder:{ mode:'dynamic' }, file:{ pad:3 } }
  },
  { id:'aot', title:'Attack on Titan (ITA)', poster:'https://i.imgur.com/OT7u7TG.jpeg', language:'ITA',
    structure:{ kind:'seasonal', seasons:[25,12,22,30], numbering:'perSeason' },
    path:{ base:'https://serverfile.club/anime/attack-on-titan', langSegment:'ita', folder:{ mode:'fixed', fixed:'001_100' }, file:{ prefix:'AOT', pad:2 }, seasonPad:2 }
  },
  { id:'aot-sub', title:'Attack on Titan (SUB-ITA)', poster:'https://i.imgur.com/nC8Io7P.jpeg', language:'SUB-ITA',
    structure:{ kind:'seasonal', seasons:[25,12,22,30], numbering:'perSeason' },
    path:{ base:'https://serverfile.club/anime/attack-on-titan', langSegment:'subita', folder:{ mode:'fixed', fixed:'001_100' }, file:{ prefix:'AOT', pad:2 }, seasonPad:2 }
  },
  { id:'blackclover-sub', title:'Black Clover (SUB-ITA)', poster:'https://i.imgur.com/oRnLN7S.jpeg', language:'SUB-ITA',
    structure:{ kind:'continuous', total:170, numbering:'absolute' },
    path:{ base:'https://serverfile.club/anime/black-clover/subita', folder:{ mode:'dynamic' }, file:{ pad:3 } }
  },
  { id:'hellsparadise-sub', title:"Hell's Paradise (SUB-ITA)", poster:'https://i.imgur.com/yb7QXmY.jpeg', language:'SUB-ITA',
    structure:{ kind:'seasonal', seasons:[13], numbering:'perSeason' },
    path:{ base:"https://serverfile.club/anime/hell-s-paradise", langSegment:'subita', folder:{ mode:'fixed', fixed:'001_100' }, file:{ pad:2 } }
  },
  { id:'chainsawman-sub', title:'Chainsaw Man (SUB-ITA)', poster:'https://i.imgur.com/sEVbCUY.jpeg', language:'SUB-ITA',
    structure:{ kind:'seasonal', seasons:[12], numbering:'perSeason' },
    path:{ base:'https://serverfile.club/anime/chainsaw-man', langSegment:'subita', folder:{ mode:'fixed', fixed:'001_100' }, file:{ pad:3 }, omitS1Segment:true }
  },
  { id:'chainsawman', title:'Chainsaw Man (ITA)', poster:'https://i.imgur.com/cKGKfQq.jpeg', language:'ITA',
    structure:{ kind:'seasonal', seasons:[12], numbering:'perSeason' },
    path:{ base:'https://serverfile.club/anime/chainsaw-man', langSegment:'ita', folder:{ mode:'fixed', fixed:'001_100' }, file:{ pad:3 }, omitS1Segment:true }
  },
  { id:'assassinationclassroom-sub', title:'Assassination Classroom (SUB-ITA)', poster:'https://i.imgur.com/pkXQMw9.jpeg', language:'SUB-ITA',
    structure:{ kind:'seasonal', seasons:[22,25], numbering:'perSeason' },
    path:{ base:'https://serverfile.club/anime/assassination-classroom', langSegment:'subita', folder:{ mode:'fixed', fixed:'001_100' }, file:{ pad:2 } }
  },
  { id:'assassinationclassroom', title:'Assassination Classroom (ITA)', poster:'https://i.imgur.com/x6EIsQp.jpeg', language:'ITA',
    structure:{ kind:'seasonal', seasons:[22,25], numbering:'perSeason' },
    path:{ base:'https://serverfile.club/anime/assassination-classroom', langSegment:'ita', folder:{ mode:'fixed', fixed:'001_100' }, file:{ pad:2 } }
  },
  { id:'bleach-sub', title:'Bleach (SUB-ITA)', poster:'https://i.imgur.com/Pi5uEyd.jpeg', language:'SUB-ITA',
    structure:{ kind:'continuous', total:366, numbering:'absolute' },
    path:{ base:'https://serverfile.club/anime/bleach/subita', folder:{ mode:'dynamic' }, file:{ pad:3 } }
  },
  { id:'bleach', title:'Bleach (ITA)', poster:'https://i.imgur.com/nTw3flE.jpeg', language:'ITA',
    structure:{ kind:'continuous', total:366, numbering:'absolute' },
    path:{ base:'https://serverfile.club/anime/bleach/ita', folder:{ mode:'dynamic' }, file:{ pad:3 } }
  },
  { id:'deathnote', title:'Death Note (ITA)', poster:'https://i.imgur.com/YGSr7ua.jpeg', language:'ITA',
    structure:{ kind:'seasonal', seasons:[37], numbering:'perSeason' },
    path:{ base:'https://serverfile.club/anime/death-note', langSegment:'ita', folder:{ mode:'fixed', fixed:'001_100' }, file:{ prefix:'D', pad:2 }, omitS1Segment:true }
  },
  { id:'dandadan-sub', title:'Dandadan (SUB-ITA)', poster:'https://i.imgur.com/doXwRWH.jpeg', language:'SUB-ITA',
    structure:{ kind:'seasonal', seasons:[12,12], numbering:'perSeason' },
    path:{ base:'https://serverfile.club/anime/dandadan', langSegment:'subita', folder:{ mode:'fixed', fixed:'001_100' }, file:{ pad:2 }, omitS1Segment:true }
  },
  { id:'dandadan', title:'Dandadan (ITA)', poster:'https://i.imgur.com/pMzKPs8.jpeg', language:'ITA',
    structure:{ kind:'seasonal', seasons:[12,12], numbering:'perSeason' },
    path:{ base:'https://serverfile.club/anime/dandadan', langSegment:'ita', folder:{ mode:'fixed', fixed:'001_100' }, file:{ pad:2 }, omitS1Segment:true }
  }];

/* ---------- RIFERIMENTI WATCH/PLAYER ---------- */
const home          = $('#home');
const watch         = $('#watch');
const watchBanner   = $('#watchBanner');
const watchTitle    = $('#watchTitle');
const seasonPicker  = $('#seasonPicker');
const episodeList   = $('#episodeList');

const watchResumeBtn = document.getElementById('watchResumeBtn');
const playerOverlay = document.getElementById('playerOverlay');
const playerClose   = document.getElementById('playerClose');
const video         = document.getElementById('video');
const sourceEl      = document.getElementById('episode');
const nowTitle      = document.getElementById('nowTitle');
const nowInfo       = document.getElementById('nowInfo');
const prevEpBtn     = document.getElementById('prevEp');
const nextEpBtn     = document.getElementById('nextEp');

/* ---------- STATO ---------- */
let current      = null;  // serie corrente
let currentEp    = null;  // episodio corrente (indice globale)
let currentSeas  = 1;     // stagione selezionata (per stagionali)

/* ---------- HELPERS ---------- */
const pad  = (n,len)=>String(n).padStart(len,'0');
const pad3 = (n)=>pad(n,3);
const normBase = (url='') => url.trim().replace(/\s+/g,'').replace(/\/+$/,'');

function totalEpisodes(series){
  return series.structure.kind==='seasonal'
    ? (series.structure.seasons||[]).reduce((a,b)=>a+b,0)
    : (series.structure.total||0);
}
function seasonFromAbsolute(series, absEp){
  let s=1, left=absEp;
  for (const eps of (series.structure.seasons||[])){
    if (left <= eps) return { season:s, epInSeason:left, seasonEnd:eps };
    left -= eps; s++;
  }
  const last = (series.structure.seasons||[]).slice(-1)[0]||left;
  return { season:s-1, epInSeason:left, seasonEnd:last };
}
function folderFor(n, cap){
  const start=Math.floor((n-1)/100)*100+1;
  const globalCap=Math.max(100,Math.ceil((cap||n)/100)*100);
  const end=Math.min(start+99, globalCap);
  return `${pad3(start)}_${pad3(end)}`;
}
function seasonSegment(path, season){ const omit=!!path.omitS1Segment; const sp=path.seasonPad??2; return (omit && season===1)? '' : `/${pad(season,sp)}`; }
function episodeFileName(fileCfg,num){ const prefix=fileCfg.prefix||''; const p=fileCfg.pad??3; return `${prefix}${pad(num,p)}.mp4`; }
function buildEpisodeUrl(series, absEp){
  const { structure, path } = series;
  const base = normBase(path.base || '');
  if (structure.kind === 'seasonal'){
    const { season, epInSeason, seasonEnd } = seasonFromAbsolute(series, absEp);
    const seg  = seasonSegment(path, season);
    const lang = path.langSegment ? `/${path.langSegment}` : '';
    const folder = path.folder.mode === 'fixed' ? (path.folder.fixed||'001_100') : folderFor(epInSeason, seasonEnd);
    const numberForFile = (structure.numbering === 'absolute') ? absEp : epInSeason;
    const file = episodeFileName(path.file||{}, numberForFile);
    return `${base}${seg}${lang}/${folder}/${file}`;
  }
  const cap = totalEpisodes(series) || absEp;
  const folder = path.folder.mode === 'fixed' ? (path.folder.fixed||'001_100') : folderFor(absEp, cap);
  const file = episodeFileName(path.file||{}, absEp);
  return `${base}/${folder}/${file}`;
}


// Salva uno snapshot immediato dello stato corrente del player
function persistProgressSnapshot(){
  try{
    if (!current || !currentEp) return;
    const video = document.getElementById('video');
    const t = video?.currentTime || 0;
    const d = video?.duration || 0;
    if (d > 0) setPosition(current.id, currentEp, t, d); // salva subito
  }catch{}
}

// Aggiorna il bottone "Riprendi" nel watch hero per la serie indicata
function updateWatchResumeUI(series){
  const btn = document.getElementById('watchResumeBtn');
  if (!btn || !series) return;

  const progress = loadProgress(series.id);
  let resumeEp = 0;

  // 1) Cerca l'episodio con posizione parziale più recente
  if (progress?.positions){
    const entries = Object.entries(progress.positions)
      .filter(([n,p]) => p && typeof p.t === 'number' && typeof p.d === 'number' && p.t < (p.d - 10));
    if (entries.length){
      entries.sort((a,b) => (b[1].ts||0) - (a[1].ts||0));
      resumeEp = parseInt(entries[0][0], 10);
    }
  }

  // 2) Fallback: se esiste lastEpisode con posizione parziale valida
  if (!resumeEp && progress?.lastEpisode){
    const lp = progress.positions?.[progress.lastEpisode];
    if (lp && lp.t && lp.d && lp.t < lp.d - 10) resumeEp = progress.lastEpisode;
  }

  // 3) Mostra/nascondi il bottone
  if (resumeEp){
    btn.style.display = 'inline-flex';
    btn.textContent = `▶ Riprendi episodio ${String(resumeEp).padStart(2,'0')}`;
    btn.onclick = () => playEpisode(series, resumeEp);
  } else {
    btn.style.display = 'none';
  }
}

/* ---------- STORAGE PROGRESSI ---------- */
const storageKey = (id)=>`vichi_progress_${id}`;
const loadProgress = (id)=>{ try{ return JSON.parse(localStorage.getItem(storageKey(id))||'{}') }catch{ return {} } };
const saveProgress = (id,data)=> localStorage.setItem(storageKey(id), JSON.stringify(data||{}));
const setLastEpisode = (id,n)=>{ const p=loadProgress(id); p.lastEpisode=n; saveProgress(id,p); };
const setPosition = (id,n,t,d)=>{ const p=loadProgress(id); (p.positions??= {}); p.positions[n]={ t:t||0, d:d||p.positions?.[n]?.d||0, ts:Date.now() }; saveProgress(id,p); };
const clearPosition = (id,n)=>{ const p=loadProgress(id); if (p.positions){ delete p.positions[n]; saveProgress(id,p);} };
const markWatched = (id,n)=>{ const p=loadProgress(id); (p.watched??={}); p.watched[n]=true; if (p.positions) delete p.positions[n]; p.lastEpisode=n; saveProgress(id,p); };
const isWatched = (id,n)=> !!(loadProgress(id).watched?.[n]);
const getPosition = (id,n)=> loadProgress(id).positions?.[n] ?? null;

/* ---------- HOME CAROUSELS (rimane come prima) ---------- */
function createCarouselRow({ id, title, items, size='default', onClick }){
  if (!items || !items.length) return null;

  const row = document.createElement('div');
  row.className = 'row' + (size==='xl' ? ' row--xl': '');
  row.innerHTML = `
    <div class="row-head">
      <div class="row-title">${title}</div>
      <div class="row-ctrls">
        <button class="arrow" id="${id}-prev" aria-label="Scorri a sinistra">◀</button>
        <button class="arrow" id="${id}-next" aria-label="Scorri a destra">▶</button>
      </div>
    </div>
  `;
  const track = document.createElement('div');
  track.className = 'carousel'; track.id = `${id}-track`;
  row.appendChild(track);

  // fade-right dinamico
  function updateFades(){
    const max = track.scrollWidth - track.clientWidth;
    row.classList.toggle('has-fade-right', track.scrollLeft < max - 2);
  }
  track.addEventListener('scroll', updateFades, { passive: true });
  new ResizeObserver(updateFades).observe(track);
  requestAnimationFrame(updateFades);

  // cards
  for (const item of items){
    const cell = document.createElement('div'); cell.className='c-item';
    const card = document.createElement('div'); card.className = size==='xl' ? 'c-card c-card--xl' : 'c-card';
    const img  = document.createElement('img'); img.className = size==='xl' ? 'c-poster c-poster--xl' : 'c-poster';
    img.src=item.poster; img.alt=item.title;
    img.onerror = ()=>{ img.src='data:image/svg+xml;utf8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect width="100%" height="100%" fill="#131318"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#fff" font-family="Arial" font-size="24">${item.title}</text></svg>`); };
    card.appendChild(img);

    if (size==='xl'){
      const grad=document.createElement('div'); grad.className='c-grad--xl';
      const info=document.createElement('div'); info.className='c-info--xl';
      const titleEl=document.createElement('div'); titleEl.className='c-title--xl'; titleEl.textContent=item.title;
      const chips=document.createElement('div'); chips.className='c-chips';
      if (item.language) chips.appendChild(chip(item.language));
      info.appendChild(titleEl); info.appendChild(chips);
      card.appendChild(grad); card.appendChild(info);
    } else {
      const meta=document.createElement('div'); meta.className='c-meta';
      if (item.language) meta.innerHTML=`<span class="badge">${item.language}</span>`;
      card.appendChild(meta);
    }
    card.addEventListener('click', ()=> openSeries(item));
    cell.appendChild(card); track.appendChild(cell);
  }

  function chip(text){ const s=document.createElement('span'); s.className='c-chip'; s.textContent=text; return s; }

  const prev=row.querySelector(`#${id}-prev`), next=row.querySelector(`#${id}-next`);
  const step = ()=> { const c = track.querySelector('.c-item'); return (c ? c.getBoundingClientRect().width : 280) * (size==='xl' ? 1.2 : 3); };
  prev.onclick = ()=> track.scrollBy({ left: -step(), behavior:'smooth' });
  next.onclick = ()=> track.scrollBy({ left:  step(), behavior:'smooth' });

  return row;
}

function renderHome(){
  const homeCarousels = $('#homeCarousels');
  homeCarousels.innerHTML='';

  const resumeItems = CATALOG
    .map(s => { const p = loadProgress(s.id); const has=(p?.lastEpisode || (p?.positions && Object.keys(p.positions).length)); return has ? { s, ts: p?.positions?.[p.lastEpisode]?.ts || 0 } : null; })
    .filter(Boolean).sort((a,b)=>(b.ts||0)-(a.ts||0)).map(x=>x.s).slice(0,20);
  const rowResume = createCarouselRow({ id:'row-resume', title:'Riprendi da dove hai interrotto', items:resumeItems, size:'xl' });
  if (rowResume) homeCarousels.appendChild(rowResume);

  const ita = CATALOG.filter(s=>s.language==='ITA');
  const sub = CATALOG.filter(s=>s.language==='SUB-ITA');
  const rowIta = createCarouselRow({ id:'row-ita', title:'Doppiati in ITA', items:ita });
  const rowSub = createCarouselRow({ id:'row-sub', title:'SUB-ITA', items:sub });
  if (rowIta) homeCarousels.appendChild(rowIta);
  if (rowSub) homeCarousels.appendChild(rowSub);

  const top = createCarouselRow({ id:'row-top', title:'In evidenza', items:CATALOG.slice(0,15) });
  if (top) homeCarousels.appendChild(top);
}

/* ---------- WATCH PAGE ---------- */
function openSeries(series){
  current = series;
  home.style.display = 'none';
  watch.style.display = 'block';

  watchBanner.src = series.banner || series.poster || '';
  watchTitle.textContent = series.title || 'Titolo';

 updateWatchResumeUI(series);

  // build seasons & episodes
  buildSeasonPicker(series);
  renderEpisodeButtons(series, currentSeas);
}

function buildSeasonPicker(series){
  seasonPicker.innerHTML = '';
  if (series.structure.kind === 'seasonal'){
    const totalS = (series.structure.seasons||[]).length;
    currentSeas = Math.min(currentSeas, totalS) || 1;
    for (let s=1; s<=totalS; s++){
      const pill = document.createElement('button');
      pill.className = 'season-pill' + (s===currentSeas ? ' active':'');
      pill.textContent = `Stagione ${String(s).padStart(2,'0')}`;
      pill.onclick = ()=>{ currentSeas = s; buildSeasonPicker(series); renderEpisodeButtons(series, s); };
      seasonPicker.appendChild(pill);
    }
  } else {
    currentSeas = 1;
    const pill = document.createElement('button');
    pill.className = 'season-pill active';
    pill.textContent = 'Tutti gli episodi';
    pill.onclick = ()=>{ currentSeas = 1; renderEpisodeButtons(series, 1); };
    seasonPicker.appendChild(pill);
  }
}

function renderEpisodeButtons(series, season){
  episodeList.innerHTML = '';

  let start = 1, count = totalEpisodes(series);
  if (series.structure.kind === 'seasonal'){
    const seasons = series.structure.seasons||[];
    start = seasons.slice(0, season-1).reduce((a,b)=>a+b,0) + 1;
    count = seasons[season-1] || 0;
  }

  for (let i=0; i<count; i++){
    const globalEp = start + i;
    const btn = document.createElement('button');
    btn.className = 'episode-btn';
    btn.dataset.ep = String(globalEp);
    btn.textContent = pad3(series.structure.kind==='seasonal' ? i+1 : globalEp);
    if (isWatched(series.id, globalEp)) btn.classList.add('watched');

    btn.onclick = ()=> playEpisode(series, globalEp);
    episodeList.appendChild(btn);
  }
}

function updateEpisodeButtonState(seriesId, ep){
  const btn = episodeList.querySelector(`.episode-btn[data-ep="${ep}"]`);
  if (btn) btn.classList.add('watched');
}

/* ---------- PLAYER ---------- */
// Normalizza argomenti: (series, n) oppure (n) usando `current`
function normalizePlayArgs(arg1, arg2){
  if (typeof arg1 === 'object' && arg1 !== null) return { series: arg1, ep: arg2 || 1 };
  return { series: current, ep: arg1 || 1 };
}

// --- CORE: fa davvero partire il video e mostra l'overlay ---
function playEpisodeCore(series, ep){
  if (!series || !ep) return;

  current = series;
  currentEp = ep;

  // sempre dentro l’overlay, per evitare ID duplicati
  const overlay  = document.getElementById('playerOverlay');
  // se l'overlay fosse in un wrapper con overflow/transform, spostiamolo in body
  if (overlay.parentElement !== document.body) {
    document.body.appendChild(overlay);
  }

  const video     = overlay.querySelector('video');
  const sourceEl  = overlay.querySelector('#episode');
  const nowTitle  = overlay.querySelector('#nowTitle');
  const nowInfo   = overlay.querySelector('#nowInfo');
  const prevEpBtn = overlay.querySelector('#prevEp');
  const nextEpBtn = overlay.querySelector('#nextEp');

  const src = buildEpisodeUrl(series, ep);
  sourceEl.src = src;
  video.load();

  nowTitle.textContent = `${series.title} — Episodio ${ep}`;
  nowInfo.textContent  = src.split('/').slice(-2).join('/');

  setLastEpisode(series.id, ep);

  // mostra overlay + blocca lo scroll dietro (forziamo anche display per sicurezza)
  overlay.classList.add('show');
  overlay.style.display = 'flex';
  document.documentElement.style.overflow = 'hidden';
  overlay.setAttribute('tabindex','-1');
  overlay.focus({ preventScroll:true });

  // riprendi posizione salvata
  const pos = getPosition(series.id, ep);
  const trySeek = ()=>{
    if (pos && typeof pos.t==='number' && pos.t>5) video.currentTime = Math.max(0, pos.t-1);
    video.play().catch(()=>{});
  };
  if (video.readyState>=2) trySeek(); else video.addEventListener('canplay', trySeek, { once:true });

  // bind prev/next
  prevEpBtn.onclick = ()=> moveEpisode(ep-1);
  nextEpBtn.onclick = ()=> moveEpisode(ep+1);
}

// --- PUBLIC: unica API che chiami ovunque ---
function playEpisode(arg1, arg2){
  const { series, ep } = normalizePlayArgs(arg1, arg2);
  playEpisodeCore(series, ep);

  // broadcast a "Guarda insieme" (se host)
  try{
    if (typeof tog?.inRoom === 'function' && tog.inRoom() && tog.isHost && series){
      togSend('CHANGE_EP', { seriesId: series.id, ep });
    }
  }catch{}
}

function moveEpisode(n){
  if (!current) return;
  const max = totalEpisodes(current);
  if (n < 1 || n > max) return;

  // Se cambia stagione, riallinea selettore + elenco
  if (current.structure?.kind === 'seasonal'){
    const { season } = seasonFromAbsolute(current, n);
    if (season !== currentSeas){
      currentSeas = season;
      buildSeasonPicker(current);
      renderEpisodeButtons(current, currentSeas);
    }
  }
  // Avvia direttamente col nuova API
  playEpisode(current, n);
}

function closePlayer(){
  const overlay = document.getElementById('playerOverlay');
  const video   = overlay.querySelector('video');
  const sourceEl= overlay.querySelector('#episode');

  // salva subito l'ultimo punto
  persistProgressSnapshot();

  try { video.pause(); } catch {}
  sourceEl.src = '';
  overlay.classList.remove('show');
  overlay.style.display = 'none';
  document.documentElement.style.overflow = '';

  // aggiorna il bottone Riprendi della serie aperta
  if (current) updateWatchResumeUI(current);
}
document.getElementById('playerClose')?.addEventListener('click', closePlayer);

// autosave + tick ✓ verde
let lastSave = 0;
video.addEventListener('timeupdate', ()=>{
  const now=Date.now(); if (!current || !currentEp) return; if (now-lastSave<2000) return; lastSave=now;
  const t=video.currentTime||0, d=video.duration||0;
  if (d>0){
    setPosition(current.id, currentEp, t, d);
    if (t/d>=0.9){ markWatched(current.id,currentEp); updateEpisodeButtonState(current.id, currentEp); }
  }
});
video.addEventListener('ended', ()=>{
  if (!current || !currentEp) return;
  markWatched(current.id,currentEp);
  clearPosition(current.id,currentEp);
  updateEpisodeButtonState(current.id, currentEp);
  // auto-next se disponibile
  const max = totalEpisodes(current);
  if (currentEp < max) moveEpisode(currentEp+1);
});

// scorciatoie tastiera nel player
playerOverlay.addEventListener('keydown', (e)=>{
  // evitiamo conflitti con input
  if (/(input|textarea|select)/i.test(e.target.tagName)) return;
  switch(e.key){
    case ' ':
      e.preventDefault();
      if (video.paused) video.play().catch(()=>{}); else video.pause();
      break;
    case 'ArrowLeft':
      video.currentTime = Math.max(0, (video.currentTime||0) - 5);
      break;
    case 'ArrowRight':
      video.currentTime = Math.min(video.duration||1e9, (video.currentTime||0) + 5);
      break;
    case 'Escape':
      closePlayer();
      break;
    case 'n': case 'N':
      nextEpBtn?.click();
      break;
    case 'p': case 'P':
      prevEpBtn?.click();
      break;
  }
});


/* ---------- WATCH TOGETHER ---------- */
const WS_URL = window.VICHIFLIX_WS_URL || '';
const tog = { ws:null, room:null, isHost:false, hb:0, bc:null, members:new Set(), inRoom(){ return !!this.room; } };
const togDialog   = $('#togDialog');
const togCode     = $('#togCode');
const togMake     = $('#togMake');
const togLink     = $('#togLink');
const togCopy     = $('#togCopy');
const togJoinCode = $('#togJoinCode');
const togJoin     = $('#togJoin');
const togLeave    = $('#togLeave');
const togStatus   = $('#togStatus');

function setStatus(txt){ if (!togStatus) return; togStatus.textContent=txt; togStatus.style.display = txt? 'inline':'none'; }
function randCode(){ const abc='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s=''; for(let i=0;i<8;i++) s+=abc[Math.floor(Math.random()*abc.length)]; return s; }
function syncLink(room){ const url=new URL(location.href); url.searchParams.set('room',room); if (current) url.searchParams.set('series',current.id); if (currentEp) url.searchParams.set('ep',String(currentEp)); return url.toString(); }
function togSend(type,payload={}){ const msg=JSON.stringify({type,room:tog.room,payload}); if (tog.ws && tog.ws.readyState===1) tog.ws.send(msg); if (tog.bc) tog.bc.postMessage(msg); }

function connectWS(room){
  if (!WS_URL){ tog.bc = new BroadcastChannel(`vichi_tog_${room}`); tog.bc.onmessage = (ev)=>{ try{ togOnMessage(JSON.parse(ev.data)); }catch{} }; return Promise.resolve(); }
  return new Promise((resolve,reject)=>{
    const ws = new WebSocket(`${WS_URL}?room=${room}`); tog.ws=ws;
    ws.onopen = ()=> resolve();
    ws.onmessage = (ev)=>{ try{ togOnMessage(JSON.parse(ev.data)); }catch(e){ console.warn('WS message err', e); } };
    ws.onclose = ()=>{ clearInterval(tog.hb); tog.hb=0; setStatus('Disconnesso'); };
    ws.onerror = (e)=>{ console.error('WS error',e); setStatus('Errore connessione'); reject(e); };
  });
}
function togOnMessage(msg){
  const { type, payload } = msg||{};
  if (type==='WELCOME'){ setStatus(`Stanza ${tog.room} — host: ${tog.isHost?'TU':(payload?.host||'sconosciuto')}`); return; }
  if (type==='MEMBERS'){ tog.members=new Set(payload?.ids||[]); setStatus(`Stanza ${tog.room} — membri: ${tog.members.size}${tog.isHost?' (sei host)':''}`); return; }
  if (type==='PING'){ togSend('PONG',{t:payload.t}); return; }
  if (type==='SYNC' && !tog.isHost){ const hostT = payload.t + ((Date.now()-payload.ts)/2)/1000; applyHostState(payload.state, hostT); return; }
  if (type==='PLAY' && !tog.isHost)  video.play().catch(()=>{});
  if (type==='PAUSE' && !tog.isHost) video.pause();
  if (type==='SEEK' && !tog.isHost)  video.currentTime = payload.t;
  if (type==='CHANGE_EP' && !tog.isHost){
    if (!current || current.id!==payload.seriesId){ const item=CATALOG.find(x=>x.id===payload.seriesId); if (item) openSeries(item); }
    playEpisode(payload.ep);
  }
}
function applyHostState(state, hostT){
  const drift = hostT - video.currentTime;
  if (Math.abs(drift) > 0.7) video.currentTime = hostT;
  else if (Math.abs(drift) > 0.1) video.playbackRate = drift>0 ? 1.03 : 0.97;
  else video.playbackRate = 1.0;
  if (state==='playing' && video.paused) video.play().catch(()=>{});
  if (state==='paused' && !video.paused) video.pause();
}
async function togEnter(room, asHost){
  tog.room=room; tog.isHost=!!asHost;
  await connectWS(room);
  togSend('HELLO',{host:tog.isHost});
  if (tog.isHost){
    if (tog.hb) clearInterval(tog.hb);
    tog.hb = setInterval(()=>{ const state = video.paused?'paused':'playing'; togSend('SYNC',{ t:video.currentTime||0, state, ts:Date.now() }); }, 1500);
  }
  togLeave.style.display='inline-flex';
  setStatus(`Stanza ${room} — connessione OK${tog.isHost?' (host)':''}`);
}
function togExit(){ try{ tog.ws?.close(); }catch{}; try{ tog.bc?.close(); }catch{}; tog.ws=null; tog.bc=null; tog.room=null; tog.isHost=false; clearInterval(tog.hb); tog.hb=0; setStatus(''); togLeave.style.display='none'; }

/* bind UI */
$('#togMake')?.addEventListener('click', ()=>{ const code=(togCode.value.trim().toUpperCase()||randCode()).slice(0,8); togCode.value=code; togLink.value=syncLink(code); togEnter(code,true); });
$('#togCopy')?.addEventListener('click', async ()=>{ try{ await navigator.clipboard.writeText(togLink.value); togCopy.textContent='Copiato!'; setTimeout(()=>togCopy.textContent='Copia link',1200);}catch{} });
$('#togJoin')?.addEventListener('click', ()=>{ const code=togJoinCode.value.trim().toUpperCase(); if (!code) return; togEnter(code,false); });
$('#togLeave')?.addEventListener('click', ()=> togExit());

/* deep link ?room=&series=&ep= */
(function handleDeepLink(){
  const sp=new URLSearchParams(location.search);
  const room=sp.get('room'); const sid=sp.get('series'); const ep=parseInt(sp.get('ep')||'0',10)||0;
  if (sid){ const item=CATALOG.find(x=>x.id===sid); if (item) openSeries(item); }
  if (ep){ playEpisode(ep); }
  if (room){ togEnter(room,false); }
})();



// ---- HOME NAVIGATION (logo + bottone) ----
function goHome() {
  try { video.pause(); } catch {}
  // mostra Home, nasconde Watch e Player
  const home = document.getElementById('home');
  const watch = document.getElementById('watch');
  const playerView = document.getElementById('playerView');
  if (home) home.style.display = 'block';
  if (watch) watch.style.display = 'none';
  if (playerView) playerView.style.display = 'none';

  // reset stato "serie aperta"
  current = null;
  currentEp = null;

  // pulizia URL (?room, ?series, ?ep restano invariati se vuoi)
  const url = new URL(location.href);
  url.searchParams.delete('series');
  url.searchParams.delete('ep');
  history.replaceState(null, '', url);

  // nav active state (facoltativo)
  const nav = document.querySelector('.nav-center-box li');
  if (nav) nav.classList.add('active');

  // torna su e risistema lo snap
  window.scrollTo({ top: 0, behavior: 'smooth' });
  requestAnimationFrame(() => {
    document.documentElement.style.setProperty('--dock-h',
      Math.ceil(document.querySelector('.nav-center-box')?.getBoundingClientRect().bottom || 0) + 'px'
    );
  });
}

// Rende disponibile anche per eventuali onclick inline
window.goHome = goHome;

// Bind eventi (dopo che il DOM è pronto)
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('brandLogo')?.addEventListener('click', (e) => {
    e.preventDefault(); goHome();
  });
  document.getElementById('navHomeBtn')?.addEventListener('click', (e) => {
    e.preventDefault(); goHome();
  });
});

/* ---------- INIT ---------- */
renderHome();
