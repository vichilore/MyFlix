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
    title: 'Attack On Titan (SUB ITA)',
    image: 'https://i.imgur.com/n2G627u.jpeg',
    generator: 'auto-seasonal',
    seasons: [
      quickAddSeason('https://srv30-emiko.sweetpixel.org/DDL/ANIME/ShingekiNoKyojin/ShingekiNoKyojin_Ep_01_SUB_ITA.mp4', 25, 'Stagione 1'),
      quickAddSeason('https://srv22-remote.sweetpixel.org/DDL/ANIME/ShingekiNoKyojin2/ShingekiNoKyojin2_Ep_01_SUB_ITA.mp4', 12, 'Stagione 2', {image:'https://i.imgur.com/pipc5g7.jpeg'}),
      quickAddSeason('https://srv28-kokeshi.sweetpixel.org/DDL/ANIME/ShingekiNoKyojin3/ShingekiNoKyojin3_Ep_01_SUB_ITA.mp4', 22, 'Stagione 3', {image:'https://i.imgur.com/GlZeuLY.jpeg'}),
      quickAddSeason('https://srv16-suisen.sweetpixel.org/DDL/ANIME/ShingekiNoKyojin4/ShingekiNoKyojin4_Ep_01_SUB_ITA.mp4', 16, 'Stagione 4 Parte 1', {image:'https://i.imgur.com/f2nyTAX.jpeg'}),
      quickAddSeason('https://srv16-suisen.sweetpixel.org/DDL/ANIME/ShingekiNoKyojin4Part2/ShingekiNoKyojin4Part2_Ep_01_SUB_ITA.mp4', 12, 'Stagione 4 Parte 2', {image:'https://i.imgur.com/f2nyTAX.jpeg'}),
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
   {
    id: 'gachiakuta-ita',
    title: 'Gachiakuta (ITA)',
    image: 'https://i.imgur.com/bmjQnGO.jpeg',
    generator: 'auto-seasonal',
    seasons: [
      quickAddSeason('https://srv18-tsurukusa.sweetpixel.org/DDL/ANIME/GachiakutaITA/Gachiakuta_Ep_01_ITA.mp4', 13, 'Stagione 1'),
    ]
  },
   quickAddSeriesFromUrl(
    'https://srv21-airbus.sweetpixel.org/DDL/ANIME/FairyTailITA/FairyTail_Ep_001_ITA.mp4',
    'Fairy Tail (ITA)',
    175,
    {image: 'https://i.imgur.com/jtAk33L.jpeg'}
  ),
  {
    id: 'MyheroAcademiaITA',
    title: 'My Hero Academia (ITA)',
    image: 'https://i.imgur.com/a6oZaJX.jpeg',
    generator: 'auto-seasonal',
    seasons: [
      quickAddSeason('https://srv12-bananini.sweetpixel.org/DDL/ANIME/BokuNoHeroAcademiaITA/BokuNoHeroAcademia_Ep_01_ITA.mp4', 13, 'Stagione 1'),
      quickAddSeason('https://srv27-gordon.sweetpixel.org/DDL/ANIME/BokuNoHeroAcademia2ITA/BokuNoHeroAcademia2_Ep_01_ITA.mp4', 25, 'Stagione 2'),
      quickAddSeason('https://srv26-lampada.sweetpixel.org/DDL/ANIME/BokuNoHeroAcademia3ITA/BokuNoHeroAcademia3_Ep_01_ITA.mp4', 25, 'Stagione 3'),
      quickAddSeason('https://srv26-lampada.sweetpixel.org/DDL/ANIME/BokuNoHeroAcademia4ITA/BokuNoHeroAcademia4_Ep_01_ITA.mp4', 25, 'Stagione 4'),
      quickAddSeason('https://srv16-suisen.sweetpixel.org/DDL/ANIME/BokuNoHeroAcademia5ITA/BokuNoHeroAcademia5_Ep_01_ITA.mp4', 25, 'Stagione 5'),
      quickAddSeason('https://srv18-tsurukusa.sweetpixel.org/DDL/ANIME/BokuNoHeroAcademia6ITA/BokuNoHeroAcademia6_Ep_01_ITA.mp4', 25, 'Stagione 6'),
      quickAddSeason('https://srv18-tsurukusa.sweetpixel.org/DDL/ANIME/BokuNoHeroAcademia7ITA/BokuNoHeroAcademia7_Ep_01_ITA.mp4', 21, 'Stagione 7'),
    ]
  },
  {
    id: 'drstoneITA',
    title: 'Dr.Stone (ITA)',
    image: 'https://i.imgur.com/73E1OPV.jpeg',
    generator: 'auto-seasonal',
    seasons: [
      quickAddSeason('https://srv26-lampada.sweetpixel.org/DDL/ANIME/DrStoneITA/DrStone_Ep_01_ITA.mp4', 24, 'Stagione 1'),
      quickAddSeason('https://srv20-coat.sweetpixel.org/DDL/ANIME/DrStone2ITA/DrStone2_Ep_01_ITA.mp4', 11, 'Stagione 2'),
      quickAddSeason('https://srv12-bananini.sweetpixel.org/DDL/ANIME/DrStone3ITA/DrStone3_Ep_01_ITA.mp4', 22, 'Stagione 3'),
      quickAddSeason('https://srv18-tsurukusa.sweetpixel.org/DDL/ANIME/DrStone4ITA/DrStone4_Ep_01_ITA.mp4', 24, 'Stagione 4'),
    ]
  },
  quickAddSeriesFromUrl(
    'https://srv17-geisha.sweetpixel.org/DDL/ANIME/BleachITA/Bleach_Ep_001_ITA.mp4',
    'Bleach (ITA)',
    366,
    {image: 'https://i.imgur.com/dZm9Lu4.jpeg'}
  ),
  quickAddSeriesFromUrl(
    'https://srv15-cuccia.sweetpixel.org/DDL/ANIME/DetectiveConan/DetectiveConan_Ep_0001_ITA.mp4',
    'Detective Conan (ITA)',
    1160,
    {image: 'https://i.imgur.com/Uh6TWm9.jpeg'}
  ),
  {
    id: 'haikyuITA',
    title: 'Haikyuu!! (ITA)',
    image: 'https://i.imgur.com/UR9hVbS.jpeg',
    generator: 'auto-seasonal',
    seasons: [
      quickAddSeason('https://srv13-eraser.sweetpixel.org/DDL/ANIME/HaikyuuITA/Haikyuu_Ep_01_ITA.mp4', 25, 'Stagione 1'),
      quickAddSeason('https://srv17-geisha.sweetpixel.org/DDL/ANIME/Haikyuu2ITA/Haikyuu2_Ep_01_ITA.mp4', 25, 'Stagione 2'),
      quickAddSeason('https://srv22-remote.sweetpixel.org/DDL/ANIME/Haikyuu3ITA/Haikyuu3_Ep_01_ITA.mp4', 10, 'Stagione 3'),
      quickAddSeason('https://srv18-tsurukusa.sweetpixel.org/DDL/ANIME/HaikyuuToTheTopITA/HaikyuuToTheTop_Ep_01_ITA.mp4', 13, 'Stagione 4'),
      quickAddSeason('https://srv18-tsurukusa.sweetpixel.org/DDL/ANIME/HaikyuuToTheTop2ITA/HaikyuuToTheTop2_Ep_01_ITA.mp4', 12, 'Stagione 5'),
    ]
  },
  {
    id: 'bluelock-ita',
    title: 'Blue Lock(ITA)',
    image: 'https://i.imgur.com/YOYjAco.jpeg',
    generator: 'auto-seasonal',
    seasons: [
      quickAddSeason('https://srv26-lampada.sweetpixel.org/DDL/ANIME/BlueLockITA/BlueLock_Ep_01_ITA.mp4', 24, 'Stagione 1'),
      quickAddSeason('https://srv18-tsurukusa.sweetpixel.org/DDL/ANIME/BlueLock2ITA/BlueLock2_Ep_01_ITA.mp4', 14, 'Stagione 2')
    ]
  },
  {
    id: 'soloLeveling-ita',
    title: 'Solo Leveling(ITA)',
    image: 'https://i.imgur.com/uHGaLy8.jpeg',
    generator: 'auto-seasonal',
    seasons: [
      quickAddSeason('https://srv16-suisen.sweetpixel.org/DDL/ANIME/OreDakeLevelUpNaKenITA/OreDakeLevelUpNaKen_Ep_01_ITA.mp4', 12, 'Stagione 1'),
      quickAddSeason('https://srv16-suisen.sweetpixel.org/DDL/ANIME/OreDakeLevelUpNaKen2ITA/OreDakeLevelUpNaKen2_Ep_01_ITA.mp4', 13, 'Stagione 2')
    ]
  },
  {
    id: 'TheEminenceInShadow-ita',
    title: 'The Eminence In Shadow (ITA)',
    image: 'https://i.imgur.com/VDfJF58.png',
    generator: 'auto-seasonal',
    seasons: [
      quickAddSeason('https://srv19-sushi.sweetpixel.org/DDL/ANIME/KageNoJitsuryokushaNiNaritakuteITA/KageNoJitsuryokushaNiNaritakute_Ep_01_ITA.mp4', 20, 'Stagione 1'),
      quickAddSeason('https://srv13-eraser.sweetpixel.org/DDL/ANIME/KageNoJitsuryokushaNiNaritakute2ITA/KageNoJitsuryokushaNiNaritakute2_Ep_01_ITA.mp4', 12, 'Stagione 2')
    ]
  },
  {
    id: 'DemonSlayer-ita',
    title: 'Demon Slayer (ITA)',
    image: 'https://i.imgur.com/Yzj0U7Z.jpeg',
    generator: 'auto-seasonal',
    seasons: [
      quickAddSeason('https://srv12-bananini.sweetpixel.org/DDL/ANIME/KimetsuNoYaibaITA/KimetsuNoYaiba_Ep_01_ITA.mp4', 26, 'Stagione 1'),
      quickAddSeason('https://srv15-cuccia.sweetpixel.org/DDL/ANIME/KimetsuNoYaibaMugenRessha-henITA/KimetsuNoYaibaMugenRessha-hen_Ep_01_ITA.mp4', 7, 'Stagione 2'),
      quickAddSeason('https://srv16-suisen.sweetpixel.org/DDL/ANIME/KimetsuNoYaibaYuukaku-henITA/KimetsuNoYaibaYuukaku-hen_Ep_01_ITA.mp4', 11, 'Stagione 3'),
      quickAddSeason('https://srv16-suisen.sweetpixel.org/DDL/ANIME/KimetsuNoYaibaKatanakajiNoSato-henITA/KimetsuNoYaibaKatanakajiNoSato-hen_Ep_01_ITA.mp4', 11, 'Stagione 4'),
      quickAddSeason('https://srv16-suisen.sweetpixel.org/DDL/ANIME/KimetsuNoYaibaHashiraGeiko-henITA/KimetsuNoYaibaHashiraGeiko-hen_Ep_01_ITA.mp4', 8, 'Stagione 5'),
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

const all          = $('#all');
const allGrid      = $('#allGrid');
const navHomeBtn   = $('#navHomeBtn');
const navAllBtn    = $('#navAllBtn');

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


/*********************************
 * Watch Together – Config (compat)
 *********************************/
const WS_URL = (window.VICHIFLIX_WS_URL) || ""; // es. "ws://localhost:3000/ws" in locale
const TOG_HEARTBEAT_MS = 1500;  // invio SYNC host → ospiti
const TOG_BIG_JUMP    = 0.7;    // salto se drift grande
const TOG_MICRO       = 0.1;    // micro correzione
const TOG_RATE        = 0.03;   // 3% di speed drift

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
  bc: null,           // BroadcastChannel fallback (se WS_URL è vuoto)
  suppress: false,    // evita loop quando applichiamo comandi remoti
  inRoom(){ return !!this.room; }
};

/*********************************
 * Watch Together – UI refs (già presenti)
 *********************************/
const togDialog  = document.getElementById('togDialog');
const togCode    = document.getElementById('togCode');
const togMake    = document.getElementById('togMake');
const togLink    = document.getElementById('togLink');
const togCopy    = document.getElementById('togCopy');
const togJoinCode= document.getElementById('togJoinCode');
const togJoin    = document.getElementById('togJoin');
const togLeave   = document.getElementById('togLeave');
const togStatus  = document.getElementById('togStatus');

/*********************************
 * Helpers
 *********************************/

function setActiveNav(btn){
  document.querySelectorAll('.nav-center-box li').forEach(li => li.classList.remove('active'));
  btn?.closest('li')?.classList.add('active');
}
function showHome(){
  all.style.display = 'none';
  watch.style.display = 'none';
  home.style.display = 'block';
  setActiveNav(navHomeBtn);
}
function showAll(){
  home.style.display = 'none';
  watch.style.display = 'none';
  all.style.display = 'block';
  setActiveNav(navAllBtn);
  if (searchPanel?.classList.contains('show')) { // chiudi la lente se aperta
    searchPanel.classList.remove('show');
    searchPanel.setAttribute('aria-hidden','true');
    searchFab.setAttribute('aria-expanded','false');
  }
}


function randCode(){
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s=''; for(let i=0;i<8;i++) s += abc[Math.floor(Math.random()*abc.length)];
  return s; // 8 chars senza trattino; il link usa ?room=s
}
function normCode(raw){
  if (!raw) return '';
  return String(raw).toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8);
}
function syncLink(room){
  const url = new URL(location.href);
  url.searchParams.set('room', room);
  if (current)   url.searchParams.set('series', current.id);
  if (currentEp) url.searchParams.set('ep', String(currentEp));
  return url.toString();
}
function setStatus(txt){
  if (!togStatus) return;
  togStatus.textContent = txt || '';
  togStatus.style.display = txt ? 'inline' : 'none';
}
function setLeaveVisible(v){
  if (togLeave) togLeave.style.display = v ? 'inline-flex' : 'none';
}

/*********************************
 * Transport – WS + BroadcastChannel fallback
 *********************************/
function togSend(type, payload={}){
  const msg = JSON.stringify({ type, room: tog.room, payload, ts: Date.now() });
  if (tog.ws && tog.ws.readyState === 1) {
    try{ tog.ws.send(msg); }catch{}
  }
  if (tog.bc){
    try{ tog.bc.postMessage(msg); }catch{}
  }
}
function connectWS(room){
  disconnectWS();

  tog.room = room;
  // Fallback locale (multi-tab) se WS_URL non è configurato
  if (!WS_URL){
    tog.bc = new BroadcastChannel(`vichi_tog_${room}`);
    tog.bc.onmessage = ev => { try{ togOnMessage(JSON.parse(ev.data)); }catch{} };
    setStatus(`Stanza ${room} — (locale)`);
    return Promise.resolve();
  }

  return new Promise((resolve, reject)=>{
    const ws = new WebSocket(`${WS_URL}?room=${room}`);
    tog.ws = ws;

    ws.onopen = () => {
      setStatus(`Connesso alla stanza ${room}`);
      // chiedi benvenuto/stato
      togSend('HELLO', {});
      resolve();
    };
    ws.onmessage = (ev) => {
      let msg=null; try{ msg = JSON.parse(ev.data); }catch{ return; }
      togOnMessage(msg);
    };
    ws.onclose = () => {
      clearInterval(tog.hb); tog.hb = 0;
      setStatus('Disconnesso');
    };
    ws.onerror = (e) => {
      setStatus('Errore connessione');
      reject(e);
    };
  });
}
function disconnectWS(){
  try{ tog.ws?.close(); }catch{}
  tog.ws = null;
  if (tog.bc){ try{ tog.bc.close(); }catch{} tog.bc = null; }
  clearInterval(tog.hb); tog.hb = 0;
}

/*********************************
 * Host heartbeat (invio SYNC)
 *********************************/
function startHostHeartbeat(){
  clearInterval(tog.hb);
  tog.hb = setInterval(()=>{
    if (!tog.isHost || !tog.inRoom()) return;
    const state = video?.paused ? 'paused' : 'playing';
    const t = Number(video?.currentTime || 0);
    togSend('SYNC', { state, t, ts: Date.now() });
  }, TOG_HEARTBEAT_MS);
}

/*********************************
 * Message handler + drift correction
 *********************************/
function togOnMessage(msg){
  const { type, payload, ts } = msg || {};
  // evita loop locali
  tog.suppress = true;
  try {
    switch(type){
      case 'WELCOME': {
        // payload: { host?:string }
        setStatus(`Stanza ${tog.room} — host: ${tog.isHost ? 'TU' : (payload?.host || 'sconosciuto')}`);
        break;
      }
      case 'MEMBERS': {
        // payload: { ids: string[] }
        tog.members = new Set(payload?.ids || []);
        setStatus(`Stanza ${tog.room} — membri: ${tog.members.size}${tog.isHost ? ' (sei host)' : ''}`);
        break;
      }
      case 'PING': {
        togSend('PONG', { t: payload?.t });
        break;
      }
      case 'SYNC': {
        if (tog.isHost) break; // l'host non applica i propri SYNC
        // correzione latenza grezza: hostT = payload.t + RTT/2
        const hostT = (payload?.t ?? 0) + (((Date.now() - (payload?.ts || ts || Date.now()))/2)/1000);
        applyHostState(payload?.state, hostT);
        break;
      }
      case 'PLAY': {
        if (tog.isHost) break;
        video?.play().catch(()=>{});
        break;
      }
      case 'PAUSE': {
        if (tog.isHost) break;
        try{ video?.pause(); }catch{}
        break;
      }
      case 'SEEK': {
        if (tog.isHost) break;
        if (video && Number.isFinite(payload?.t)) video.currentTime = Math.max(0, payload.t);
        break;
      }
      case 'CHANGE_EP': {
        if (tog.isHost) break;
        const { seriesId, ep } = payload || {};
        const s = seriesList.find(x => x.id === seriesId);
        if (s) {
          if (!current || current.id !== s.id) openSeries(s);
          playEpisode(s, Number(ep || 1));
        }
        break;
      }
      default: break;
    }
  } finally {
    queueMicrotask(()=> { tog.suppress = false; });
  }
}

function applyHostState(state, hostT){
  if (!video) return;
  const drift = hostT - Number(video.currentTime || 0);
  if (Math.abs(drift) > TOG_BIG_JUMP){
    video.currentTime = Math.max(0, hostT);
    video.playbackRate = 1.0;
  } else if (Math.abs(drift) > TOG_MICRO){
    video.playbackRate = drift > 0 ? (1 + TOG_RATE) : (1 - TOG_RATE);
  } else {
    video.playbackRate = 1.0;
  }
  if (state === 'playing' && video.paused)         video.play().catch(()=>{});
  if (state === 'paused'  && !video.paused)        { try{ video.pause(); }catch{} }
}

/*********************************
 * Hook player → rete (solo host)
 *********************************/
video?.addEventListener('play',  ()=> { if (!tog.suppress && tog.isHost && tog.inRoom()) togSend('PLAY', {}); });
video?.addEventListener('pause', ()=> { if (!tog.suppress && tog.isHost && tog.inRoom()) togSend('PAUSE',{}); });
video?.addEventListener('seeking',()=>{ if (!tog.suppress && tog.isHost && tog.inRoom()) togSend('SEEK', { t: Number(video.currentTime||0) }); });
video?.addEventListener('seeked', ()=>{ if (!tog.suppress && tog.isHost && tog.inRoom()) togSend('SEEK', { t: Number(video.currentTime||0) }); });

/*********************************
 * Wrappa playEpisodeCore per CHANGE_EP
 *********************************/
if (typeof playEpisodeCore === 'function'){
  const _playEpisodeCore = playEpisodeCore;
  window.playEpisodeCore = function(series, ep){
    _playEpisodeCore(series, ep);
    // annuncia cambio sorgente agli ospiti (solo host)
    if (!tog.suppress && tog.isHost && tog.inRoom()){
      togSend('CHANGE_EP', { seriesId: series?.id, ep: Number(ep||1) });
      // mini-snapshot tempo per i join-late
      const snap = ()=> togSend('SYNC', { state: (video?.paused ? 'paused' : 'playing'), t: Number(video?.currentTime||0), ts: Date.now() });
      if (video?.readyState >= 2) snap(); else video?.addEventListener('canplay', snap, { once:true });
    }
  };
}

/*********************************
 * UI: Crea / Entra / Lascia
 *********************************/
// Crea → host
togMake?.addEventListener('click', async ()=>{
  const code = normCode(togCode.value.trim()) || randCode();
  togCode.value = code;
  togLink.value = syncLink(code);

  try{
    await connectWS(code);
    tog.isHost = true;
    setLeaveVisible(true);
    setStatus(`Stanza ${code} — sei host`);
    startHostHeartbeat();
  }catch{ setStatus('Impossibile connettersi'); }
});

// Copia link
togCopy?.addEventListener('click', async ()=>{
  if (!togLink.value){ setStatus('Nessun link da copiare'); return; }
  try{ await navigator.clipboard.writeText(togLink.value); setStatus('Link copiato'); }
  catch{ setStatus('Copia non riuscita'); }
});

// Entra → guest
togJoin?.addEventListener('click', async ()=>{
  const raw = togJoinCode.value.trim();
  const m = raw.match(/[?&]room=([A-Z0-9]+)/i);
  const code = m ? normCode(m[1]) : normCode(raw);
  if (!code || code.length < 6){ setStatus('Codice non valido'); return; }

  try{
    await connectWS(code);
    tog.isHost = false;
    setLeaveVisible(true);
    setStatus(`Stanza ${code} — collegato come ospite`);
  }catch{ setStatus('Impossibile connettersi'); }
});

// Lascia
togLeave?.addEventListener('click', ()=>{
  disconnectWS();
  setLeaveVisible(false);
  tog.isHost = false;
  tog.room = null;
  setStatus('Hai lasciato la stanza');
});

/*********************************
 * Auto-join da link (?room=, opzionale series/ep)
 *********************************/
(function autoJoinFromURL(){
  const url = new URL(location.href);
  const r = normCode(url.searchParams.get('room') || '');
  if (!r) return;
  connectWS(r).then(()=>{
    tog.isHost = false;
    setLeaveVisible(true);
    // opzionale: se arrivano series/ep dall'URL, apri subito
    const seriesId = url.searchParams.get('series');
    const ep = Number(url.searchParams.get('ep') || 0);
    if (seriesId){
      const s = seriesList.find(x => x.id === seriesId);
      if (s) { openSeries(s); if (ep>0) playEpisode(s, ep); }
    }
  }).catch(()=> setStatus('Impossibile connettersi'));
})();

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

function renderAllGrid(items = seriesList){
  if (!allGrid) return;
  allGrid.innerHTML = '';
  // Ordina alfabeticamente
  const sorted = [...items].sort((a,b)=> (a.title||'').localeCompare(b.title||''));
  for (const s of sorted){
    const card = document.createElement('article');
    card.className = 'all-card';
    card.dataset.id = s.id;
    card.setAttribute('role','listitem');

    card.onclick = (e)=> {
    e.preventDefault();
    openSeries(s, true);
    };

    const badges = document.createElement('div');
    badges.className = 'all-badges';
    const lang = s.lang || (Array.isArray(s.seasons) ? s.seasons[0]?.lang : '');
    if (lang){ const b=document.createElement('span'); b.className='all-badge'; b.textContent=lang; badges.appendChild(b); }
    card.appendChild(badges);

    const img = document.createElement('img');
    img.className = 'all-poster';
    img.src = s.image || '';
    img.alt = s.title;
    img.onerror = ()=>{ img.src='data:image/svg+xml;utf8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect width="100%" height="100%" fill="#131318"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#fff" font-family="Arial" font-size="22">${s.title}</text></svg>`); };
    card.appendChild(img);

    
    allGrid.appendChild(card);
    const ttl = document.createElement('div');
    ttl.className = 'all-title-sm';
    ttl.textContent = s.title;
    card.appendChild(ttl);
  }
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

navHomeBtn?.addEventListener('click', (e)=>{ e.preventDefault(); showHome(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
navAllBtn?.addEventListener('click', (e)=>{ 
  e.preventDefault(); 
  renderAllGrid(); 
  showAll(); 
  window.scrollTo({ top: 0, behavior: 'smooth' });
});


/* ===== Watch / Player (immutati) ===== */
function openSeries(series, fromAll = false){
  // Mostra la pagina watch
  home.style.display = 'none';
  all.style.display = 'none';
  watch.style.display = 'block';
  setActiveNav(null);

  // Popola dati
  currentSeries = series;
  updateWatchHeader(series);
  renderSeasons(series);

  // Se apriamo da Tutti → scorri fino alla card selezionata
  if(fromAll){
    requestAnimationFrame(()=>{
      const cardElem = document.querySelector(`[data-id="${series.id}"]`);
      if(cardElem){
        cardElem.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }
}

// --- FIX: wrapper mancanti --- //
function updateWatchHeader(series){
  // aggiorna banner e titolo (stesso lavoro che facevi in openSeries)
  watchBanner.src = (isSeasonal(series) && series.seasons?.[currentSeasIndex]?.image) || series.image || '';
  watchTitle.textContent = series.title || 'Titolo';
}

function renderSeasons(series){
  // ricostruisce i controlli come già fai
  buildSeasonPicker(series);
  renderEpisodeButtons(series);
  // aggiorna bottone "Riprendi"
  updateWatchResumeUI(series);
}
// --- fine FIX --- //

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
