/* ========================================
   VichiFlix - App riorganizzata
   ======================================== */

// ==================== UTILITY ====================
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// ==================== AUTH ====================
class Auth {
  static init() {
    const lockscreen = $('#lockscreen');
    const app = $('.app');
    const devBtn = $('#devBypassBtn');
    
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      devBtn.style.display = 'block';
    }
    
    devBtn?.addEventListener('click', () => this.unlock(lockscreen, app));
    
    $('#passBtn').onclick = async () => {
      const password = $('#passInput').value.trim();
      const ok = await this.checkPassword(password);
      if (ok) {
        this.unlock(lockscreen, app);
      } else {
        alert('Password errata!');
      }
    };
    
    if (localStorage.getItem('vichi_auth') === '1') {
      this.unlock(lockscreen, app);
    }
  }
  
  static async checkPassword(password) {
    try {
      const res = await fetch('/.netlify/functions/check-pass', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ password })
      });
      if (!res.ok) return false;
      const data = await res.json();
      return data.success === true;
    } catch {
      return false;
    }
  }
  
  static unlock(lockscreen, app) {
    localStorage.setItem('vichi_auth', '1');
    lockscreen.style.display = 'none';
    app.style.display = 'block';
  }
}

// ==================== DOCK METRICS ====================
class DockMetrics {
  static init() {
    const navBox = $('.nav-center-box');
    const dockNodes = [$('.main-header'), navBox].filter(Boolean);
    
    const setMetrics = () => {
      let maxBottom = 0;
      for (const el of dockNodes) {
        const r = el.getBoundingClientRect();
        const pos = getComputedStyle(el).position;
        const isDocking = (pos === 'fixed' || pos === 'sticky') && r.top <= 0 && r.bottom > 0;
        if (isDocking) maxBottom = Math.max(maxBottom, r.bottom);
      }
      if (maxBottom === 0 && dockNodes[0]) maxBottom = dockNodes[0].offsetHeight || 0;
      document.documentElement.style.setProperty('--dock-h', Math.ceil(maxBottom) + 'px');
      
      if (navBox) {
        const r = navBox.getBoundingClientRect();
        const navTop = Math.round(r.top);
        const navH = Math.round(r.height);
        const navRightGap = Math.max(0, Math.round(window.innerWidth - r.right));
        
        document.documentElement.style.setProperty('--nav-top', navTop + 'px');
        document.documentElement.style.setProperty('--nav-h', navH + 'px');
        document.documentElement.style.setProperty('--nav-right', navRightGap + 'px');
      }
    };
    
    const raf = () => requestAnimationFrame(setMetrics);
    raf();
    window.addEventListener('resize', raf, { passive: true });
    window.addEventListener('scroll', raf, { passive: true });
    if (document.fonts?.ready) document.fonts.ready.then(setMetrics);
  }
}

// ==================== URL PARSER ====================
class UrlParser {
  static parseAnimeUrl(url) {
    const match = url.match(
      /^(https?:\/\/[^/]+\/DDL\/ANIME\/)([^/]+)\/([^_]+)_Ep_([0-9]+)_([A-Z_]+)\.mp4$/i
    );
    if (!match) return null;
    
    const [, root, folder, prefix, numStr, lang] = match;
    return {
      baseUrl: root + folder + "/",
      filePrefix: prefix + "_Ep_",
      startIndex: parseInt(numStr, 10),
      padLength: numStr.length,
      lang: lang.replace(/_/g, " ")
    };
  }
  
  static quickAddSeries(url, title, episodes, extra = {}) {
    const info = this.parseAnimeUrl(url);
    if (!info) throw new Error('URL non valido');
    return {
      id: (extra.id || title).replace(/\s+/g, ''),
      title,
      image: extra.image || '',
      lang: info.lang,
      generator: 'auto',
      episodes,
      baseUrl: info.baseUrl,
      filePrefix: info.filePrefix,
      padLength: info.padLength
    };
  }
  
  static quickAddSeason(url, episodes, title = '', extra = {}) {
    const info = this.parseAnimeUrl(url);
    if (!info) throw new Error('URL non valido');
    return {
      title,
      episodes,
      image: extra.image || '',
      baseUrl: info.baseUrl,
      filePrefix: info.filePrefix,
      lang: info.lang
    };
  }
}

// ==================== CATALOG ====================
const CATALOG = [
  {
    id: "OnePieceITA",
    title: "One Piece (ITA)",
    image: "https://i.imgur.com/L2sTPqV.jpeg",
    generator: "auto-range",
    segments: [
      {
        from: 1, to: 599,
        baseUrl: "https://srv14-caviale.sweetpixel.org/DDL/ANIME/OnePieceITA/",
        filePrefix: "OnePiece_Ep_",
        padLength: 3,
        lang: "ITA"
      },
      {
        from: 600, to: 889,
        baseUrl: "https://srv18-tsurukusa.sweetpixel.org/DDL/ANIME/OnePieceITA/",
        filePrefix: "OnePiece_Ep_",
        padLength: 3,
        lang: "ITA",
        startNumber: 600
      }
    ]
  },
  {
    id: "OnePiece-subITA",
    title: "One Piece (SUB-ITA)",
    image: "https://i.imgur.com/L2sTPqV.jpeg",
    generator: "auto-range",
    segments: [
      {
        from: 1, to: 400,
        baseUrl: "https://srv26-lampada.sweetpixel.org/DDL/ANIME/OnePieceSUBITA/",
        filePrefix: "OnePiece_Ep_",
        padLength: 4,
        lang: "SUB ITA"
      },
      {
        from: 401, to: 800,
        baseUrl: "https://srv19-sushi.sweetpixel.org/DDL/ANIME/OnePieceSUBITA/",
        filePrefix: "OnePiece_Ep_",
        padLength: 4,
        lang: "SUB ITA",
        startNumber: 401
      },
      {
        from: 801, to: 1146,
        baseUrl: "https://srv19-sushi.sweetpixel.org/DDL/ANIME/OnePieceSUBITA/",
        filePrefix: "OnePiece_Ep_",
        padLength: 4,
        lang: "SUB ITA",
        startNumber: 801
      }
    ]
  },
  UrlParser.quickAddSeries(
    'https://srv23-yama.sweetpixel.org/DDL/ANIME/HunterXHunter/HunterXHunter_Ep_001_SUB_ITA.mp4',
    'Hunter x Hunter (SUB-ITA)', 148,
    {image: 'https://i.imgur.com/7I1ZLeJ.jpeg'}
  ),
  UrlParser.quickAddSeries(
    'https://srv15-cuccia.sweetpixel.org/DDL/ANIME/BlackClover/BlackClover_Ep_001_SUB_ITA.mp4',
    'Black Clover (SUB-ITA)', 170,
    {image: 'https://i.imgur.com/5eMMefj.jpeg'}
  ),
  {
    id: 'SnK',
    title: 'Attack On Titan (SUB ITA)',
    image: 'https://i.imgur.com/n2G627u.jpeg',
    generator: 'auto-seasonal',
    seasons: [
      UrlParser.quickAddSeason('https://srv30-emiko.sweetpixel.org/DDL/ANIME/ShingekiNoKyojin/ShingekiNoKyojin_Ep_01_SUB_ITA.mp4', 25, 'Stagione 1'),
      UrlParser.quickAddSeason('https://srv22-remote.sweetpixel.org/DDL/ANIME/ShingekiNoKyojin2/ShingekiNoKyojin2_Ep_01_SUB_ITA.mp4', 12, 'Stagione 2', {image:'https://i.imgur.com/pipc5g7.jpeg'}),
      UrlParser.quickAddSeason('https://srv28-kokeshi.sweetpixel.org/DDL/ANIME/ShingekiNoKyojin3/ShingekiNoKyojin3_Ep_01_SUB_ITA.mp4', 22, 'Stagione 3', {image:'https://i.imgur.com/GlZeuLY.jpeg'}),
      UrlParser.quickAddSeason('https://srv16-suisen.sweetpixel.org/DDL/ANIME/ShingekiNoKyojin4/ShingekiNoKyojin4_Ep_01_SUB_ITA.mp4', 16, 'Stagione 4 Parte 1', {image:'https://i.imgur.com/f2nyTAX.jpeg'}),
      UrlParser.quickAddSeason('https://srv16-suisen.sweetpixel.org/DDL/ANIME/ShingekiNoKyojin4Part2/ShingekiNoKyojin4Part2_Ep_01_SUB_ITA.mp4', 12, 'Stagione 4 Parte 2', {image:'https://i.imgur.com/f2nyTAX.jpeg'})
    ]
  },
  {
    id: 'Chainsaw-ita',
    title: 'Chainsaw Man (ITA)',
    image: 'https://i.imgur.com/6I0aGYy.png',
    generator: 'auto-seasonal',
    seasons: [
      UrlParser.quickAddSeason('https://srv22-remote.sweetpixel.org/DDL/ANIME/ChainsawManITA/ChainsawMan_Ep_01_ITA.mp4', 12, 'Stagione 1')
    ]
  },
  {
    id: 'VinlandSaga-ita',
    title: 'Vinland Saga (ITA)',
    image: 'https://i.imgur.com/tK6OjGn.jpeg',
    generator: 'auto-seasonal',
    seasons: [
      UrlParser.quickAddSeason('https://srv14-caviale.sweetpixel.org/DDL/ANIME/VinlandSagaITA/VinlandSaga_Ep_01_ITA.mp4', 24, 'Stagione 1'),
      UrlParser.quickAddSeason('https://srv30-emiko.sweetpixel.org/DDL/ANIME/VinlandSaga2ITA/VinlandSaga2_Ep_01_ITA.mp4', 24, 'Stagione 2', {image:'https://i.imgur.com/s4jrBdE.jpeg'})
    ]
  },
  {
    id: 'tokyo-rev-ita',
    title: 'Tokyo Revengers (ITA)',
    image: 'https://i.imgur.com/Upo6C7l.jpeg',
    generator: 'auto-seasonal',
    seasons: [
      UrlParser.quickAddSeason('https://srv30-emiko.sweetpixel.org/DDL/ANIME/TokyoRevengersITA/TokyoRevengers_Ep_01_ITA.mp4', 24, 'Stagione 1')
    ]
  },
  {
    id: 'jjk-ita',
    title: 'Jujutsu Kaisen (ITA)',
    image: 'https://i.imgur.com/XBfPQOZ.jpeg',
    generator: 'auto-seasonal',
    seasons: [
      UrlParser.quickAddSeason('https://srv26-lampada.sweetpixel.org/DDL/ANIME/JujutsuKaisenITA/JujutsuKaisen_Ep_01_ITA.mp4', 24, 'Stagione 1'),
      UrlParser.quickAddSeason('https://srv17-geisha.sweetpixel.org/DDL/ANIME/JujutsuKaisen2ITA/JujutsuKaisen2_Ep_01_ITA.mp4', 23, 'Stagione 2', {image:'https://i.imgur.com/swRaN5Y.jpeg'})
    ]
  },
  {
    id: 'hellsparadise',
    title: "Hell's Paradise (SUB ITA)",
    image: 'https://i.imgur.com/0Fgpced.jpeg',
    generator: 'auto-seasonal',
    seasons: [
      UrlParser.quickAddSeason('https://srv27-gordon.sweetpixel.org/DDL/ANIME/Jigokuraku/Jigokuraku_Ep_01_SUB_ITA.mp4', 13, 'Stagione 1')
    ]
  },
  {
    id: 'hellsparadise-ita',
    title: "Hell's Paradise (ITA)",
    image: 'https://i.imgur.com/d38rp7W.jpeg',
    generator: 'auto-seasonal',
    seasons: [
      UrlParser.quickAddSeason('https://srv13-eraser.sweetpixel.org/DDL/ANIME/JigokurakuITA/Jigokuraku_Ep_01_ITA.mp4', 13, 'Stagione 1')
    ]
  },
  {
    id: 'gachiakuta-ita',
    title: 'Gachiakuta (ITA)',
    image: 'https://i.imgur.com/bmjQnGO.jpeg',
    generator: 'auto-seasonal',
    seasons: [
      UrlParser.quickAddSeason('https://srv18-tsurukusa.sweetpixel.org/DDL/ANIME/GachiakutaITA/Gachiakuta_Ep_01_ITA.mp4', 13, 'Stagione 1')
    ]
  },
  UrlParser.quickAddSeries(
    'https://srv21-airbus.sweetpixel.org/DDL/ANIME/FairyTailITA/FairyTail_Ep_001_ITA.mp4',
    'Fairy Tail (ITA)', 175,
    {image: 'https://i.imgur.com/jtAk33L.jpeg'}
  ),
  {
    id: 'MyheroAcademiaITA',
    title: 'My Hero Academia (ITA)',
    image: 'https://i.imgur.com/a6oZaJX.jpeg',
    generator: 'auto-seasonal',
    seasons: [
      UrlParser.quickAddSeason('https://srv12-bananini.sweetpixel.org/DDL/ANIME/BokuNoHeroAcademiaITA/BokuNoHeroAcademia_Ep_01_ITA.mp4', 13, 'Stagione 1'),
      UrlParser.quickAddSeason('https://srv27-gordon.sweetpixel.org/DDL/ANIME/BokuNoHeroAcademia2ITA/BokuNoHeroAcademia2_Ep_01_ITA.mp4', 25, 'Stagione 2'),
      UrlParser.quickAddSeason('https://srv26-lampada.sweetpixel.org/DDL/ANIME/BokuNoHeroAcademia3ITA/BokuNoHeroAcademia3_Ep_01_ITA.mp4', 25, 'Stagione 3'),
      UrlParser.quickAddSeason('https://srv26-lampada.sweetpixel.org/DDL/ANIME/BokuNoHeroAcademia4ITA/BokuNoHeroAcademia4_Ep_01_ITA.mp4', 25, 'Stagione 4'),
      UrlParser.quickAddSeason('https://srv16-suisen.sweetpixel.org/DDL/ANIME/BokuNoHeroAcademia5ITA/BokuNoHeroAcademia5_Ep_01_ITA.mp4', 25, 'Stagione 5'),
      UrlParser.quickAddSeason('https://srv18-tsurukusa.sweetpixel.org/DDL/ANIME/BokuNoHeroAcademia6ITA/BokuNoHeroAcademia6_Ep_01_ITA.mp4', 25, 'Stagione 6'),
      UrlParser.quickAddSeason('https://srv18-tsurukusa.sweetpixel.org/DDL/ANIME/BokuNoHeroAcademia7ITA/BokuNoHeroAcademia7_Ep_01_ITA.mp4', 21, 'Stagione 7')
    ]
  },
  {
    id: 'drstoneITA',
    title: 'Dr. Stone (ITA)',
    image: 'https://i.imgur.com/73E1OPV.jpeg',
    generator: 'auto-seasonal',
    seasons: [
      UrlParser.quickAddSeason('https://srv26-lampada.sweetpixel.org/DDL/ANIME/DrStoneITA/DrStone_Ep_01_ITA.mp4', 24, 'Stagione 1'),
      UrlParser.quickAddSeason('https://srv20-coat.sweetpixel.org/DDL/ANIME/DrStone2ITA/DrStone2_Ep_01_ITA.mp4', 11, 'Stagione 2'),
      UrlParser.quickAddSeason('https://srv12-bananini.sweetpixel.org/DDL/ANIME/DrStone3ITA/DrStone3_Ep_01_ITA.mp4', 22, 'Stagione 3'),
      UrlParser.quickAddSeason('https://srv18-tsurukusa.sweetpixel.org/DDL/ANIME/DrStone4ITA/DrStone4_Ep_01_ITA.mp4', 24, 'Stagione 4')
    ]
  },
  UrlParser.quickAddSeries(
    'https://srv17-geisha.sweetpixel.org/DDL/ANIME/BleachITA/Bleach_Ep_001_ITA.mp4',
    'Bleach (ITA)', 366,
    {image: 'https://i.imgur.com/dZm9Lu4.jpeg'}
  ),
  UrlParser.quickAddSeries(
    'https://srv15-cuccia.sweetpixel.org/DDL/ANIME/DetectiveConan/DetectiveConan_Ep_0001_ITA.mp4',
    'Detective Conan (ITA)', 1160,
    {image: 'https://i.imgur.com/Uh6TWm9.jpeg'}
  ),
  {
    id: 'haikyuITA',
    title: 'Haikyuu!! (ITA)',
    image: 'https://i.imgur.com/UR9hVbS.jpeg',
    generator: 'auto-seasonal',
    seasons: [
      UrlParser.quickAddSeason('https://srv13-eraser.sweetpixel.org/DDL/ANIME/HaikyuuITA/Haikyuu_Ep_01_ITA.mp4', 25, 'Stagione 1'),
      UrlParser.quickAddSeason('https://srv17-geisha.sweetpixel.org/DDL/ANIME/Haikyuu2ITA/Haikyuu2_Ep_01_ITA.mp4', 25, 'Stagione 2'),
      UrlParser.quickAddSeason('https://srv22-remote.sweetpixel.org/DDL/ANIME/Haikyuu3ITA/Haikyuu3_Ep_01_ITA.mp4', 10, 'Stagione 3'),
      UrlParser.quickAddSeason('https://srv18-tsurukusa.sweetpixel.org/DDL/ANIME/HaikyuuToTheTopITA/HaikyuuToTheTop_Ep_01_ITA.mp4', 13, 'Stagione 4'),
      UrlParser.quickAddSeason('https://srv18-tsurukusa.sweetpixel.org/DDL/ANIME/HaikyuuToTheTop2ITA/HaikyuuToTheTop2_Ep_01_ITA.mp4', 12, 'Stagione 5')
    ]
  },
  {
    id: 'bluelock-ita',
    title: 'Blue Lock (ITA)',
    image: 'https://i.imgur.com/YOYjAco.jpeg',
    generator: 'auto-seasonal',
    seasons: [
      UrlParser.quickAddSeason('https://srv26-lampada.sweetpixel.org/DDL/ANIME/BlueLockITA/BlueLock_Ep_01_ITA.mp4', 24, 'Stagione 1'),
      UrlParser.quickAddSeason('https://srv18-tsurukusa.sweetpixel.org/DDL/ANIME/BlueLock2ITA/BlueLock2_Ep_01_ITA.mp4', 14, 'Stagione 2')
    ]
  },
  {
    id: 'soloLeveling-ita',
    title: 'Solo Leveling (ITA)',
    image: 'https://i.imgur.com/uHGaLy8.jpeg',
    generator: 'auto-seasonal',
    seasons: [
      UrlParser.quickAddSeason('https://srv16-suisen.sweetpixel.org/DDL/ANIME/OreDakeLevelUpNaKenITA/OreDakeLevelUpNaKen_Ep_01_ITA.mp4', 12, 'Stagione 1'),
      UrlParser.quickAddSeason('https://srv16-suisen.sweetpixel.org/DDL/ANIME/OreDakeLevelUpNaKen2ITA/OreDakeLevelUpNaKen2_Ep_01_ITA.mp4', 13, 'Stagione 2')
    ]
  },
  {
    id: 'TheEminenceInShadow-ita',
    title: 'The Eminence In Shadow (ITA)',
    image: 'https://i.imgur.com/VDfJF58.png',
    generator: 'auto-seasonal',
    seasons: [
      UrlParser.quickAddSeason('https://srv19-sushi.sweetpixel.org/DDL/ANIME/KageNoJitsuryokushaNiNaritakuteITA/KageNoJitsuryokushaNiNaritakute_Ep_01_ITA.mp4', 20, 'Stagione 1'),
      UrlParser.quickAddSeason('https://srv13-eraser.sweetpixel.org/DDL/ANIME/KageNoJitsuryokushaNiNaritakute2ITA/KageNoJitsuryokushaNiNaritakute2_Ep_01_ITA.mp4', 12, 'Stagione 2')
    ]
  },
  {
    id: 'DemonSlayer-ita',
    title: 'Demon Slayer (ITA)',
    image: 'https://i.imgur.com/Yzj0U7Z.jpeg',
    generator: 'auto-seasonal',
    seasons: [
      UrlParser.quickAddSeason('https://srv12-bananini.sweetpixel.org/DDL/ANIME/KimetsuNoYaibaITA/KimetsuNoYaiba_Ep_01_ITA.mp4', 26, 'Stagione 1'),
      UrlParser.quickAddSeason('https://srv15-cuccia.sweetpixel.org/DDL/ANIME/KimetsuNoYaibaMugenRessha-henITA/KimetsuNoYaibaMugenRessha-hen_Ep_01_ITA.mp4', 7, 'Stagione 2'),
      UrlParser.quickAddSeason('https://srv16-suisen.sweetpixel.org/DDL/ANIME/KimetsuNoYaibaYuukaku-henITA/KimetsuNoYaibaYuukaku-hen_Ep_01_ITA.mp4', 11, 'Stagione 3'),
      UrlParser.quickAddSeason('https://srv16-suisen.sweetpixel.org/DDL/ANIME/KimetsuNoYaibaKatanakajiNoSato-henITA/KimetsuNoYaibaKatanakajiNoSato-hen_Ep_01_ITA.mp4', 11, 'Stagione 4'),
      UrlParser.quickAddSeason('https://srv16-suisen.sweetpixel.org/DDL/ANIME/KimetsuNoYaibaHashiraGeiko-henITA/KimetsuNoYaibaHashiraGeiko-hen_Ep_01_ITA.mp4', 8, 'Stagione 5')
    ]
  }
];

// ==================== PROGRESS STORAGE ====================
class ProgressManager {
  static storageKey(id) {
    return `vichi_progress_${id}`;
  }
  
  static load(id) {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey(id)) || '{}');
    } catch {
      return {};
    }
  }
  
  static save(id, data) {
    localStorage.setItem(this.storageKey(id), JSON.stringify(data || {}));
  }
  
  static setLastEpisode(id, epNum) {
    const p = this.load(id);
    p.lastEpisode = epNum;
    this.save(id, p);
  }
  
  static setPosition(id, epNum, time, duration) {
    const p = this.load(id);
    p.positions = p.positions || {};
    p.positions[epNum] = {
      t: time || 0,
      d: duration || p.positions[epNum]?.d || 0,
      ts: Date.now()
    };
    this.save(id, p);
  }
  
  static clearPosition(id, epNum) {
    const p = this.load(id);
    if (p.positions) {
      delete p.positions[epNum];
      this.save(id, p);
    }
  }
  
  static markWatched(id, epNum) {
    const p = this.load(id);
    p.watched = p.watched || {};
    p.watched[epNum] = true;
    if (p.positions) delete p.positions[epNum];
    p.lastEpisode = epNum;
    this.save(id, p);
  }
  
  static isWatched(id, epNum) {
    return !!(this.load(id).watched?.[epNum]);
  }
  
  static getPosition(id, epNum) {
    return this.load(id).positions?.[epNum] ?? null;
  }
  
  static getLatestProgressPercent(series) {
    const p = this.load(series.id);
    if (!p?.positions) return 0;
    const entries = Object.values(p.positions);
    if (!entries.length) return 0;
    const latest = entries.sort((a, b) => (b.ts || 0) - (a.ts || 0))[0];
    if (!latest?.d) return 0;
    return Math.max(0, Math.min(100, Math.round((latest.t / latest.d) * 100)));
  }
}

// ==================== SERIES HELPERS ====================
class SeriesHelper {
  static isSeasonal(series) {
    return Array.isArray(series?.seasons) && series.seasons.length > 0;
  }
  
  static totalEpisodes(series) {
    if (Array.isArray(series?.segments) && series.segments.length) {
      return series.segments.reduce((sum, s) => {
        const from = Number(s.from) || 1;
        const to = Number(s.to) || from;
        return sum + Math.max(0, to - from + 1);
      }, 0);
    }
    
    if (this.isSeasonal(series)) {
      return series.seasons.reduce((a, s) => a + (s.episodes || 0), 0);
    }
    
    return series.episodes || 0;
  }
  
  static seasonFromAbsolute(series, absEp) {
    if (!this.isSeasonal(series)) {
      return { seasonIndex: 0, epInSeason: absEp };
    }
    
    let left = absEp;
    for (let i = 0; i < series.seasons.length; i++) {
      const n = series.seasons[i].episodes || 0;
      if (left <= n) return { seasonIndex: i, epInSeason: left };
      left -= n;
    }
    
    const lastIndex = Math.max(0, series.seasons.length - 1);
    return {
      seasonIndex: lastIndex,
      epInSeason: Math.max(1, series.seasons[lastIndex].episodes || 1)
    };
  }
  
  static buildEpisodeUrl(series, absEp) {
    // Segments con indice personalizzato
    if (Array.isArray(series.segments)) {
      const seg = series.segments.find(s => absEp >= s.from && absEp <= s.to);
      if (seg) {
        const start = (typeof seg.startNumber === 'number') ? seg.startNumber : 1;
        const fileNumber = start + (absEp - seg.from);
        const ep = String(fileNumber).padStart(seg.padLength || 2, '0');
        const lang = (seg.lang || series.lang || '').replace(/\s+/g, '_');
        const prefix = seg.filePrefix || '';
        const base = seg.baseUrl.endsWith('/') ? seg.baseUrl : seg.baseUrl + '/';
        return `${base}${prefix}${ep}_${lang}.mp4`;
      }
    }
    
    // Stagionale
    if (this.isSeasonal(series)) {
      const { seasonIndex, epInSeason } = this.seasonFromAbsolute(series, absEp);
      return this.buildSeasonEpisodeUrl(series.seasons[seasonIndex], epInSeason);
    }
    
    // Flat
    return this.buildSeasonEpisodeUrl(series, absEp);
  }
  
  static buildSeasonEpisodeUrl(seasonData, epNum) {
    const padLen = seasonData.padLength || 2;
    const ep = String(epNum).padStart(padLen, '0');
    const lang = (seasonData.lang || '').replace(/\s+/g, '_');
    return `${seasonData.baseUrl}${seasonData.filePrefix}${ep}_${lang}.mp4`;
  }
  
  static findById(id) {
    return CATALOG.find(s => s.id === id);
  }
}

// ==================== UI MANAGER ====================
class UIManager {
  static elements = {
    home: $('#home'),
    all: $('#all'),
    watch: $('#watch'),
    allGrid: $('#allGrid'),
    homeCarousels: $('#homeCarousels'),
    searchStatus: $('#searchStatus'),
    searchInput: $('#searchInput'),
    searchClear: $('#searchClear'),
    searchPanel: $('#searchPanel'),
    searchFab: $('#searchFab')
  };
  
  static showHome() {
    this.elements.all.style.display = 'none';
    this.elements.watch.style.display = 'none';
    this.elements.home.style.display = 'block';
    requestAnimationFrame(() => {
      const nb = $('.nav-center-box')?.getBoundingClientRect().bottom || 0;
      document.documentElement.style.setProperty('--dock-h', Math.ceil(nb) + 'px');
    });
  }
  
  static showAll() {
    this.elements.home.style.display = 'none';
    this.elements.watch.style.display = 'none';
    this.elements.all.style.display = 'block';
  }
  
  static showWatch() {
    this.elements.home.style.display = 'none';
    this.elements.all.style.display = 'none';
    this.elements.watch.style.display = 'block';
  }
}

// ==================== CAROUSEL ====================
class Carousel {
  static create({ id, title, items, size = 'default', showProgress = false }) {
    if (!items || !items.length) return null;
    
    const row = document.createElement('div');
    row.className = 'row' + (size === 'xl' ? ' row--xl' : '');
    row.innerHTML = `
      <div class="row-head">
        <div class="row-title">${title}</div>
        <div class="row-ctrls">
          <button class="arrow" id="${id}-prev" aria-label="Scorri a sinistra">◀</button>
          <button class="arrow" id="${id}-next" aria-label="Scorri a destra">▶</button>
        </div>
      </div>`;
    
    const track = document.createElement('div');
    track.className = 'carousel';
    track.id = `${id}-track`;
    row.appendChild(track);
    
    const updateFades = () => {
      const max = track.scrollWidth - track.clientWidth;
      row.classList.toggle('has-fade-right', track.scrollLeft < max - 2);
    };
    
    track.addEventListener('scroll', updateFades, { passive: true });
    new ResizeObserver(updateFades).observe(track);
    requestAnimationFrame(updateFades);
    
    for (const item of items) {
      track.appendChild(this.createCard(item, size, showProgress));
    }
    
    this.setupControls(row, track, id, size);
    return row;
  }
  
  static createCard(item, size, showProgress) {
    const cell = document.createElement('div');
    cell.className = 'c-item';
    
    const card = document.createElement('div');
    card.className = size === 'xl' ? 'c-card c-card--xl' : 'c-card';
    
    // Badge lingua
    const badges = document.createElement('div');
    badges.className = 'c-badges';
    if (item.lang) {
      const badge = document.createElement('span');
      badge.className = 'c-badge';
      badge.textContent = item.lang;
      badges.appendChild(badge);
    }
    card.appendChild(badges);
    
    // Poster
    const img = document.createElement('img');
    img.className = size === 'xl' ? 'c-poster c-poster--xl' : 'c-poster';
    img.src = item.image || '';
    img.alt = item.title;
    img.onerror = () => this.setFallbackImage(img, item.title);
    card.appendChild(img);
    
    // Info per card XL
    if (size === 'xl') {
      const grad = document.createElement('div');
      grad.className = 'c-grad--xl';
      const info = document.createElement('div');
      info.className = 'c-info--xl';
      const titleEl = document.createElement('div');
      titleEl.className = 'c-title--xl';
      titleEl.textContent = item.title;
      info.appendChild(titleEl);
      card.appendChild(grad);
      card.appendChild(info);
    }
    
    // Progress bar
    if (showProgress) {
      const pct = ProgressManager.getLatestProgressPercent(item);
      const bar = document.createElement('div');
      bar.className = 'c-progress';
      const fill = document.createElement('i');
      fill.style.width = pct + '%';
      bar.appendChild(fill);
      card.appendChild(bar);
    }
    
    card.addEventListener('click', () => WatchPage.open(item));
    cell.appendChild(card);
    return cell;
  }
  
  static setFallbackImage(img, title) {
    img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600">
        <rect width="100%" height="100%" fill="#131318"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
              fill="#fff" font-family="Arial" font-size="24">${title}</text>
      </svg>`
    );
  }
  
  static setupControls(row, track, id, size) {
    const prev = row.querySelector(`#${id}-prev`);
    const next = row.querySelector(`#${id}-next`);
    
    const step = () => {
      const c = track.querySelector('.c-item');
      return (c ? c.getBoundingClientRect().width : 280) * (size === 'xl' ? 1.2 : 3);
    };
    
    prev.onclick = () => track.scrollBy({ left: -step(), behavior: 'smooth' });
    next.onclick = () => track.scrollBy({ left: step(), behavior: 'smooth' });
  }
}

// ==================== HOME PAGE ====================
class HomePage {
  static render(options = {}) {
    const { query = '', results = null } = options;
    const container = UIManager.elements.homeCarousels;
    container.innerHTML = '';
    
    if (query) {
      UIManager.elements.searchStatus.style.display = 'block';
      UIManager.elements.searchStatus.textContent = results?.length 
        ? `Risultati per "${query}" — ${results.length}` 
        : `Nessun risultato per "${query}"`;
    } else {
      UIManager.elements.searchStatus.style.display = 'none';
      UIManager.elements.searchStatus.textContent = '';
    }
    
    if (query) {
      const row = Carousel.create({
        id: 'row-search',
        title: 'Risultati',
        items: results || [],
        size: 'xl'
      });
      if (row) container.appendChild(row);
      return;
    }
    
    // Riprendi a guardare
    const resumeItems = CATALOG
      .map(s => {
        const p = ProgressManager.load(s.id);
        const ts = p?.positions 
          ? Math.max(...Object.values(p.positions).map(x => x.ts || 0), 0) 
          : 0;
        return ts ? { s, ts } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.ts - a.ts)
      .map(x => x.s)
      .slice(0, 20);
    
    const rowResume = Carousel.create({
      id: 'row-resume',
      title: 'Riprendi',
      items: resumeItems,
      size: 'xl',
      showProgress: true
    });
    if (rowResume) container.appendChild(rowResume);
    
    // Anime ITA
    const itaAnime = CATALOG.filter(s => /\(ITA\)/i.test(s.title));
    const rowITA = Carousel.create({
      id: 'row-ita',
      title: 'Anime doppiati in italiano 🇮🇹',
      items: itaAnime,
      size: 'xl'
    });
    if (rowITA) container.appendChild(rowITA);
    
    // SUB ITA
    const subIta = CATALOG.filter(s => /SUB.?ITA/i.test(s.title));
    const rowSub = Carousel.create({
      id: 'row-sub',
      title: 'Anime SUB-ITA',
      items: subIta
    });
    if (rowSub) container.appendChild(rowSub);
  }
}

// ==================== ALL PAGE ====================
class AllPage {
  static render(items = CATALOG) {
    const grid = UIManager.elements.allGrid;
    grid.innerHTML = '';
    
    const sorted = [...items].sort((a, b) => 
      (a.title || '').localeCompare(b.title || '')
    );
    
    for (const s of sorted) {
      const card = this.createCard(s);
      grid.appendChild(card);
    }
  }
  
  static createCard(series) {
    const card = document.createElement('article');
    card.className = 'all-card';
    card.dataset.id = series.id;
    card.onclick = (e) => {
      e.preventDefault();
      WatchPage.open(series, true);
    };
    
    // Badge
    const badges = document.createElement('div');
    badges.className = 'all-badges';
    const lang = series.lang || (Array.isArray(series.seasons) ? series.seasons[0]?.lang : '');
    if (lang) {
      const badge = document.createElement('span');
      badge.className = 'all-badge';
      badge.textContent = lang;
      badges.appendChild(badge);
    }
    card.appendChild(badges);
    
    // Poster
    const img = document.createElement('img');
    img.className = 'all-poster';
    img.src = series.image || '';
    img.alt = series.title;
    img.onerror = () => Carousel.setFallbackImage(img, series.title);
    card.appendChild(img);
    
    // Titolo
    const title = document.createElement('div');
    title.className = 'all-title-sm';
    title.textContent = series.title;
    card.appendChild(title);
    
    return card;
  }
}

// ==================== WATCH PAGE ====================
class WatchPage {
  static currentSeries = null;
  static currentSeasonIndex = 0;
  
  static open(series, fromAll = false) {
    UIManager.showWatch();
    this.currentSeries = series;
    this.updateHeader(series);
    this.renderSeasons(series);
    
    if (fromAll) {
      requestAnimationFrame(() => {
        const cardElem = document.querySelector(`[data-id="${series.id}"]`);
        if (cardElem) {
          cardElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }
  }
  
  static updateHeader(series) {
    const banner = $('#watchBanner');
    const title = $('#watchTitle');
    
    const currentSeason = SeriesHelper.isSeasonal(series) 
      ? series.seasons?.[this.currentSeasonIndex] 
      : null;
    
    banner.src = currentSeason?.image || series.image || '';
    title.textContent = series.title || 'Titolo';
  }
  
  static renderSeasons(series) {
    this.buildSeasonPicker(series);
    this.renderEpisodeButtons(series);
    this.updateResumeButton(series);
  }
  
  static buildSeasonPicker(series) {
    const picker = $('#seasonPicker');
    picker.innerHTML = '';
    
    if (SeriesHelper.isSeasonal(series)) {
      series.seasons.forEach((s, idx) => {
        const pill = document.createElement('button');
        pill.className = 'season-pill' + (idx === this.currentSeasonIndex ? ' active' : '');
        pill.textContent = s.title || `Stagione ${idx + 1}`;
        pill.onclick = () => {
          this.currentSeasonIndex = idx;
          this.renderSeasons(series);
        };
        picker.appendChild(pill);
      });
    } else {
      this.currentSeasonIndex = 0;
      const pill = document.createElement('button');
      pill.className = 'season-pill active';
      pill.textContent = 'Tutti gli episodi';
      picker.appendChild(pill);
    }
    
    this.updateHeader(series);
  }
  
  static renderEpisodeButtons(series) {
    const list = $('#episodeList');
    list.innerHTML = '';
    
    let startAbs = 1;
    if (SeriesHelper.isSeasonal(series)) {
      for (let i = 0; i < this.currentSeasonIndex; i++) {
        startAbs += series.seasons[i].episodes || 0;
      }
      const count = series.seasons[this.currentSeasonIndex].episodes || 0;
      
      for (let i = 1; i <= count; i++) {
        const absEp = startAbs + (i - 1);
        this.createEpisodeButton(series, absEp, i, list);
      }
    } else {
      const count = SeriesHelper.totalEpisodes(series);
      for (let i = 1; i <= count; i++) {
        this.createEpisodeButton(series, i, i, list);
      }
    }
  }
  
  static createEpisodeButton(series, absEp, label, container) {
    const btn = document.createElement('button');
    btn.className = 'episode-btn';
    btn.dataset.ep = absEp;
    btn.textContent = String(label).padStart(3, '0');
    
    if (ProgressManager.isWatched(series.id, absEp)) {
      btn.classList.add('watched');
    }
    
    btn.onclick = () => Player.play(series, absEp);
    container.appendChild(btn);
  }
  
  static updateResumeButton(series) {
    const btn = $('#watchResumeBtn');
    if (!btn || !series) return;
    
    const progress = ProgressManager.load(series.id);
    let resumeEp = 0;
    
    if (progress?.positions) {
      const entries = Object.entries(progress.positions).filter(([n, p]) => 
        p && typeof p.t === 'number' && typeof p.d === 'number' && p.t < (p.d - 10)
      );
      if (entries.length) {
        entries.sort((a, b) => (b[1].ts || 0) - (a[1].ts || 0));
        resumeEp = parseInt(entries[0][0], 10);
      }
    }
    
    if (!resumeEp && progress?.lastEpisode) {
      const lp = progress.positions?.[progress.lastEpisode];
      if (lp && lp.t && lp.d && lp.t < lp.d - 10) {
        resumeEp = progress.lastEpisode;
      }
    }
    
    if (resumeEp) {
      btn.style.display = 'inline-flex';
      btn.textContent = `▶ Riprendi episodio ${String(resumeEp).padStart(2, '0')}`;
      btn.onclick = () => Player.play(series, resumeEp);
    } else {
      btn.style.display = 'none';
    }
  }
  
  static updateEpisodeButtonState(seriesId, ep) {
    const btn = $('#episodeList').querySelector(`.episode-btn[data-ep="${ep}"]`);
    if (btn) btn.classList.add('watched');
  }
}

// ==================== PLAYER ====================
class Player {
  static currentSeries = null;
  static currentEp = null;
  static lastSave = 0;
  
  static init() {
    const overlay = $('#playerOverlay');
    const video = $('#video');
    const closeBtn = $('#playerClose');
    const prevBtn = $('#prevEp');
    const nextBtn = $('#nextEp');
    
    closeBtn?.addEventListener('click', () => this.close());
    prevBtn.onclick = () => this.move((this.currentEp || 1) - 1);
    nextBtn.onclick = () => this.move((this.currentEp || 1) + 1);
    
    video.addEventListener('timeupdate', () => this.handleTimeUpdate());
    video.addEventListener('ended', () => this.handleEnded());
    video.addEventListener('play', () => WatchTogether.broadcastState());
    video.addEventListener('pause', () => WatchTogether.broadcastState());
    video.addEventListener('seeked', () => WatchTogether.broadcastState());
    
    overlay.addEventListener('keydown', (e) => this.handleKeyboard(e));
    this.setupTouchGestures(overlay);
  }
  
  static play(series, ep) {
    this.currentSeries = series;
    this.currentEp = ep;
    
    const video = $('#video');
    const source = $('#episode');
    const overlay = $('#playerOverlay');
    const nowTitle = $('#nowTitle');
    const nowInfo = $('#nowInfo');
    
    const src = SeriesHelper.buildEpisodeUrl(series, ep);
    source.src = src;
    video.load();
    
    nowTitle.textContent = `${series.title} — Ep ${String(ep).padStart(3, '0')}`;
    nowInfo.textContent = src.split('/').slice(-2).join('/');
    
    ProgressManager.setLastEpisode(series.id, ep);
    
    overlay.style.display = 'flex';
    overlay.classList.add('show');
    document.documentElement.style.overflow = 'hidden';
    
    const pos = ProgressManager.getPosition(series.id, ep);
    const trySeek = () => {
      if (pos?.t > 5) video.currentTime = pos.t - 1;
      video.play().catch(() => {});
    };
    
    if (video.readyState >= 2) trySeek();
    else video.addEventListener('canplay', trySeek, { once: true });
    
    if (WatchTogether.roomId) {
  // assicura che siamo connessi e dentro alla stanza
  WatchTogether.joinRoom(WatchTogether.roomId);

  // manda lo stato iniziale dopo un attimo, così il video ha avuto tempo di partire
  setTimeout(() => WatchTogether.broadcastState(), 400);
  if (WatchTogether.roomId) {
  WatchTogether.notifyEpisodeChange();
  }
}
  }
  
  static move(epNum) {
    if (!this.currentSeries) return;
    const max = SeriesHelper.totalEpisodes(this.currentSeries);
    if (epNum < 1 || epNum > max) return;
    
    if (SeriesHelper.isSeasonal(this.currentSeries)) {
      const { seasonIndex } = SeriesHelper.seasonFromAbsolute(this.currentSeries, epNum);
      if (seasonIndex !== WatchPage.currentSeasonIndex) {
        WatchPage.currentSeasonIndex = seasonIndex;
        WatchPage.renderSeasons(this.currentSeries);
      }
    }
    
    this.play(this.currentSeries, epNum);
  }
  
  static close() {
    this.persistProgress();
    const video = $('#video');
    const source = $('#episode');
    const overlay = $('#playerOverlay');
    
    try { video.pause(); } catch {}
    source.src = '';
    overlay.classList.remove('show');
    overlay.style.display = 'none';
    document.documentElement.style.overflow = '';
    
    if (this.currentSeries) {
      WatchPage.updateResumeButton(this.currentSeries);
    }
  }
  
  static persistProgress() {
    try {
      if (!this.currentSeries || !this.currentEp) return;
      const video = $('#video');
      const t = video?.currentTime || 0;
      const d = video?.duration || 0;
      if (d > 0) {
        ProgressManager.setPosition(this.currentSeries.id, this.currentEp, t, d);
      }
    } catch {}
  }
  
  static handleTimeUpdate() {
    if (!this.currentSeries || !this.currentEp) return;
    const video = $('#video');
    const t = video.currentTime;
    const d = video.duration;
    
    if ((Date.now() - this.lastSave) < 2000) return;
    this.lastSave = Date.now();
    
    if (d > 0) {
      ProgressManager.setPosition(this.currentSeries.id, this.currentEp, t, d);
      if (t / d >= 0.9) {
        ProgressManager.markWatched(this.currentSeries.id, this.currentEp);
        WatchPage.updateEpisodeButtonState(this.currentSeries.id, this.currentEp);
        WatchPage.updateResumeButton(this.currentSeries);
      }
    }
  }
  
  static handleEnded() {
    if (!this.currentSeries || !this.currentEp) return;
    ProgressManager.markWatched(this.currentSeries.id, this.currentEp);
    ProgressManager.clearPosition(this.currentSeries.id, this.currentEp);
    WatchPage.updateResumeButton(this.currentSeries);
    this.move(this.currentEp + 1);
  }
  
  static handleKeyboard(e) {
    if (/(input|textarea|select)/i.test(e.target.tagName)) return;
    const video = $('#video');
    
    switch (e.key) {
      case ' ':
        e.preventDefault();
        if (video.paused) video.play().catch(() => {});
        else video.pause();
        break;
      case 'ArrowLeft':
        video.currentTime = Math.max(0, (video.currentTime || 0) - 5);
        break;
      case 'ArrowRight':
        video.currentTime = Math.min(video.duration || 1e9, (video.currentTime || 0) + 5);
        break;
      case 'Escape':
        this.close();
        break;
      case 'n':
      case 'N':
        this.move((this.currentEp || 1) + 1);
        break;
      case 'p':
      case 'P':
        this.move((this.currentEp || 1) - 1);
        break;
    }
  }
  
  static setupTouchGestures(overlay) {
    let startY = 0, dy = 0, swiping = false;
    
    overlay.addEventListener('touchstart', (e) => {
      if (!e.touches?.length) return;
      startY = e.touches[0].clientY;
      dy = 0;
      swiping = true;
    }, { passive: true });
    
    overlay.addEventListener('touchmove', (e) => {
      if (!swiping || !e.touches?.length) return;
      dy = e.touches[0].clientY - startY;
      if (dy > 10) {
        overlay.style.transform = `translateY(${Math.min(dy, 120)}px)`;
        overlay.style.opacity = String(Math.max(0.6, 1 - dy / 600));
      }
    }, { passive: true });
    
    overlay.addEventListener('touchend', () => {
      if (!swiping) return;
      swiping = false;
      overlay.style.transform = '';
      overlay.style.opacity = '';
      if (dy > 120) this.close();
    });
  }
}

// ==================== SEARCH ====================
class Search {
  static init() {
    const fab = UIManager.elements.searchFab;
    const panel = UIManager.elements.searchPanel;
    const input = UIManager.elements.searchInput;
    const clear = UIManager.elements.searchClear;
    
    fab?.addEventListener('click', () => this.toggle());
    input?.addEventListener('input', () => this.handleInput(), { passive: true });
    input?.addEventListener('keydown', (e) => this.handleKeydown(e));
    clear?.addEventListener('click', () => this.clear());
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && panel.classList.contains('show')) {
        this.close();
      }
    });
    
    document.addEventListener('click', (e) => {
      if (!panel.classList.contains('show')) return;
      const isInside = panel.contains(e.target) || fab.contains(e.target);
      if (!isInside) this.close();
    });
  }
  
  static toggle() {
    const panel = UIManager.elements.searchPanel;
    if (panel.classList.contains('show')) {
      this.close();
    } else {
      this.open();
    }
  }
  
  static open() {
    const panel = UIManager.elements.searchPanel;
    const fab = UIManager.elements.searchFab;
    const input = UIManager.elements.searchInput;
    
    panel.classList.add('show');
    panel.setAttribute('aria-hidden', 'false');
    fab.setAttribute('aria-expanded', 'true');
    setTimeout(() => input?.focus(), 0);
  }
  
  static close() {
    const panel = UIManager.elements.searchPanel;
    const fab = UIManager.elements.searchFab;
    
    panel.classList.remove('show');
    panel.setAttribute('aria-hidden', 'true');
    fab.setAttribute('aria-expanded', 'false');
  }
  
  static handleInput() {
    const input = UIManager.elements.searchInput;
    const clear = UIManager.elements.searchClear;
    const query = input?.value || '';
    
    const results = this.filter(query);
    HomePage.render({ query: query.trim(), results });
    
    if (clear) {
      clear.style.visibility = query ? 'visible' : 'hidden';
    }
  }
  
  static handleKeydown(e) {
    const input = UIManager.elements.searchInput;
    if (e.key === 'Escape') {
      input.value = '';
      this.handleInput();
      input.blur();
      this.close();
    }
  }
  
  static clear() {
    const input = UIManager.elements.searchInput;
    input.value = '';
    this.handleInput();
    input.focus();
  }
  
  static filter(query) {
    const normalize = (str) => (str || '').toLowerCase();
    const q = normalize(query).trim();
    
    if (!q) return CATALOG;
    
    return CATALOG.filter(s => {
      const title = normalize(s.title);
      const lang = normalize(s.lang || (SeriesHelper.isSeasonal(s) ? s.seasons[0]?.lang : ''));
      return title.includes(q) || lang.includes(q);
    });
  }
}

// ==================== WATCH TOGETHER (WebSocket puro) ====================
class WatchTogether {
  static ws = null;
  static roomId = null;
  static suppressBroadcast = false;
  static iAmCreator = false;
  static reconnectTimer = null;

  // URL del WS server
  // Nota: /watch deve combaciare con `path: '/watch'` lato server
  static getWSUrl() {
    const isLocal = (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
    const base = isLocal
      ? 'ws://localhost:3001'
      : 'wss://itanime.onrender.com'; // <-- metti il tuo dominio backend WS
    return base + '/watch';
  }

  static init() {
    const wtHomeBar = $('#wtHomeBar'); // "Guarda Insieme" in nav
    wtHomeBar && (wtHomeBar.style.display = 'inline');

    wtHomeBar?.addEventListener('click', (e) => {
      e.preventDefault();
      // se non ho una room, la creo ora
      if (!WatchTogether.roomId) {
      WatchTogether.roomId = WatchTogether.makeRoomId();
      WatchTogether.iAmCreator = true;
      }

      WatchTogether.joinRoom(WatchTogether.roomId);

      const link = WatchTogether.buildInviteUrl(WatchTogether.roomId);
      WatchTogether.copyToClipboard(link);

    });

    this.autoJoinFromUrl();
  }

  // -- Public helper per Player.play() ecc.
  static joinRoom(rid) {
    this.roomId = rid;
    const ws = this.ensureWS();
    if (ws.readyState === WebSocket.OPEN) {
      this._send({
        type: 'join-room',
        roomId: this.roomId
      });
    }
    // se non è ancora OPEN, lo manderemo al 'open' listener
  }

  static makeRoomId() {
    return 'WT-' + Math.random().toString(36).slice(2, 7).toUpperCase();
  }

  static buildInviteUrl(rid) {
    const url = new URL(location.href);
    url.searchParams.set('room', rid);
    url.searchParams.delete('series');
    url.searchParams.delete('ep');
    return url.toString();
  }

  static async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      alert("Link copiato! Invia ai tuoi amici ✨");
    } catch {
      prompt("Copia manualmente il link", text);
    }
  }

  // Connessione/reconnessione WS
  static ensureWS() {
    // se ho già un WS aperto -> ok
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return this.ws;
    // se sto già connettendo (CONNECTING), restituisco comunque l'oggetto
    if (this.ws && this.ws.readyState === WebSocket.CONNECTING) return this.ws;

    // crea nuova connessione
    const url = this.getWSUrl();
    const ws = new WebSocket(url);
    this.ws = ws;

    ws.addEventListener('open', () => {
      console.log('[WT] WS connected');
      // appena connessi, se ho già una stanza selezionata, faccio join
      if (this.roomId) {
        this._send({
          type: 'join-room',
          roomId: this.roomId
        });
      }
    });

    ws.addEventListener('message', (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }
      if (!msg || typeof msg !== 'object') return;

      switch (msg.type) {
        case 'sync-state':
          this.handleSyncState(msg.state);
          break;
        default:
          // ignora roba sconosciuta
          break;
      }
    });

    ws.addEventListener('close', () => {
      console.warn('[WT] WS closed');
      // tentativo di reconnect "soft"
      // (evita ciclo infinito se l'utente ha chiuso la pagina)
      if (!this.reconnectTimer) {
        this.reconnectTimer = setTimeout(() => {
          this.reconnectTimer = null;
          if (document.visibilityState !== 'hidden') {
            this.ensureWS(); // prova di nuovo
          }
        }, 2000);
      }
    });

    ws.addEventListener('error', (err) => {
      console.warn('[WT] WS error', err);
      // lasciamo gestire al 'close' l'eventuale retry
    });

    return ws;
  }

  static _send(obj) {
    try {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(obj));
      }
    } catch (e) {
      console.warn('[WT] send failed', e);
    }
  }

  // Chiamata quando riceviamo stato remoto O quando qualcuno entra e il server ci manda sync
  static handleSyncState(state) {
  const sId = state?.seriesId;
  const hasEp = state?.ep !== undefined && state?.ep !== null;
  const ep = hasEp ? Number(state.ep) : null;

  // se ho info su serie+episodio, posso forzare l'apertura di quell'episodio
  if (sId && hasEp) {
    const s = SeriesHelper.findById(sId);
    if (s) {
      const needSwitchSeries = !Player.currentSeries || Player.currentSeries.id !== sId;
      const needSwitchEp     = Player.currentEp !== ep;

      if (needSwitchSeries || needSwitchEp) {
        this.suppressBroadcast = true;
        try {
          // Apri la pagina della serie sul follower
          WatchPage.open(s);

          // Fai partire l'episodio giusto sul follower
          setTimeout(() => Player.play(s, ep), 50);
        } finally {
          // Dopo aver caricato il video, allinea tempo e play/pause
          setTimeout(() => this.applyRemoteState(state), 250);
        }
        return;
      }
    }
  }

  // Se siamo già sulla stessa serie/ep, o non abbiamo ep chiaro,
  // limitiamoci a syncare play/pause/time
  this.applyRemoteState(state);
}


  static applyRemoteState(state) {
    const video = $('#video');
    if (!video) return;

    this.suppressBroadcast = true;
    try {
      // sync time
      const t = Number(state?.time || 0);
      if (!Number.isNaN(t)) {
        const delta = Math.abs((video.currentTime || 0) - t);
        if (delta > 0.6) {
          video.currentTime = t;
        }
      }

      // sync pausa/riproduzione
      if (state?.paused) {
        video.pause();
      } else {
        video.play().catch(() => {});
      }
    } finally {
      // piccolo delay per non ribroadcastare subito quello che abbiamo appena applicato
      setTimeout(() => { this.suppressBroadcast = false; }, 120);
    }
  }

  // Chiamala subito dopo aver cambiato episodio localmente.
// Serve ad annunciare "ragazzi ora guardiamo questo ep".
  static notifyEpisodeChange() {
    if (!this.roomId) return;
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    // piccolo delay per dare tempo a Player.play() di:
    // - aggiornare Player.currentSeries / Player.currentEp
    // - settare video.src
    // così quando broadcastiamo, lo stato è già consistente
    setTimeout(() => {
      // importante: permettiamo il broadcast qui (non stiamo applicando stato remoto)
      this.suppressBroadcast = false;
      this.broadcastState();
    }, 200);
  }



  // Chiamata ogni volta che il tuo player locale cambia (play/pause/seek/timeupdate iniziale)
  static broadcastState() {
    if (!this.roomId) return;
    if (this.suppressBroadcast) return;
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const video = $('#video');
    this._send({
      type: 'update-state',
      roomId: this.roomId,
      state: {
        seriesId: Player.currentSeries?.id || null,
        ep: Player.currentEp || null,
        time: video?.currentTime || 0,
        paused: video?.paused ?? true
      }
    });
  }

  // Auto-join quando apro un link con ?room=...
  static autoJoinFromUrl() {
    const params = new URLSearchParams(location.search);
    const rid = params.get('room');
    if (!rid) return;

    this.roomId = rid;
    this.joinRoom(rid); // farà ensureWS() e manderà join-room quando pronto

    // Extra opzionale: se nel link ci sono anche ?series=...&ep=...
    const sId = params.get('series');
    const ep = Number(params.get('ep') || 0);
    if (sId && ep) {
      const s = SeriesHelper.findById(sId);
      if (s) {
        WatchPage.open(s);
        setTimeout(() => Player.play(s, ep), 80);
      }
    }
  }
}

// ==================== NAVIGATION ====================
class Navigation {
  static init() {
    const brandLogo = $('#brandLogo');
    const navHomeBtn = $('#navHomeBtn');
    const navAllBtn = $('#navAllBtn');
    
    brandLogo?.addEventListener('click', (e) => {
      e.preventDefault();
      this.goHome();
    });
    
    navHomeBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this.goHome();
    });
    
    navAllBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      AllPage.render();
      UIManager.showAll();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  
  static goHome() {
    try {
      const video = $('#video');
      if (video) video.pause();
    } catch {}
    
    UIManager.showHome();
    Player.currentSeries = null;
    Player.currentEp = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// ==================== TOUCH DETECTION ====================
class TouchDetection {
  static init() {
    try {
      if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        document.body.classList.add('is-touch');
      }
    } catch {}
  }
}

// ==================== APP INITIALIZATION ====================
class App {
  static init() {
    Auth.init();
    
    document.addEventListener('DOMContentLoaded', () => {
      DockMetrics.init();
      Player.init();
      Search.init();
      Navigation.init();
      WatchTogether.init();
      TouchDetection.init();
      
      HomePage.render();
      UIManager.showHome();
    });
  }
}

// ==================== START APP ====================
App.init();