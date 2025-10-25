/* ==========================
   VichiFlix — app.js (live search + FAB a destra)
   ========================== */

const $ = (s) => document.querySelector(s);

/* AUTH */
const lockscreen = $('#lockscreen');
const app        = $('.app');
const devBtn     = $('#devBypassBtn');
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') { devBtn.style.display = 'block'; }
devBtn?.addEventListener('click', () => { localStorage.setItem('vichi_auth','1'); lockscreen.style.display='none'; app.style.display='block'; });

async function checkPassword(password){
  try{
    const res = await fetch('/.netlify/functions/check-pass', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ password }) });
    if (!res.ok) return false;
    const data = await res.json();
    return data.success === true;
  }catch{ return false; }
}
$('#passBtn').onclick = async ()=>{ const val = $('#passInput').value.trim(); const ok = await checkPassword(val);
  if (ok){ localStorage.setItem('vichi_auth','1'); lockscreen.style.display='none'; app.style.display='block'; } else alert('Password errata!'); };
(function initAuth(){ if (localStorage.getItem('vichi_auth') === '1') { lockscreen.style.display='none'; app.style.display='block'; }})();

document.addEventListener('DOMContentLoaded', () => {
  const navBox = document.querySelector('.nav-center-box');
  const dockNodes = [document.querySelector('.main-header'), navBox].filter(Boolean);

  function setDockMetrics(){
    // --dock-h come prima
    let maxBottom = 0;
    for (const el of dockNodes){
      const r = el.getBoundingClientRect();
      const pos = getComputedStyle(el).position;
      const isDocking = (pos==='fixed' || pos==='sticky') && r.top <= 0 && r.bottom > 0;
      if (isDocking) maxBottom = Math.max(maxBottom, r.bottom);
    }
    if (maxBottom === 0 && dockNodes[0]) maxBottom = dockNodes[0].offsetHeight || 0;
    document.documentElement.style.setProperty('--dock-h', Math.ceil(maxBottom) + 'px');

    // 🔧 variabili per allineare la lente/pannello alla nav pill
    if (navBox){
      const r = navBox.getBoundingClientRect();
      const navTop = Math.round(r.top);
      const navH   = Math.round(r.height);
      const navRightGap = Math.max(0, Math.round(window.innerWidth - r.right)); // distanza dal bordo destro

      document.documentElement.style.setProperty('--nav-top',  navTop + 'px');
      document.documentElement.style.setProperty('--nav-h',    navH   + 'px');
      document.documentElement.style.setProperty('--nav-right', navRightGap + 'px');
    }
  }

  const raf = () => requestAnimationFrame(setDockMetrics);
  raf();
  window.addEventListener('resize', raf, { passive:true });
  window.addEventListener('scroll', raf, { passive:true });
  if (document.fonts?.ready) document.fonts.ready.then(setDockMetrics);
});

/* =====================================================
   AUTO CATALOG SYSTEM  (SweetPixel DDL pattern)
   ===================================================== */
function parseAnimeUrl(url) {
  const match = url.match(
    /^(https?:\/\/[^/]+\/DDL\/ANIME\/)([^/]+)\/([^_]+)_Ep_([0-9]+)_([A-Z_]+)\.mp4$/i
  );
  if (!match) return null;

  const [, root, folder, prefix, numStr, lang] = match;
  const padLength = numStr.length;

  return {
    baseUrl: root + folder + "/",
    filePrefix: prefix + "_Ep_",
    startIndex: parseInt(numStr, 10),
    padLength,
    lang: lang.replace(/_/g, " "),
    example: url,
  };
}
function buildEpisodeUrlAuto(series, epNum) {
  const padLen = series.padLength || 2;
  const ep = String(epNum).padStart(padLen, '0');
  return `${series.baseUrl}${series.filePrefix}${ep}_${series.lang.replace(/\s+/g,'_')}.mp4`;
} 

function quickAddSeriesFromUrl(url, title, episodes, extra={}){
  const info = parseAnimeUrl(url);
  if (!info) throw new Error('URL non valido');
  return {
    id: (extra.id || title).replace(/\s+/g,''),
    title,
    image     : extra.image || '',  
    lang  : info.lang,
    generator: 'auto',
    episodes,
    baseUrl: info.baseUrl,
    filePrefix: info.filePrefix,
    padLength: info.padLength,
  };
}

function quickAddSeason(url, episodes, title='', extra={}){
  const info = parseAnimeUrl(url);
  if (!info) throw new Error('URL non valido');
  return {
    title,
    episodes,
    image     : extra.image || '',  
    baseUrl: info.baseUrl,
    filePrefix: info.filePrefix,
    lang: info.lang
  };
}

/* ---------- Catalogo di esempio (immutato) ---------- */
const seriesList = [
{
  id: "OnePieceITA",
  title: "One Piece (ITA)",
  image: "https://i.imgur.com/L2sTPqV.jpeg",
  generator: "auto-range",
  segments: [
    {
      from: 1,
      to: 599,
      baseUrl: "https://srv14-caviale.sweetpixel.org/DDL/ANIME/OnePieceITA/",
      filePrefix: "OnePiece_Ep_",
      padLength: 3,
      lang: "ITA"
    },
    {
      from: 600,
      to: 889, // o il massimo attuale
      baseUrl: "https://srv18-tsurukusa.sweetpixel.org/DDL/ANIME/OnePieceITA/", // <-- il nuovo base
      filePrefix: "OnePiece_Ep_",
      padLength: 3,
      lang: "ITA",
      startNumber: 600 // <-- parte da 600
    }
  ]
},
    quickAddSeriesFromUrl(
    'https://srv23-yama.sweetpixel.org/DDL/ANIME/HunterXHunter/HunterXHunter_Ep_001_SUB_ITA.mp4',
    'Hunter x Hunter (SUB-ITA)',
    148,
    {image: 'https://i.imgur.com/7I1ZLeJ.jpeg'}
  ),
  quickAddSeriesFromUrl(
    'https://srv15-cuccia.sweetpixel.org/DDL/ANIME/BlackClover/BlackClover_Ep_001_SUB_ITA.mp4',
    'Black Clover(SUB-ITA)',
    170,
    {image: 'https://i.imgur.com/5eMMefj.jpeg'}
  ),
  {
    id: 'SnK',
    title: 'Shingeki no Kyojin (SUB ITA)',
    image: 'https://i.imgur.com/n2G627u.jpeg',
    generator: 'auto-seasonal',
    seasons: [
      quickAddSeason('https://srv30-emiko.sweetpixel.org/DDL/ANIME/ShingekiNoKyojin/ShingekiNoKyojin_Ep_01_SUB_ITA.mp4', 25, 'Stagione 1'),
      quickAddSeason('https://srv22-remote.sweetpixel.org/DDL/ANIME/ShingekiNoKyojin2/ShingekiNoKyojin2_Ep_01_SUB_ITA.mp4', 12, 'Stagione 2', {image:'https://i.imgur.com/pipc5g7.jpeg'}),
      quickAddSeason('https://srv22-remote.sweetpixel.org/DDL/ANIME/ShingekiNoKyojin3/ShingekiNoKyojin3_Ep_01_SUB_ITA.mp4', 22, 'Stagione 3', {image:'https://i.imgur.com/GlZeuLY.jpeg'}),
      quickAddSeason('https://srv22-remote.sweetpixel.org/DDL/ANIME/ShingekiNoKyojinFinal/ShingekiNoKyojinFinal_Ep_01_SUB_ITA.mp4', 16, 'Stagione Final', {image:'https://i.imgur.com/f2nyTAX.jpeg'}),
    ]
  },
  {
    id: 'Chainsaw-ita',
    title: 'ChainsawMan (ITA)',
    image: 'https://i.imgur.com/6I0aGYy.png',
    generator: 'auto-seasonal',
    seasons: [
      quickAddSeason('https://srv22-remote.sweetpixel.org/DDL/ANIME/ChainsawManITA/ChainsawMan_Ep_01_ITA.mp4', 12, 'Stagione 1')
    ]
  },
  {
    id: 'VinlandSaga-ita',
    title: 'Vinland Saga (ITA)',
    image: 'https://i.imgur.com/tK6OjGn.jpeg',
    generator: 'auto-seasonal',
    seasons: [
      quickAddSeason('https://srv14-caviale.sweetpixel.org/DDL/ANIME/VinlandSagaITA/VinlandSaga_Ep_01_ITA.mp4', 24, 'Stagione 1'),
      quickAddSeason('https://srv30-emiko.sweetpixel.org/DDL/ANIME/VinlandSaga2ITA/VinlandSaga2_Ep_01_ITA.mp4', 24, 'Stagione 2', {image:'https://i.imgur.com/s4jrBdE.jpeg'})
    ]
  },
  {
    id: 'tokyo-rev-ita',
    title: 'Tokyo Revengers (ITA)',
    image: 'https://i.imgur.com/Upo6C7l.jpeg',
    generator: 'auto-seasonal',
    seasons: [
      quickAddSeason('https://srv30-emiko.sweetpixel.org/DDL/ANIME/TokyoRevengersITA/TokyoRevengers_Ep_01_ITA.mp4', 24, 'Stagione 1'),
    ]
  },
  {
    id: 'jjk-ita',
    title: 'Jujutsu Kaisen(ITA)',
    image: 'https://i.imgur.com/XBfPQOZ.jpeg',
    generator: 'auto-seasonal',
    seasons: [
      quickAddSeason('https://srv26-lampada.sweetpixel.org/DDL/ANIME/JujutsuKaisenITA/JujutsuKaisen_Ep_01_ITA.mp4', 24, 'Stagione 1'),
      quickAddSeason('https://srv17-geisha.sweetpixel.org/DDL/ANIME/JujutsuKaisen2ITA/JujutsuKaisen2_Ep_01_ITA.mp4', 23, 'Stagione 2', {image:'https://i.imgur.com/swRaN5Y.jpeg'})
    ]
  },
  {
    id: 'hellsparadise',
    title: 'Hell s Paradise (SUB ITA)',
    image: 'https://i.imgur.com/0Fgpced.jpeg',
    generator: 'auto-seasonal',
    seasons: [
      quickAddSeason('https://srv27-gordon.sweetpixel.org/DDL/ANIME/Jigokuraku/Jigokuraku_Ep_01_SUB_ITA.mp4', 13, 'Stagione 1'),
    ]
  },
  {
    id: 'hellsparadise-ita',
    title: 'Hell s Paradise (ITA)',
    image: 'https://i.imgur.com/d38rp7W.jpeg',
    generator: 'auto-seasonal',
    seasons: [
      quickAddSeason('https://srv13-eraser.sweetpixel.org/DDL/ANIME/JigokurakuITA/Jigokuraku_Ep_01_ITA.mp4', 13, 'Stagione 1'),
    ]
  },

];

/* ---------- Stato app + ricerca ---------- */
const home          = $('#home');
const watch         = $('#watch');
const watchBanner   = $('#watchBanner');
const watchTitle    = $('#watchTitle');
const seasonPicker  = $('#seasonPicker');
const episodeList   = $('#episodeList');
const watchResumeBtn= $('#watchResumeBtn');

const playerOverlay = $('#playerOverlay');
const playerClose   = $('#playerClose');
const video         = $('#video');
const sourceEl      = $('#episode');
const nowTitle      = $('#nowTitle');
const nowInfo       = $('#nowInfo');
const prevEpBtn     = $('#prevEp');
const nextEpBtn     = $('#nextEp');

/* 🔎 elementi floating search */
const searchFab     = $('#searchFab');
const searchPanel   = $('#searchPanel');
const searchInput   = $('#searchInput');
const searchClear   = $('#searchClear');
const searchStatus  = $('#searchStatus');
// ---- Helpers codice/link
const $g = (s)=>document.querySelector(s);
const elCode     = $g('#togCode');
const elLink     = $g('#togLink');
const elMake     = $g('#togMake');
const elCopy     = $g('#togCopy');
const elJoinCode = $g('#togJoinCode');
const elJoin     = $g('#togJoin');
const elLeave    = $g('#togLeave');
const elStatus   = $g('#togStatus');


let current   = null;
let currentEp = null;
let currentSeasIndex = 0;



function genCode(){
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O, 1/I
  let s=''; for(let i=0;i<8;i++) s += alphabet[Math.floor(Math.random()*alphabet.length)];
  return s.slice(0,4)+'-'+s.slice(4);
}
function normCode(raw){
  if (!raw) return '';
  const s = String(raw).toUpperCase().replace(/[^A-Z0-9]/g,'');
  return (s.length<=4) ? s : s.slice(0,4)+'-'+s.slice(4,8);
}
function codeToLink(code){
  const c = (code||'').replace(/[^A-Z0-9]/g,'');
  const base = location.origin + location.pathname.replace(/index\.html?$/,'');
  return `${base}?room=${c}`;
}
function showStatus(msg){ if(!elStatus) return; elStatus.textContent = msg; elStatus.style.display='block'; setTimeout(()=>{ elStatus.style.display='none'; }, 2500); }

// ---- Input behavior (uppercase + formattazione ####-####)
[elCode, elJoinCode].forEach(inp=>{
  if(!inp) return;
  inp.addEventListener('input', ()=>{
    const pos = inp.selectionStart;
    const before = inp.value;
    inp.value = normCode(inp.value);
    // tenta di mantenere il caret
    const delta = inp.value.length - before.length;
    inp.setSelectionRange(Math.max(0,pos+delta), Math.max(0,pos+delta));
  });
});

// ---- Crea
elMake?.addEventListener('click', ()=>{
  const code = elCode.value.trim() ? normCode(elCode.value) : genCode();
  elCode.value = code;
  elLink.value = codeToLink(code);
  showStatus('Stanza creata in locale. Condividi il link per invitare gli amici.');
});

// ---- Copia link
elCopy?.addEventListener('click', async ()=>{
  if (!elLink.value) { showStatus('Nessun link da copiare.'); return; }
  try{ await navigator.clipboard.writeText(elLink.value); showStatus('Link copiato negli appunti.'); }
  catch{ showStatus('Copia non riuscita.'); }
});

// ---- Entra (placeholder: qui richiami la tua logica reale di join)
elJoin?.addEventListener('click', ()=>{
  const raw = elJoinCode.value.trim();
  let code = normCode(raw);
  // Se incollano un link completo, estrai ?room=
  const m = raw.match(/[?&]room=([A-Z0-9]+)/i);
  if (m) code = normCode(m[1]);
  if (!code || code.replace('-','').length<6){ showStatus('Codice non valido.'); return; }

  // TODO: integrazione con il tuo backend/WebSocket
  showStatus(`Entrando nella stanza ${code}…`);
  elLeave.style.display = 'inline-flex';
});

// ---- Lascia
elLeave?.addEventListener('click', ()=>{
  // TODO: disconnessione reale
  showStatus('Hai lasciato la stanza.');
  elLeave.style.display = 'none';
});

// Quality of life: ENTER per attivare
elCode?.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); elMake?.click(); }});
elJoinCode?.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); elJoin?.click(); }});


/* Utils/stato (immutati) */
const isSeasonal = (series)=> Array.isArray(series?.seasons) && series.seasons.length>0;
const totalEpisodes = (series) => {
  // ✅ multi-segmenti: somma i range
  if (Array.isArray(series?.segments) && series.segments.length) {
    return series.segments.reduce((sum, s) => {
      const from = Number(s.from) || 1;
      const to   = Number(s.to)   || from;
      return sum + Math.max(0, to - from + 1);
    }, 0);
  }
  // ✅ stagionale
  if (isSeasonal(series)) {
    return series.seasons.reduce((a, s) => a + (s.episodes || 0), 0);
  }
  // ✅ flat
  return series.episodes || 0;
};

function seasonFromAbsolute(series, absEp){ if (!isSeasonal(series)) return { seasonIndex:0, epInSeason:absEp };
  let left = absEp; for (let i=0;i<series.seasons.length;i++){ const n = series.seasons[i].episodes||0; if (left <= n) return { seasonIndex:i, epInSeason:left }; left -= n; }
  const lastIndex = Math.max(0, series.seasons.length-1); return { seasonIndex:lastIndex, epInSeason: Math.max(1, series.seasons[lastIndex].episodes||1) }; }

/** Costruisce l'URL dell'episodio (supporta segments, stagioni e flat) */
function buildEpisodeUrl(series, absEp){
  // ✅ SEGMENTI con indice personalizzato
  if (Array.isArray(series.segments)) {
    const seg = series.segments.find(s => absEp >= s.from && absEp <= s.to);
    if (seg) {
      // numero di file: parte da startNumber (default 1)
      const start = (typeof seg.startNumber === 'number') ? seg.startNumber : 1;
      const fileNumber = start + (absEp - seg.from);           // es: 600→0 se start=0
      const ep = String(fileNumber).padStart(seg.padLength || 2, '0');

      const lang = (seg.lang || series.lang || '').replace(/\s+/g,'_');
      const prefix = seg.filePrefix || '';                      // es: "OnePiece_Ep_"
      const base = seg.baseUrl.endsWith('/') ? seg.baseUrl : seg.baseUrl + '/';

      return `${base}${prefix}${ep}_${lang}.mp4`;
    }
  }

  // ✅ STAGIONALE
  if (isSeasonal(series)) {
    const { seasonIndex, epInSeason } = seasonFromAbsolute(series, absEp);
    return buildEpisodeUrlAuto(series.seasons[seasonIndex], epInSeason);
  }

  // ✅ FLAT
  return buildEpisodeUrlAuto(series, absEp);
}

/* Progress storage (immutato) */
const storageKey = (id)=>`vichi_progress_${id}`;
const loadProgress = (id)=>{ try{ return JSON.parse(localStorage.getItem(storageKey(id))||'{}') }catch{ return {} } };
const saveProgress = (id,data)=> localStorage.setItem(storageKey(id), JSON.stringify(data||{}));
const setLastEpisode = (id,n)=>{ const p=loadProgress(id); p.lastEpisode=n; saveProgress(id,p); };
const setPosition = (id,n,t,d)=>{ const p=loadProgress(id); (p.positions??= {}); p.positions[n]={ t:t||0, d:d||p.positions?.[n]?.d||0, ts:Date.now() }; saveProgress(id,p); };
const clearPosition = (id,n)=>{ const p=loadProgress(id); if (p.positions){ delete p.positions[n]; saveProgress(id,p);} };
const markWatched = (id,n)=>{ const p=loadProgress(id); (p.watched??={}); p.watched[n]=true; if (p.positions) delete p.positions[n]; p.lastEpisode=n; saveProgress(id,p); };
const isWatched = (id,n)=> !!(loadProgress(id).watched?.[n]);
const getPosition = (id,n)=> loadProgress(id).positions?.[n] ?? null;
function latestProgressPercentForSeries(s){ const p = loadProgress(s.id); if (!p?.positions) return 0;
  const entries = Object.values(p.positions); if (!entries.length) return 0;
  const latest = entries.sort((a,b)=> (b.ts||0)-(a.ts||0))[0]; if (!latest?.d) return 0;
  return Math.max(0, Math.min(100, Math.round((latest.t/ latest.d)*100))); }

/* ===== Home/Caroselli + Ricerca live ===== */
function createCarouselRow({ id, title, items, size='default', showProgress=false }){
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
    </div>`;
  const track = document.createElement('div');
  track.className = 'carousel'; track.id = `${id}-track`;
  row.appendChild(track);

  function updateFades(){ const max = track.scrollWidth - track.clientWidth; row.classList.toggle('has-fade-right', track.scrollLeft < max - 2); }
  track.addEventListener('scroll', updateFades, { passive: true });
  new ResizeObserver(updateFades).observe(track);
  requestAnimationFrame(updateFades);

  for (const item of items){
    const cell = document.createElement('div'); cell.className='c-item';
    const card = document.createElement('div'); card.className = size==='xl' ? 'c-card c-card--xl' : 'c-card';

    const badges = document.createElement('div'); badges.className='c-badges';
    if (item.lang){ const b=document.createElement('span'); b.className='c-badge'; b.textContent=item.lang; badges.appendChild(b); }
    card.appendChild(badges);

    const img  = document.createElement('img'); img.className = size==='xl' ? 'c-poster c-poster--xl' : 'c-poster';
    img.src=item.image || ''; img.alt=item.title;
    img.onerror = ()=>{ img.src='data:image/svg+xml;utf8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect width="100%" height="100%" fill="#131318"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#fff" font-family="Arial" font-size="24">${item.title}</text></svg>`); };
    card.appendChild(img);

    if (size==='xl'){
      const grad=document.createElement('div'); grad.className='c-grad--xl';
      const info=document.createElement('div'); info.className='c-info--xl';
      const titleEl=document.createElement('div'); titleEl.className='c-title--xl'; titleEl.textContent=item.title;
      const chips=document.createElement('div'); chips.className='c-chips';
      if (item.lang) { const chip=document.createElement('span'); chip.className='c-chip'; chip.textContent=item.lang; chips.appendChild(chip); }
      info.appendChild(titleEl); info.appendChild(chips);
      card.appendChild(grad); card.appendChild(info);
    }

    if (showProgress){
      const pct = latestProgressPercentForSeries(item);
      const bar = document.createElement('div'); bar.className='c-progress';
      const fill = document.createElement('i'); fill.style.width = pct + '%';
      bar.appendChild(fill); card.appendChild(bar);
    }

    card.addEventListener('click', ()=> openSeries(item));
    cell.appendChild(card); track.appendChild(cell);
  }

  const prev=row.querySelector(`#${id}-prev`), next=row.querySelector(`#${id}-next`);
  const step = ()=> { const c = track.querySelector('.c-item'); return (c ? c.getBoundingClientRect().width : 280) * (size==='xl' ? 1.2 : 3); };
  prev.onclick = ()=> track.scrollBy({ left: -step(), behavior:'smooth' });
  next.onclick = ()=> track.scrollBy({ left:  step(), behavior:'smooth' });
  return row;
}

function renderHome(options={}){
  const { query='' , results=null } = options;
  const homeCarousels = $('#homeCarousels');
  homeCarousels.innerHTML='';

  if (query){
    searchStatus.style.display='block';
    searchStatus.textContent = results?.length ? `Risultati per "${query}" — ${results.length}` : `Nessun risultato per "${query}"`;
  } else {
    searchStatus.style.display='none'; searchStatus.textContent='';
  }

  if (query){
    const rowRes = createCarouselRow({ id:'row-search', title:'Risultati', items:(results||[]), size:'xl' });
    if (rowRes) homeCarousels.appendChild(rowRes);
    return;
  }

  const resumeItems = seriesList
    .map(s => { const p = loadProgress(s.id); const ts = p?.positions ? Math.max(...Object.values(p.positions).map(x=>x.ts||0), 0) : 0; return ts ? { s, ts } : null; })
    .filter(Boolean).sort((a,b)=>b.ts-a.ts).map(x=>x.s).slice(0,20);
  const rowResume = createCarouselRow({ id:'row-resume', title:'Riprendi', items:resumeItems, size:'xl', showProgress:true });
  if (rowResume) homeCarousels.appendChild(rowResume);

  const itaAnime = seriesList.filter(s => /\(ITA\)/i.test(s.title));
  const rowITA = createCarouselRow({ id: 'row-ita', title: 'Anime doppiati in italiano 🇮🇹', items: itaAnime, size: 'xl' });
  if (rowITA) homeCarousels.appendChild(rowITA);

  const subIta = seriesList.filter(s => /SUB.?ITA/i.test(s.title));
  const rowSub = createCarouselRow({ id:'row-sub', title:'Anime SUB-ITA', items: subIta });
  if (rowSub) homeCarousels.appendChild(rowSub);

  const top = createCarouselRow({ id:'row-top', title:'In evidenza', items:seriesList.slice(0,15) });
  const more = createCarouselRow({ id:'row-more', title:'Altri titoli', items:seriesList.slice(15) });
  if (top) homeCarousels.appendChild(top);
  if (more) homeCarousels.appendChild(more);
}

/* 🔎 filtering */
const normalize = (str)=> (str||'').toLowerCase();
function filterSeries(q){
  const n = normalize(q).trim();
  if (!n) return seriesList;
  return seriesList.filter(s => {
    const title = normalize(s.title);
    const lang  = normalize(s.lang || (isSeasonal(s)? s.seasons[0]?.lang : ''));
    return title.includes(n) || lang.includes(n);
  });
}
function handleSearchInput(){
  const q = searchInput?.value || '';
  const results = filterSeries(q);
  renderHome({ query:q.trim(), results });
  if (searchClear) searchClear.style.visibility = q ? 'visible' : 'hidden';
}

/* 🔎 pannello: open/close */
function openSearchPanel(){
  searchPanel.classList.add('show');
  searchPanel.setAttribute('aria-hidden','false');
  searchFab.setAttribute('aria-expanded','true');
  setTimeout(()=> searchInput?.focus(), 0);
}
function closeSearchPanel(){
  searchPanel.classList.remove('show');
  searchPanel.setAttribute('aria-hidden','true');
  searchFab.setAttribute('aria-expanded','false');
}
searchFab?.addEventListener('click', ()=>{
  if (searchPanel.classList.contains('show')) closeSearchPanel(); else openSearchPanel();
});
document.addEventListener('keydown', (e)=>{
  if (e.key === 'Escape' && searchPanel.classList.contains('show')) closeSearchPanel();
});
document.addEventListener('click', (e)=>{
  if (!searchPanel.classList.contains('show')) return;
  const isInside = searchPanel.contains(e.target) || searchFab.contains(e.target);
  if (!isInside) closeSearchPanel();
});

/* input handlers */
searchInput?.addEventListener('input', handleSearchInput, { passive:true });
searchInput?.addEventListener('keydown', (e)=>{ if (e.key === 'Escape'){ searchInput.value=''; handleSearchInput(); searchInput.blur(); closeSearchPanel(); }});
searchClear?.addEventListener('click', ()=>{ searchInput.value=''; handleSearchInput(); searchInput.focus(); });

/* ===== Watch / Player (immutati) ===== */
function openSeries(series){ current = series; home.style.display = 'none'; watch.style.display = 'block';
  watchBanner.src = (isSeasonal(series) && series.seasons[currentSeasIndex]?.image) || series.image || '';
  watchTitle.textContent = series.title || 'Titolo'; buildSeasonPicker(series); renderEpisodeButtons(series); updateWatchResumeUI(series); }

function buildSeasonPicker(series){
  seasonPicker.innerHTML = '';
  if (isSeasonal(series)){
    series.seasons.forEach((s, idx)=>{
      const pill = document.createElement('button');
      pill.className = 'season-pill' + (idx===currentSeasIndex ? ' active':'' );
      pill.textContent = s.title || `Stagione ${String(idx+1).padStart(2,'0')}`;
      pill.onclick = ()=>{ currentSeasIndex = idx; buildSeasonPicker(series); renderEpisodeButtons(series); };
      seasonPicker.appendChild(pill);
    });
  } else {
    currentSeasIndex = 0; const pill = document.createElement('button');
    pill.className = 'season-pill active'; pill.textContent = 'Tutti gli episodi';
    pill.onclick = ()=>{ currentSeasIndex = 0; renderEpisodeButtons(series); }; seasonPicker.appendChild(pill);
  }
  if (isSeasonal(series)) { const currentSeason = series.seasons[currentSeasIndex];
    watchBanner.src = (currentSeason?.image) || series.image || ''; }
}

function renderEpisodeButtons(series){
  episodeList.innerHTML = '';
  if (isSeasonal(series)){
    let startAbs = 1; for (let i=0;i<currentSeasIndex;i++) startAbs += (series.seasons[i].episodes||0);
    const count = series.seasons[currentSeasIndex].episodes||0;
    for (let i=1;i<=count;i++){
      const globalEp = startAbs + (i-1);
      const btn = document.createElement('button'); btn.className = 'episode-btn'; btn.dataset.ep = String(globalEp);
      btn.textContent = String(i).padStart(3,'0'); if (isWatched(series.id, globalEp)) btn.classList.add('watched');
      btn.onclick = ()=> playEpisode(series, globalEp); episodeList.appendChild(btn);
    }
  } else {
      const count = totalEpisodes(series);
    for (let i = 1; i <= count; i++) {
    const btn = document.createElement('button');
    btn.className = 'episode-btn';
    btn.dataset.ep = String(i);
    btn.textContent = String(i).padStart(3, '0');
    if (isWatched(series.id, i)) btn.classList.add('watched');
    btn.onclick = () => playEpisode(series, i);
    episodeList.appendChild(btn);
    }
  }
}
function updateEpisodeButtonState(seriesId, ep){ const btn = episodeList.querySelector(`.episode-btn[data-ep="${ep}"]`); if (btn) btn.classList.add('watched'); }

function persistProgressSnapshot(){ try{ if (!current || !currentEp) return; const t = video?.currentTime || 0; const d = video?.duration || 0; if (d > 0) setPosition(current.id, currentEp, t, d); }catch{} }
function updateWatchResumeUI(series){
  const btn = watchResumeBtn; if (!btn || !series) return;
  const progress = loadProgress(series.id); let resumeEp = 0;
  if (progress?.positions){
    const entries = Object.entries(progress.positions).filter(([n,p]) => p && typeof p.t === 'number' && typeof p.d === 'number' && p.t < (p.d - 10));
    if (entries.length){ entries.sort((a,b) => (b[1].ts||0) - (a[1].ts||0)); resumeEp = parseInt(entries[0][0], 10); }
  }
  if (!resumeEp && progress?.lastEpisode){ const lp = progress.positions?.[progress.lastEpisode]; if (lp && lp.t && lp.d && lp.t < lp.d - 10) resumeEp = progress.lastEpisode; }
  if (resumeEp){ btn.style.display = 'inline-flex'; btn.textContent = `▶ Riprendi episodio ${String(resumeEp).padStart(2,'0')}`; btn.onclick = () => playEpisode(series, resumeEp); }
  else { btn.style.display = 'none'; }
}
function normalizePlayArgs(arg1, arg2){ if (typeof arg1 === 'object' && arg1 !== null) return { series: arg1, ep: arg2 || 1 }; return { series: current, ep: arg1 || 1 }; }
function playEpisodeCore(series, ep){
  if (!series || !ep) return; current = series; currentEp = ep;
  const src = buildEpisodeUrl(series, ep); sourceEl.src = src; video.load();
  nowTitle.textContent = `${series.title} — Episodio ${String(ep).padStart(3,'0')}`;
  nowInfo.textContent  = src.split('/').slice(-2).join('/'); setLastEpisode(series.id, ep);
  playerOverlay.classList.add('show'); playerOverlay.style.display = 'flex'; document.documentElement.style.overflow = 'hidden';
  playerOverlay.setAttribute('tabindex','-1'); playerOverlay.focus({ preventScroll:true });
  const pos = getPosition(series.id, ep); const trySeek = ()=>{ if (pos && typeof pos.t==='number' && pos.t>5) video.currentTime = Math.max(0, pos.t-1); video.play().catch(()=>{}); };
  if (video.readyState>=2) trySeek(); else video.addEventListener('canplay', trySeek, { once:true });
  prevEpBtn.onclick = ()=> moveEpisode(ep-1); nextEpBtn.onclick = ()=> moveEpisode(ep+1);
}
function playEpisode(arg1, arg2){ const { series, ep } = normalizePlayArgs(arg1, arg2); playEpisodeCore(series, ep); }
function moveEpisode(n){
  if (!current) return; const max = totalEpisodes(current); if (n < 1 || n > max) return;
  if (isSeasonal(current)){ const { seasonIndex } = seasonFromAbsolute(current, n);
    if (seasonIndex !== currentSeasIndex){ currentSeasIndex = seasonIndex; buildSeasonPicker(current); renderEpisodeButtons(current); } }
  playEpisode(current, n);
}
function closePlayer(){ persistProgressSnapshot(); try { video.pause(); } catch {} sourceEl.src = ''; playerOverlay.classList.remove('show'); playerOverlay.style.display = 'none'; document.documentElement.style.overflow = ''; if (current) updateWatchResumeUI(current); }
playerClose?.addEventListener('click', closePlayer);
let lastSave = 0;
video.addEventListener('timeupdate', ()=>{ const now=Date.now(); if (!current || !currentEp) return; if (now-lastSave<2000) return; lastSave=now;
  const t=video.currentTime||0, d=video.duration||0; if (d>0){ setPosition(current.id, currentEp, t, d);
    if (t/d>=0.9){ markWatched(current.id,currentEp); updateEpisodeButtonState(current.id, currentEp); updateWatchResumeUI(current); } }});
video.addEventListener('ended', ()=>{ if (!current || !currentEp) return; markWatched(current.id,currentEp); clearPosition(current.id,currentEp);
  updateEpisodeButtonState(current.id, currentEp); updateWatchResumeUI(current); const max = totalEpisodes(current); if (currentEp < max) moveEpisode(currentEp+1); });
playerOverlay.addEventListener('keydown', (e)=>{ if (/(input|textarea|select)/i.test(e.target.tagName)) return;
  switch(e.key){ case ' ': e.preventDefault(); if (video.paused) video.play().catch(()=>{}); else video.pause(); break;
    case 'ArrowLeft': video.currentTime = Math.max(0, (video.currentTime||0) - 5); break;
    case 'ArrowRight': video.currentTime = Math.min(video.duration||1e9, (video.currentTime||0) + 5); break;
    case 'Escape': closePlayer(); break; case 'n': case 'N': moveEpisode((currentEp||1)+1); break; case 'p': case 'P': moveEpisode((currentEp||1)-1); break; } });

/* Touch helpers */
(function markTouch(){ try{ if ('ontouchstart' in window || navigator.maxTouchPoints > 0){ document.body.classList.add('is-touch'); } }catch{} })();
(function addPlayerSwipeClose(){
  const overlay = playerOverlay; if (!overlay) return; let startY = 0, dy = 0, swiping = false;
  overlay.addEventListener('touchstart', (e)=>{ if (!e.touches?.length) return; startY = e.touches[0].clientY; dy = 0; swiping = true; }, { passive:true });
  overlay.addEventListener('touchmove', (e)=>{ if (!swiping || !e.touches?.length) return; dy = e.touches[0].clientY - startY;
    if (dy > 10){ overlay.style.transform = `translateY(${Math.min(dy, 120)}px)`; overlay.style.opacity = String(Math.max(0.6, 1 - dy/600)); } }, { passive:true });
  overlay.addEventListener('touchend', ()=>{ if (!swiping) return; swiping = false; overlay.style.transform = ''; overlay.style.opacity = ''; if (dy > 120) { closePlayer(); } });
})();

/* NAV */
function goHome(){ try { video.pause(); } catch {} home.style.display = 'block'; watch.style.display = 'none'; current = null; currentEp = null;
  window.scrollTo({ top: 0, behavior: 'smooth' }); requestAnimationFrame(() => {
    const nb = $('.nav-center-box')?.getBoundingClientRect().bottom || 0; document.documentElement.style.setProperty('--dock-h', Math.ceil(nb) + 'px'); }); }
window.goHome = goHome;
document.addEventListener('DOMContentLoaded', () => { $('#brandLogo')?.addEventListener('click', (e)=>{ e.preventDefault(); goHome(); }); $('#navHomeBtn')?.addEventListener('click', (e)=>{ e.preventDefault(); goHome(); }); });

/* INIT */
renderHome();
