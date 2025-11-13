// js/ui-manager.js

// helpers globali che già usi
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

class UIManager {
  static elements = {
    home: $('#home'),
    all: $('#all'),
    watch: $('#watch'),
    roulette: $('#roulette'),
    allGrid: $('#allGrid'),
    homeCarousels: $('#homeCarousels'),
    homeHero: $('#homeHero'),
    heroBackground: $('#heroBackground'),
    heroTitle: $('#heroTitle'),
    heroDescription: $('#heroDescription'),
    heroMeta: $('#heroMeta'),
    heroTag: $('#heroTag'),
    heroPlay: $('#heroPlay'),
    heroMore: $('#heroMore'),
    searchStatus: $('#searchStatus'),
    searchInput: $('#searchInput'),
    searchClear: $('#searchClear'),
    searchPanel: $('#searchPanel'),
    searchFab: $('#searchFab'),
    providerExploreSection: $('#providerExploreSection'),
    providerFilterList: $('#providerFilters'),
    providerCarousels: $('#providerCarouselsHome')
  };

  static showHome() {
    this.setActiveNav('navHomeBtn');

    this.elements.all.style.display = 'none';
    this.elements.watch.style.display = 'none';
    if (this.elements.roulette) this.elements.roulette.style.display = 'none';
    this.elements.home.style.display = 'block';

    requestAnimationFrame(() => {
      const nb = $('.topbar')?.getBoundingClientRect().bottom || 0;
      document.documentElement.style.setProperty('--dock-h', Math.ceil(nb) + 'px');
    });

    window.scrollTo({ top: 0 });
  }

  static showAll() {
    this.setActiveNav('navAllBtn');

    this.elements.home.style.display = 'none';
    this.elements.watch.style.display = 'none';
    if (this.elements.roulette) this.elements.roulette.style.display = 'none';
    this.elements.all.style.display = 'block';

    requestAnimationFrame(() => {
      const nb = $('.topbar')?.getBoundingClientRect().bottom || 0;
      document.documentElement.style.setProperty('--dock-h', Math.ceil(nb) + 'px');
    });

    window.scrollTo({ top: 0 });
  }

  static showWatch() {
    this.setActiveNav(null);

    this.elements.home.style.display = 'none';
    this.elements.all.style.display = 'none';
    if (this.elements.roulette) this.elements.roulette.style.display = 'none';
    this.elements.watch.style.display = 'block';

    requestAnimationFrame(() => {
      const nb = $('.topbar')?.getBoundingClientRect().bottom || 0;
      document.documentElement.style.setProperty('--dock-h', Math.ceil(nb) + 'px');
    });

    window.scrollTo({ top: 0 });
  }

  static showRoulette() {
    this.setActiveNav('navRouletteBtn');

    this.elements.home.style.display = 'none';
    this.elements.all.style.display = 'none';
    this.elements.watch.style.display = 'none';
    if (this.elements.roulette) this.elements.roulette.style.display = 'block';

    requestAnimationFrame(() => {
      const nb = $('.topbar')?.getBoundingClientRect().bottom || 0;
      document.documentElement.style.setProperty('--dock-h', Math.ceil(nb) + 'px');
    });

    window.scrollTo({ top: 0 });
  }

  static setActiveNav(id) {
    try {
      document
        .querySelectorAll('.nav-center-box li')
        .forEach(li => li.classList.remove('active'));

      if (!id) return;

      const anchor = document.getElementById(id);
      if (anchor && anchor.parentElement) {
        anchor.parentElement.classList.add('active');
      }
    } catch (err) {
      console.warn('UIManager.setActiveNav error:', err);
    }
  }
}

// 👇 QUI SOTTO, DOPO la classe, AGGIUNGI goWatch 👇

UIManager.goWatch = function(seriesId, epNumber = null, seconds = 0) {
  const seriesObj = Catalog.findById(seriesId);
  if (!seriesObj) {
    console.warn('goWatch: serie non trovata:', seriesId);
    return;
  }

  // mostra la view "watch"
  UIManager.showWatch();

  // monta la pagina "watch" (banner, lista episodi, bottone Riprendi ecc.)
  if (window.WatchPage) {
    if (typeof WatchPage.loadSeries === 'function') {
      // versione nuova (se l'hai aggiunta)
      WatchPage.loadSeries(seriesObj);
    } else if (typeof WatchPage.open === 'function') {
      // versione vecchia/originale che hai tu ADESSO
      WatchPage.open(seriesObj, false);
    } else {
      console.warn('WatchPage.loadSeries / open non trovate');
    }
  }

  // se non ho specificato un episodio da guardare, mi fermo qui
  if (epNumber == null) {
    return;
  }

  // altrimenti parto SUBITO col player su quell'episodio
  if (window.Player && typeof Player.play === 'function') {
    Player.play(seriesObj, epNumber);

    const videoEl = document.getElementById('video');

    const trySeek = () => {
      if (videoEl && seconds && seconds > 0) {
        videoEl.currentTime = seconds;
      }
      videoEl?.play?.().catch(() => {});
    };

    if (videoEl && videoEl.readyState >= 2) {
      trySeek();
    } else if (videoEl) {
      videoEl.addEventListener('canplay', trySeek, { once: true });
    }
  } else {
    console.warn('Player.play non definita o Player mancante');
  }
};
