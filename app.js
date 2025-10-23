/* ==========================
   VichiFlix – app.js (refactor)
   - Auth fix: usa sempre localStorage (dev + prod)
   - Catalogo unificato (stagionale/continuo)
   - URL builder universale
   - Storage robusto (progressi)
   - UI e Player ordinati
   ========================== */

/***************************
 * Auth & bootstrap
 ***************************/
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const lockscreen = $('#lockscreen');
const app = $('.app');
const devBtn = $('#devBypassBtn');

if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
  devBtn.style.display = 'block';
}

devBtn?.addEventListener('click', () => {
  localStorage.setItem('vichi_auth', '1');
  lockscreen.style.display = 'none';
  app.style.display = 'block';
});

async function checkPassword(password) {
  try {
    const res = await fetch('/.netlify/functions/check-pass', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.success === true;
  } catch (e) {
    console.error('[checkPassword]', e);
    return false;
  }
}

$('#passBtn').onclick = async () => {
  const val = $('#passInput').value.trim();
  const ok = await checkPassword(val);
  if (ok) {
    localStorage.setItem('vichi_auth', '1');
    lockscreen.style.display = 'none';
    app.style.display = 'block';
  } else {
    alert('Password errata!');
  }
};

(function initAuth(){
  if (localStorage.getItem('vichi_auth') === '1') {
    lockscreen.style.display = 'none';
    app.style.display = 'block';
  }
})();

/***************************
 * Catalogo unificato
 ***************************/
/**
 * @typedef {Object} Series
 * @property {string} id
 * @property {string} title
 * @property {string} poster
 * @property {('ITA'|'SUB-ITA')} language
 * @property {PathCfg} path
 * @property {StructureCfg} structure
 */

/** @typedef {{
 *  base:string, langSegment?:string, seasonPad?:number, omitS1Segment?:boolean,
 *  folder:{ mode:'fixed'|'dynamic', fixed?:string },
 *  file:{ prefix?:string, pad?:number }
 * }} PathCfg */

/** @typedef {{ kind:'seasonal'|'continuous', seasons?:number[], total?:number, numbering?:'perSeason'|'absolute' }} StructureCfg */

const CATALOG /** @type {Series[]} */ = [
  { id:'onepiece', title:'One Piece (ITA)', poster:'https://i.imgur.com/TrSAzFm.jpeg', language:'ITA',
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
  }
];

/***************************
 * DOM refs
 ***************************/
const home = $('#home');
const grid = $('#grid');
const watch = $('#watch');

const tabList = $('#tabList');
const listView = $('#listView');
const playerView = $('#playerView');

const blockSelect = $('#blockSelect');
const blockLabel = $('#blockLabel');
const episodesGrid = $('#episodesGrid');
const pageBadge = $('#pageBadge');
const prevPageBtn = $('#prevPage');
const nextPageBtn = $('#nextPage');

const backBtn = $('#backBtn');
const seriesTitle = $('#seriesTitle');

const video = $('#video');
const sourceEl = $('#episode');
const nowTitle = $('#nowTitle');
const nowInfo = $('#nowInfo');
const prevEpBtn = $('#prevEp');
const nextEpBtn = $('#nextEp');

const resumeBox = $('#resumeBox');
const resumeBtn = $('#resumeBtn');
const resumeText = $('#resumeText');

/***************************
 * Stato runtime
 ***************************/
let current = /** @type {Series|null} */(null);
let curPage = 1;
let curSeason = 1; // 1-based
let curBlockStart = 1; // per le continue: 1,101,201...
let currentEp = null; // indice globale 1..N
let lastSave = 0;

const PER_PAGE = 24;


/*********************************
 * Watch Together – Config
 *********************************/
const WS_URL = (window.VICHIFLIX_WS_URL) || "ws://localhost:8081"; // es. "ws://localhost:8081" in locale, "wss://tuo-host" online
const TOG_HEARTBEAT_MS = 1500;
const TOG_BIG_JUMP = 0.7;
const TOG_MICRO = 0.1;
const TOG_RATE = 0.03; // 3%

/*********************************
 * Watch Together – State
 *********************************/
const tog = {
  ws: null,
  room: null,
  isHost: false,
  pingRTT: 0,
  hb: 0,
  members: new Set(),
  bc: null, // BroadcastChannel fallback (se WS_URL è vuoto)
  inRoom(){ return !!this.room; }
};

/*********************************
 * Watch Together – UI refs
 *********************************/
const togOpen = document.getElementById('togOpen');
const togDialog = document.getElementById('togDialog');
const togCode = document.getElementById('togCode');
const togMake = document.getElementById('togMake');
const togLink = document.getElementById('togLink');
const togCopy = document.getElementById('togCopy');
const togJoinCode = document.getElementById('togJoinCode');
const togJoin = document.getElementById('togJoin');
const togLeave = document.getElementById('togLeave');
const togStatus = document.getElementById('togStatus');

/*********************************
 * Watch Together – Helpers
 *********************************/
function randCode(){
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s=''; for(let i=0;i<8;i++) s += abc[Math.floor(Math.random()*abc.length)];
  return s;
}
function syncLink(room){
  const url = new URL(location.href);
  url.searchParams.set('room', room);
  if (current) url.searchParams.set('series', current.id);
  if (currentEp) url.searchParams.set('ep', String(currentEp));
  return url.toString();
}
function setStatus(txt){ 
  if (!togStatus) return;
  togStatus.textContent = txt; 
  togStatus.style.display = txt? 'inline':'none'; 
}

/*********************************
 * Transport – WS + BroadcastChannel fallback
 *********************************/
function togSend(type, payload={}){
  const msg = JSON.stringify({ type, room: tog.room, payload });
  if (tog.ws && tog.ws.readyState === 1) tog.ws.send(msg);
  if (tog.bc) tog.bc.postMessage(msg); // fallback locale
}

function connectWS(room){
  if (!WS_URL){
    // fallback locale (multi-tab)
    tog.bc = new BroadcastChannel(`vichi_tog_${room}`);
    tog.bc.onmessage = (ev)=> { try{ togOnMessage(JSON.parse(ev.data)); }catch{} };
    return Promise.resolve();
  }
  return new Promise((resolve, reject)=>{
    const ws = new WebSocket(`${WS_URL}?room=${room}`);
    tog.ws = ws;
    ws.onopen = ()=> resolve();
    ws.onmessage = (ev)=> { try{ togOnMessage(JSON.parse(ev.data)); }catch(e){ console.warn('WS message err', e); } };
    ws.onclose = ()=> { clearInterval(tog.hb); tog.hb = 0; setStatus('Disconnesso'); };
    ws.onerror = (e)=> { console.error('WS error', e); setStatus('Errore connessione'); reject(e); };
  });
}

/*********************************
 * Message handler + drift correction
 *********************************/
function togOnMessage(msg){
  const { type, payload } = msg || {};
  if (type === 'WELCOME'){
    setStatus(`Stanza ${tog.room} — host: ${tog.isHost ? 'TU' : (payload?.host || 'sconosciuto')}`);
    return;
  }
  if (type === 'MEMBERS'){
    tog.members = new Set(payload?.ids||[]);
    setStatus(`Stanza ${tog.room} — membri: ${tog.members.size}${tog.isHost?' (sei host)':''}`);
    return;
  }
  if (type === 'PING'){ togSend('PONG', { t: payload.t }); return; }
  if (type === 'SYNC' && !tog.isHost){
    const hostT = payload.t + ((Date.now()-payload.ts)/2)/1000; // correzione latenza grezza
    applyHostState(payload.state, hostT);
    return;
  }
  if (type === 'PLAY' && !tog.isHost){ video.play().catch(()=>{}); }
  if (type === 'PAUSE' && !tog.isHost){ video.pause(); }
  if (type === 'SEEK' && !tog.isHost){ video.currentTime = payload.t; }
  if (type === 'CHANGE_EP' && !tog.isHost){
    if (!current || current.id !== payload.seriesId){
      const item = CATALOG.find(x=>x.id===payload.seriesId);
      if (item) openSeries(item);
    }
    playEpisode(payload.ep);
    tabTo('player');
  }
}

function applyHostState(state, hostT){
  const drift = hostT - video.currentTime;
  if (Math.abs(drift) > TOG_BIG_JUMP){
    video.currentTime = hostT;
  } else if (Math.abs(drift) > TOG_MICRO){
    video.playbackRate = drift>0 ? (1+TOG_RATE) : (1-TOG_RATE);
  } else {
    video.playbackRate = 1.0;
  }
  if (state==='playing' && video.paused) video.play().catch(()=>{});
  if (state==='paused' && !video.paused) video.pause();
}

/*********************************
* Room lifecycle + Heartbeat
*********************************/
async function togEnter(room, asHost){
tog.room = room; tog.isHost = !!asHost;
await connectWS(room);
// saluta
togSend('HELLO', { host: tog.isHost });
// heartbeat host
if (tog.isHost){
if (tog.hb) clearInterval(tog.hb);
tog.hb = setInterval(()=>{
const state = video.paused ? 'paused' : 'playing';
togSend('SYNC', { t: video.currentTime||0, state, ts: Date.now() });
}, TOG_HEARTBEAT_MS);
}
togLeave.style.display = 'inline-flex';
setStatus(`Stanza ${room} — connessione OK${tog.isHost?' (host)':''}`);
}


function togExit(){
if (tog.ws){ try{ tog.ws.close(); }catch{} }
if (tog.bc){ try{ tog.bc.close(); }catch{} }
tog.ws = null; tog.bc = null; tog.room=null; tog.isHost=false; clearInterval(tog.hb); tog.hb=0;
setStatus('');
togLeave.style.display = 'none';
}


/*********************************
* Bind UI + deep-link (?room=)
*********************************/


togOpen.onclick = ()=> { if (typeof togDialog.showModal === 'function') togDialog.showModal(); };


togMake.onclick = ()=>{
const code = (togCode.value.trim().toUpperCase() || randCode()).slice(0,8);
togCode.value = code;
togLink.value = syncLink(code);
togEnter(code, true);
};


togCopy.onclick = async ()=>{
try{ await navigator.clipboard.writeText(togLink.value); togCopy.textContent='Copiato!'; setTimeout(()=>togCopy.textContent='Copia link',1200);}catch{}
};


togJoin.onclick = ()=>{
const code = togJoinCode.value.trim().toUpperCase(); if (!code) return;
togEnter(code, false);
};


togLeave.onclick = ()=>{ togExit(); };


// deep link ?room=...&series=...&ep=...
(function handleDeepLink(){
const sp = new URLSearchParams(location.search);
const room = sp.get('room');
const sid = sp.get('series');
const ep = parseInt(sp.get('ep')||'0',10)||0;
if (sid){ const item = CATALOG.find(x=>x.id===sid); if (item) openSeries(item); }
if (ep) { playEpisode(ep); tabTo('player'); }
if (room){ togEnter(room, false); }
})();


/*********************************
* Hook player events → broadcast
*********************************/
video.addEventListener('play', ()=>{ if (tog.inRoom() && tog.isHost) togSend('PLAY', { t: video.currentTime||0 }); });
video.addEventListener('pause', ()=>{ if (tog.inRoom() && tog.isHost) togSend('PAUSE', { t: video.currentTime||0 }); });
video.addEventListener('seeking', ()=>{ if (tog.inRoom() && tog.isHost) togSend('SEEK', { t: video.currentTime||0 }); });
video.addEventListener('waiting', ()=>{ if (tog.inRoom()) togSend('BUFFERING', { who: 'client', v: true }); });
video.addEventListener('playing', ()=>{ if (tog.inRoom()) togSend('BUFFERING', { who: 'client', v: false }); });


// quando l'host cambia episodio, allinea tutti
const _origPlayEpisode = playEpisode;
playEpisode = function(n){
_origPlayEpisode(n);
if (tog.inRoom() && tog.isHost && current){
togSend('CHANGE_EP', { seriesId: current.id, ep: n });
}
};




/***************************
 * Helpers generici
 ***************************/
const pad = (n, len) => String(n).padStart(len, '0');
const pad3 = (n) => pad(n, 3);

function normBase(url='') { return url.trim().replace(/\s+/g,'').replace(/\/+$/, ''); }

function seasonFromAbsolute(series, absEp) {
  let s=1, left=absEp;
  for (const eps of (series.structure.seasons||[])) {
    if (left <= eps) return { season:s, epInSeason:left, seasonEnd:eps };
    left -= eps; s++;
  }
  const last = (series.structure.seasons||[]).slice(-1)[0]||left;
  return { season: s-1, epInSeason:last, seasonEnd:last };
}

function folderFor(n, cap) {
  const start = Math.floor((n-1)/100)*100+1;
  const globalCap = Math.max(100, Math.ceil((cap||n)/100)*100);
  const end = Math.min(start+99, globalCap);
  return `${pad3(start)}_${pad3(end)}`;
}

function seasonSegment(path, season) {
  const omitS1 = !!path.omitS1Segment;
  const spad = path.seasonPad ?? 2;
  if (omitS1 && season===1) return '';
  return `/${pad(season, spad)}`;
}

function episodeFileName(fileCfg, num) {
  const prefix = fileCfg.prefix || '';
  const p = fileCfg.pad ?? 3; // default tre cifre
  return `${prefix}${pad(num, p)}.mp4`;
}

function totalEpisodes(series){
  return series.structure.kind==='seasonal'
    ? (series.structure.seasons||[]).reduce((a,b)=>a+b,0)
    : (series.structure.total||0);
}

function buildEpisodeUrl(series, absEp){
  const { structure, path } = series;
  const base = normBase(path.base || '');

  if (structure.kind === 'seasonal') {
    const { season, epInSeason, seasonEnd } = seasonFromAbsolute(series, absEp);
    const seg  = seasonSegment(path, season); // "" oppure "/01"
    const lang = path.langSegment ? `/${path.langSegment}` : '';

    const folder = path.folder.mode === 'fixed'
      ? (path.folder.fixed || '001_100')
      : folderFor(epInSeason, seasonEnd);

    const numberForFile = (structure.numbering === 'absolute') ? absEp : epInSeason;
    const file = episodeFileName(path.file||{}, numberForFile);

    return `${base}${seg}${lang}/${folder}/${file}`;
  }

  // continuous
  const cap = totalEpisodes(series) || absEp;
  const folder = path.folder.mode === 'fixed' ? (path.folder.fixed||'001_100') : folderFor(absEp, cap);
  const file = episodeFileName(path.file||{}, absEp);
  return `${base}/${folder}/${file}`;
}

/***************************
 * Storage (progressi)
 ***************************/
function storageKey(seriesId){ return `vichi_progress_${seriesId}`; }

function loadProgress(seriesId){
  const raw = localStorage.getItem(storageKey(seriesId));
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed;
  } catch { return {}; }
}

function saveProgress(seriesId, data){
  const safe = (data && typeof data==='object') ? data : {};
  localStorage.setItem(storageKey(seriesId), JSON.stringify(safe));
}

function setLastEpisode(seriesId, n){ const p=loadProgress(seriesId); p.lastEpisode=n; saveProgress(seriesId,p); }

function setPosition(seriesId, n, seconds, duration){
  const p=loadProgress(seriesId);
  if (!p.positions || typeof p.positions!== 'object') p.positions = {};
  p.positions[n] = { t: seconds||0, d: duration||p.positions?.[n]?.d||0, ts: Date.now() };
  saveProgress(seriesId, p);
}

function clearPosition(seriesId, n){ const p=loadProgress(seriesId); if (p.positions && typeof p.positions==='object'){ delete p.positions[n]; saveProgress(seriesId,p);} }

function markWatched(seriesId, n){
  const p=loadProgress(seriesId);
  if (!p.watched || typeof p.watched!=='object') p.watched={};
  p.watched[n]=true; if (p.positions) delete p.positions[n]; p.lastEpisode=n; saveProgress(seriesId,p);
}

function isWatched(seriesId, n){ const p=loadProgress(seriesId)||{}; return !!(p.watched && p.watched[n]); }
function getPosition(seriesId, n){ const p=loadProgress(seriesId)||{}; return (p.positions && p.positions[n])? p.positions[n] : null; }

// Bonifica retrocompatibilita
(function migrate(){ try {
  for (let i=0;i<localStorage.length;i++){
    const k = localStorage.key(i); if (!k || !k.startsWith('vichi_progress_')) continue;
    const raw = localStorage.getItem(k); if (!raw) continue; let parsed=null; try{parsed=JSON.parse(raw);}catch{parsed=null;}
    if (!parsed || typeof parsed!=='object' || Array.isArray(parsed)) localStorage.setItem(k,'{}');
  }
}catch(e){ console.warn('[migrateProgressStorage]', e);} })();

/***************************
 * UI – Home & Serie
 ***************************/
function renderHome(){
  grid.innerHTML = '';
  for (const item of CATALOG){
    const card = document.createElement('div'); card.className='card';
    const img = document.createElement('img'); img.className='poster'; img.src=item.poster; img.alt=item.title;
    img.onerror = () => { img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect width="100%" height="100%" fill="#131318" /><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#ff2a2a" font-family="Arial" font-size="24">${item.title}</text></svg>`); };
    card.appendChild(img);
    const meta = document.createElement('div'); meta.className='meta'; meta.innerHTML = `<span class="badge">Serie</span><span class="badge">${item.language}</span>`; card.appendChild(meta);
    card.addEventListener('click', () => openSeries(item));
    grid.appendChild(card);
  }
}

function openSeries(item){
  current = item;
  home.style.display='none';
  watch.classList.add('active');
  tabTo('list');

  // prepara selettore blocchi/stagioni
  buildBlocks(item);
  renderEpisodes();
  updateResumeBox();
}

function buildBlocks(item){
  seriesTitle.textContent = item.title;
  blockSelect.innerHTML = '';

  if (item.structure.kind === 'seasonal'){
    blockLabel.textContent = 'Stagioni:';
    const totalS = (item.structure.seasons||[]).length;
    for (let s=1; s<=totalS; s++){
      const o = document.createElement('option'); o.value=String(s); o.textContent = `Stagione ${s}`; blockSelect.appendChild(o);
    }
    curSeason = 1; curPage = 1; blockSelect.value = '1';
    const onChange = () => { curSeason = parseInt(blockSelect.value,10)||1; curPage=1; renderEpisodes(); };
    blockSelect.onchange = onChange; blockSelect.addEventListener('input', onChange);
  } else {
    blockLabel.textContent = 'Blocchi da 100:';
    const endEp = totalEpisodes(item);
    const cap = Math.max(100, Math.ceil(endEp/100)*100);
    for (let start=1; start<=endEp; start+=100){
      const end = Math.min(start+99, cap);
      const o = document.createElement('option'); o.value=String(start); o.textContent = `${pad3(start)}-${pad3(end)}`; blockSelect.appendChild(o);
    }
    curBlockStart=1; curPage=1; blockSelect.value='1';
    blockSelect.onchange = () => { curBlockStart = parseInt(blockSelect.value,10)||1; curPage=1; renderEpisodes(); };
  }
}

function getBlockEpisodes(){
  if (!current) return [];
  if (current.structure.kind==='seasonal'){
    const sIdx = Math.max(1, Math.min(curSeason, (current.structure.seasons||[]).length));
    const before = (current.structure.seasons||[]).slice(0, sIdx-1).reduce((a,b)=>a+b,0);
    const count = (current.structure.seasons||[])[sIdx-1]||0;
    const start = before+1, end = before+count; const eps=[]; for (let n=start;n<=end;n++) eps.push(n); return eps;
  }
  const endEp = totalEpisodes(current);
  const s = curBlockStart, e = Math.min(s+99, endEp);
  const eps=[]; for (let n=s;n<=e;n++) eps.push(n); return eps;
}

function renderEpisodes(){
  const eps = getBlockEpisodes();
  const pages = Math.ceil(eps.length / PER_PAGE) || 1; curPage = Math.max(1, Math.min(curPage, pages));
  const start = (curPage-1)*PER_PAGE; const pageItems = eps.slice(start, start+PER_PAGE);
  episodesGrid.innerHTML='';
  for (const n of pageItems){
    const b = document.createElement('button'); b.className='pill'; b.textContent = pad3(n);
    if (isWatched(current.id, n)) b.classList.add('watched'); else if (getPosition(current.id, n)) b.classList.add('partial');
    b.onclick = () => { playEpisode(n); tabTo('player'); };
    episodesGrid.appendChild(b);
  }
  pageBadge.textContent = `${curPage} / ${pages}`;
  prevPageBtn.onclick = () => { if (curPage>1){ curPage--; renderEpisodes(); } };
  nextPageBtn.onclick = () => { if (curPage<pages){ curPage++; renderEpisodes(); } };
  updateResumeBox();
}

function tabTo(w){
  if (w==='list'){
    tabList.classList.add('active'); listView.style.display='block'; playerView.style.display='none';
  } else {
    tabList.classList.remove('active'); listView.style.display='none'; playerView.style.display='block';
  }
}

/***************************
 * Player
 ***************************/
function playEpisode(n){
  const src = buildEpisodeUrl(current, n);
  sourceEl.src = src; video.load();
  nowTitle.textContent = `${current.title} — Episodio ${n}`;
  nowInfo.textContent = src.split('/').slice(-2).join('/');
  currentEp = n; setLastEpisode(current.id, n);

  const pos = getPosition(current.id, n);
  const trySeek = () => {
    if (pos && typeof pos.t==='number' && pos.t>5) video.currentTime = Math.max(0, pos.t-1);
    video.play().catch(()=>{});
  };
  if (video.readyState>=2) trySeek(); else video.addEventListener('canplay', trySeek, { once:true });

  prevEpBtn.onclick = () => moveEpisode(n-1);
  nextEpBtn.onclick = () => moveEpisode(n+1);
}

function mapGlobalToSeason(series, n){
  let remaining=n;
  for (let i=0;i<(series.structure.seasons||[]).length;i++){
    const count = (series.structure.seasons||[])[i];
    if (remaining<=count) return { season:i+1, indexInSeason:remaining, globalIndex:n };
    remaining -= count;
  }
  const arr = series.structure.seasons||[]; const lastIdx = arr.length-1;
  return { season: arr.length, indexInSeason: arr[lastIdx]||1, globalIndex: totalEpisodes(series) };
}

function moveEpisode(n){
  if (!current) return;
  const max = totalEpisodes(current); if (n<1 || n>max) return;

  if (current.structure.kind==='seasonal'){
    const m = mapGlobalToSeason(current, n);
    if (m.season !== curSeason){ curSeason = m.season; blockSelect.value = String(curSeason); curPage=1; renderEpisodes(); }
  } else {
    const nb = Math.floor((n-1)/100)*100+1; if (nb !== curBlockStart){ curBlockStart=nb; blockSelect.value=String(curBlockStart); curPage=1; renderEpisodes(); }
  }
  playEpisode(n); updateResumeBox();
}

/***************************
 * Resume box & Tracking
 ***************************/
function updateResumeBox(){
  if (!current){ resumeBox.style.display='none'; return; }
  const p = loadProgress(current.id); const { lastEpisode, positions } = p;
  let target=null, label='';
  if (positions && Object.keys(positions).length){
    target = lastEpisode || parseInt(Object.keys(positions).sort((a,b)=> (positions[b]?.ts||0)-(positions[a]?.ts||0))[0],10);
    const pos = positions?.[target]?.t || 0; label = `Riprendi Ep. ${target} a ${Math.floor(pos)}s`;
  } else if (lastEpisode){
    target = lastEpisode; const max = totalEpisodes(current); if (isWatched(current.id, target) && target<max) target = target+1; label = `Riprendi Ep. ${target}`;
  }
  if (target){ resumeBox.style.display='flex'; resumeText.textContent=label; resumeBtn.onclick = () => { playEpisode(target); tabTo('player'); }; }
  else { resumeBox.style.display='none'; }
}

video.addEventListener('timeupdate', () => {
  const now = Date.now(); if (!current || !currentEp) return; if (now-lastSave<2000) return; lastSave=now;
  const t = video.currentTime||0, d = video.duration||0;
  if (d>0){ setPosition(current.id, currentEp, t, d); if (t/d >= 0.9){ markWatched(current.id, currentEp); renderEpisodes(); updateResumeBox(); } }
});

video.addEventListener('ended', () => {
  if (!current || !currentEp) return; markWatched(current.id, currentEp); clearPosition(current.id, currentEp); renderEpisodes(); updateResumeBox();
});

/***************************
 * Nav
 ***************************/
$('#tabList').onclick = () => tabTo('list');
$('#backBtn').onclick = () => { video.pause(); watch.classList.remove('active'); home.style.display='block'; current=null; currentEp=null; };
$('#brandLogo').onclick = () => { video.pause(); watch.classList.remove('active'); home.style.display='block'; current=null; currentEp=null; tabTo('list'); window.scrollTo({top:0, behavior:'smooth'}); };

/***************************
 * Init
 ***************************/
renderHome();