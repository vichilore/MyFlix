// js/homePage.js

class HomePage {

  // -------------------------------------------------
  // Render della Home:
  // - se stai cercando (query) mostra solo i risultati
  // - sennò:
  //   1. carosello "Riprendi" (anime + film & serie IPTV)
  //   2. doppiaggio ITA
  //   3. SUB ITA
  // -------------------------------------------------
  static async render({ query = '', results = null } = {}) {
    const carouselsContainer = UIManager.elements.homeCarousels;
    const statusEl           = UIManager.elements.searchStatus;
    let highlight            = null;

    const providerState = HomePage.ensureProviderState();
    HomePage.ensureProviderExplore();

    // pulisco i caroselli SEMPRE
    carouselsContainer.innerHTML = '';

    // ---------- MODALITÀ RICERCA ----------
    if (query) {
      HomePage.toggleProviderSection(false);
      HomePage.renderHero(null);
      statusEl.style.display = 'block';
      statusEl.textContent = (results && results.length)
        ? `Risultati per "${query}" — ${results.length}`
        : `Nessun risultato per "${query}"`;

      const row = Carousel.create({
        id: 'row-search',
        title: 'Risultati',
        items: results || [],
        size: 'xl'
      });

      if (row) carouselsContainer.appendChild(row);
      return; // stop qui, niente resume / categorie
    } else {
      HomePage.toggleProviderSection(true);
      statusEl.style.display = 'none';
      statusEl.textContent = '';
    }

    // ---------- 1. CONTINUA A GUARDARE (carosello unico) ----------

    // 1a) ANIME: dati dettagliati (serie + ep + seconds)
    const resumeData = await HomePage.fetchResumeDataDetailed();

    // Base: le serie anime, marcate come kind: 'anime'
    let resumeItems = resumeData
      .map(entry => HomePage.buildResumeCard(entry?.series, {
        kind: 'anime',
        updatedAt: entry?.updated_at,
        localTs: entry?._tsLocal
      }))
      .filter(Boolean);

    // Fallback se non c'è nulla da backend: solo locale anime
    if (!resumeItems.length) {
      const localSeries = HomePage.fetchResumeFromLocalSeriesOnly();
      resumeItems = localSeries
        .map(entry => HomePage.buildResumeCard(entry?.series || entry, {
          kind: 'anime',
          updatedAt: entry?.updated_at,
          localTs: entry?._tsLocal
        }))
        .filter(Boolean);
    }

    // 1b) IPTV resume: prefer backend (Supabase), fallback to local cache
    try {
      const fromBackend = await HomePage.fetchIptvResumeItems(20);
      if (fromBackend && fromBackend.length) {
        resumeItems = [...resumeItems, ...fromBackend];
      }
    } catch (e) {
      console.warn('IPTV resume via backend failed:', e);
    }

    if (window.IPTVProgress && typeof window.IPTVProgress.getAllResume === 'function') {
      const iptvResume = window.IPTVProgress.getAllResume(20); // array
      if (Array.isArray(iptvResume) && iptvResume.length) {
        const iptvItems = iptvResume
          .map(row => HomePage.buildResumeCard({
            id: row.tmdbId || row.id,
            title: row.title,
            image: row.image,
            lang: 'IT',
            year: row.year || '',
            rating: row.rating || 0,
            kind: row.kind === 'movie' ? 'movie' : 'tv'
          }, {
            kind: row.kind === 'movie' ? 'movie' : 'tv',
            localTs: row.updatedAt
          }))
          .filter(Boolean);
        resumeItems = [...resumeItems, ...iptvItems];
      }
    }

    // de-duplicate by kind+id
    if (resumeItems.length) {
      const deduped = new Map();
      for (const item of resumeItems) {
        const key = (item.kind || '') + ':' + String(item.id);
        const ts = Number(item._resumeSort) || 0;
        const existing = deduped.get(key);
        if (!existing || ts > (Number(existing._resumeSort) || 0)) {
          deduped.set(key, item);
        }
      }
      resumeItems = Array.from(deduped.values())
        .sort((a, b) => (Number(b._resumeSort) || 0) - (Number(a._resumeSort) || 0));
    }

    if (resumeItems.length) {
      highlight = resumeItems[0];
      const rowResume = Carousel.create({
        id: 'row-resume',
        title: 'Riprendi',
        items: resumeItems,
        size: 'xl',
        showProgress: true,
        onClick: (item) => HomePage.navigateToItem(item)
      });

      // 👇 forza il router IPTV anche se l'hash era già lo stesso
      try {
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      } catch (e) {
        console.warn('Impossibile dispatchare hashchange manuale', e);
      }

      if (rowResume) {
        carouselsContainer.appendChild(rowResume);
      }
    }

    // ---------- 2. DOPPIAGGIO ITA ----------
    const itaAnime = CATALOG.filter(s => /\(ITA\)/i.test(s.title));
    if (!highlight && itaAnime.length) {
      highlight = itaAnime[0];
    }
    const rowITA = Carousel.create({
      id: 'row-ita',
      title: 'Anime doppiati in italiano 🇮🇹',
      items: itaAnime,
      size: 'xl'
    });
    if (rowITA) carouselsContainer.appendChild(rowITA);

    // ---------- 3. SUB ITA ----------
    const subIta = CATALOG.filter(s => /SUB.?ITA/i.test(s.title));
    if (!highlight && subIta.length) {
      highlight = subIta[0];
    }
    const rowSub = Carousel.create({
      id: 'row-sub',
      title: 'Anime SUB-ITA',
      items: subIta
    });
    if (rowSub) carouselsContainer.appendChild(rowSub);

    if (!highlight && Array.isArray(CATALOG) && CATALOG.length) {
      const randomIndex = Math.floor(Math.random() * CATALOG.length);
      highlight = CATALOG[randomIndex];
    }

    HomePage.renderHero(highlight);

    HomePage.setProviderType(providerState.current);
  }

  static navigateToItem(item) {
    if (!item) return;

    try {
      if (typeof Catalog !== 'undefined' &&
          Catalog.findById &&
          Catalog.findById(item.id)) {
        UIManager.goWatch(item.id);
        return;
      }
    } catch (e) {
      console.warn('Errore controllo Catalog:', e);
    }

    const kind = (item.kind || item.mediaType || item.type || '').toLowerCase();

    if (kind === 'tv' || kind === 'serie') {
      location.hash = `#/serie/${item.id}`;
      return;
    }

    if (kind === 'movie' || kind === 'film') {
      location.hash = `#/film/${item.id}`;
      return;
    }

    if (item.id && typeof UIManager.goWatch === 'function') {
      UIManager.goWatch(item.id);
      return;
    }

    if (item.id) {
      location.hash = `#/film/${item.id}`;
    }
  }

  static buildResumeCard(source, { kind, updatedAt, localTs } = {}) {
    if (!source) return null;

    const item = { ...source };
    if (kind) {
      item.kind = kind;
    }

    let ts = 0;
    if (updatedAt) {
      const parsed = new Date(updatedAt).getTime();
      if (!Number.isNaN(parsed)) {
        ts = parsed;
      }
    }

    if (!ts && localTs != null) {
      const local = Number(localTs);
      if (!Number.isNaN(local)) {
        ts = local;
      }
    }

    item._resumeSort = ts || 0;
    return item;
  }

  static renderHero(item) {
    const {
      homeHero,
      heroBackground,
      heroTitle,
      heroDescription,
      heroMeta,
      heroTag,
      heroPlay,
      heroMore
    } = UIManager.elements;

    if (!homeHero) return;

    if (!item) {
      homeHero.classList.add('is-collapsed');
      if (heroPlay) heroPlay.onclick = null;
      if (heroMore) heroMore.onclick = null;
      return;
    }

    homeHero.classList.remove('is-collapsed');

    if (heroBackground) {
      if (item.image) {
        heroBackground.style.backgroundImage = `url('${item.image}')`;
        heroBackground.classList.add('has-image');
      } else {
        heroBackground.style.backgroundImage = '';
        heroBackground.classList.remove('has-image');
      }
    }

    if (heroTitle) {
      heroTitle.textContent = item.title || 'In evidenza';
    }

    if (heroTag) {
      const tagText = item.lang ||
        (item.kind === 'movie' ? 'Film' : item.kind === 'tv' ? 'Serie' : 'Consigliato');
      if (tagText) {
        heroTag.textContent = tagText;
        heroTag.classList.remove('is-hidden');
      } else {
        heroTag.classList.add('is-hidden');
      }
    }

    if (heroDescription) {
      const description = item.description || item.overview || item.synopsis || item.subtitle || '';
      if (description) {
        heroDescription.textContent = description;
        heroDescription.classList.remove('is-hidden');
        heroDescription.classList.remove('is-fallback');
      } else {
        heroDescription.textContent = 'Guarda in streaming illimitato su AmiciCari.tv.';
        heroDescription.classList.remove('is-hidden');
        heroDescription.classList.add('is-fallback');
      }
    }

    if (heroMeta) {
      const metaParts = [];
      if (item.year) metaParts.push(item.year);
      if (item.rating) metaParts.push(`★ ${Number(item.rating).toFixed(1)}`);
      if (item.kind && !/(anime)/i.test(item.kind)) {
        metaParts.push(item.kind.toString().toUpperCase());
      }
      const metaText = metaParts.join(' • ');
      if (metaText) {
        heroMeta.textContent = metaText;
        heroMeta.classList.remove('is-hidden');
      } else {
        heroMeta.textContent = '';
        heroMeta.classList.add('is-hidden');
      }
    }

    if (heroPlay) {
      heroPlay.onclick = () => HomePage.navigateToItem(item);
    }

    if (heroMore) {
      heroMore.onclick = () => HomePage.navigateToItem(item);
    }
  }

  static ensureProviderState() {
    if (!this._providerState) {
      this._providerState = {
        current: 'movie',
        initialized: false,
        loaded: { movie: false, tv: false }
      };
    }
    return this._providerState;
  }

  static ensureProviderExplore() {
    const state = this.ensureProviderState();
    if (state.initialized) return;

    const section    = UIManager.elements.providerExploreSection;
    const filterList = UIManager.elements.providerFilterList;
    const parent     = UIManager.elements.providerCarousels;

    if (!section || !filterList || !parent) {
      return;
    }

    if (!filterList.getAttribute('role')) {
      filterList.setAttribute('role', 'tablist');
    }

    const hostIds = { movie: 'provider-host-movie', tv: 'provider-host-tv' };
    const buttons = Array.from(filterList.querySelectorAll('[data-type]'));
    buttons.forEach((btn) => {
      const type = btn.dataset.type === 'tv' ? 'tv' : 'movie';
      btn.dataset.type = type;
      if (!btn.getAttribute('role')) {
        btn.setAttribute('role', 'tab');
      }
      btn.setAttribute('aria-controls', hostIds[type]);
      btn.addEventListener('click', (event) => {
        event.preventDefault();
        HomePage.setProviderType(type);
      });
    });

    const hosts = {
      movie: document.createElement('div'),
      tv: document.createElement('div')
    };

    hosts.movie.className = 'provider-host carousel-stack';
    hosts.movie.dataset.providerType = 'movie';
    hosts.movie.id = hostIds.movie;
    hosts.movie.setAttribute('aria-hidden', 'false');

    hosts.tv.className = 'provider-host carousel-stack';
    hosts.tv.dataset.providerType = 'tv';
    hosts.tv.id = hostIds.tv;
    hosts.tv.setAttribute('aria-hidden', 'true');
    hosts.tv.hidden = true;

    parent.appendChild(hosts.movie);
    parent.appendChild(hosts.tv);

    this._providerHosts = hosts;
    state.initialized = true;
    this.updateProviderButtons(state.current);
  }

  static updateProviderButtons(activeType) {
    const filterList = UIManager.elements.providerFilterList;
    if (!filterList) return;

    filterList.querySelectorAll('[data-type]').forEach((btn) => {
      const isActive = btn.dataset.type === activeType;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      btn.setAttribute('tabindex', isActive ? '0' : '-1');
    });
  }

  static showProviderHost(type) {
    const hosts = this._providerHosts || {};
    Object.keys(hosts).forEach((key) => {
      const host = hosts[key];
      if (!host) return;
      const isActive = key === type;
      host.hidden = !isActive;
      host.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });
  }

  static setProviderType(type) {
    const state = this.ensureProviderState();
    const normalized = type === 'tv' ? 'tv' : 'movie';
    state.current = normalized;
    this.updateProviderButtons(normalized);
    this.renderProviders(normalized);
  }

  static renderProviders(type) {
    if (!window.ProviderCarousels || typeof ProviderCarousels.renderGroup !== 'function') {
      return;
    }

    const state = this.ensureProviderState();
    const hosts = this._providerHosts || {};
    const host = hosts[type];
    if (!host) return;

    this.showProviderHost(type);

    if (state.loaded[type] && host.children.length) {
      return;
    }

    host.dataset.state = 'loading';

    ProviderCarousels.renderGroup(type, host, {
      fallbackRoute: type === 'tv' ? 'serie' : 'film'
    }).then(() => {
      const hasRows = host.querySelector('.row');
      if (hasRows) {
        host.dataset.state = 'ready';
        state.loaded[type] = true;
        return;
      }

      host.dataset.state = 'empty';
      host.innerHTML = '';
      if (window.Carousel && typeof Carousel.createStateRow === 'function') {
        host.appendChild(
          Carousel.createStateRow({
            id: `providers-${type}-empty`,
            title: '',
            message: 'Nessun contenuto disponibile al momento.'
          })
        );
      }
      state.loaded[type] = true;
    }).catch((error) => {
      console.warn('HomePage provider render failed:', error);
      host.dataset.state = 'error';
      host.innerHTML = '';
      if (window.Carousel && typeof Carousel.createStateRow === 'function') {
        host.appendChild(
          Carousel.createStateRow({
            id: `providers-${type}-error`,
            title: '',
            message: 'Impossibile caricare i contenuti. Riprova più tardi.'
          })
        );
      }
      state.loaded[type] = false;
    });
  }

  static toggleProviderSection(show) {
    const section = UIManager.elements.providerExploreSection;
    if (!section) return;
    section.setAttribute('aria-hidden', show ? 'false' : 'true');
  }

  // -------------------------------------------------
  // Sync cloud → local per ANIME
  // -------------------------------------------------
  static syncCloudIntoLocal(progressRows) {
    if (!Array.isArray(progressRows)) return;

    const DEFAULT_DURATION = 24 * 60; // 24 minuti

    for (const row of progressRows) {
      const seriesId = row.series_id;
      const ep       = row.ep_number;
      const seconds  = row.seconds || 0;

      ProgressManager.setLastEpisode(seriesId, ep);
      ProgressManager.setPosition(seriesId, ep, seconds, DEFAULT_DURATION);
    }
  }

  // -------------------------------------------------
  // fetchResumeDataDetailed()
  // Anime: cloud → fallback locale
  // -------------------------------------------------
  static async fetchResumeDataDetailed() {
    if (Auth.isLoggedIn()) {
      try {
        const data = await API.getProgress();
        if (data && Array.isArray(data.progress) && data.progress.length) {

          HomePage.syncCloudIntoLocal(data.progress);

          const sorted = [...data.progress].sort((a, b) => {
            const ta = new Date(a.updated_at || 0).getTime();
            const tb = new Date(b.updated_at || 0).getTime();
            return tb - ta;
          });

          const bestPerSeries = new Map();
          for (const row of sorted) {
            if (!bestPerSeries.has(row.series_id)) {
              bestPerSeries.set(row.series_id, row);
            }
            if (bestPerSeries.size >= 20) break;
          }

          const detailed = [];
          for (const row of bestPerSeries.values()) {
            const seriesObj = Catalog.findById(row.series_id);
            if (!seriesObj) continue;
            detailed.push({
              series: seriesObj,
              ep: row.ep_number,
              seconds: row.seconds || 0,
              updated_at: row.updated_at || null
            });
          }

          return detailed;
        }
      } catch (err) {
        console.warn("fetchResumeDataDetailed backend fail:", err);
      }
    }
    

    // fallback locale (non loggato o nessun dato)
    return HomePage.fetchResumeDataFromLocal();
  }
  // -------------------------------------------------
  // fetchIptvResumeItems(limit)
  // Prefer Supabase backend; returns mapped items for carousel
  // -------------------------------------------------
  static async fetchIptvResumeItems(limit = 20) {
    if (!Auth.isLoggedIn || !Auth.isLoggedIn()) return [];
    if (!window.API || typeof API.getIptvResume !== 'function') return [];

    try {
      const res = await API.getIptvResume(limit);
      const rows = Array.isArray(res?.items) ? res.items : [];
      if (!rows.length) return [];

      const tasks = rows.map(async (row) => {
        const id = String(row.provider_video_id || '').trim();
        if (!id) return null;

        const details = await HomePage.loadIptvDetailsById(id).catch(() => null);
        if (!details) return null;

        return HomePage.buildResumeCard({
          id: details.id,
          title: details.title,
          image: details.poster || details.image || details.backdrop || '',
          lang: 'IT',
          year: details.year || '',
          rating: details.rating || 0,
          kind: details.kind === 'tv' ? 'tv' : 'movie'
        }, {
          kind: details.kind === 'tv' ? 'tv' : 'movie',
          updatedAt: row.updated_at
        });
      });

      const settled = await Promise.allSettled(tasks);
      return settled
        .map(x => (x.status === 'fulfilled' ? x.value : null))
        .filter(Boolean);
    } catch (e) {
      console.warn('fetchIptvResumeItems error:', e);
      return [];
    }
  }

  // Try TMDB movie first, then tv; return normalized info
  static async loadIptvDetailsById(id) {
    if (!window.IPTV) return null;
    try {
      if (typeof IPTV.getMovieById === 'function') {
        const m = await IPTV.getMovieById(id);
        if (m && m.id != null) return { ...m, kind: 'movie' };
      }
    } catch {}
    try {
      if (typeof IPTV.getSerieById === 'function') {
        const s = await IPTV.getSerieById(id);
        if (s && s.id != null) return { ...s, kind: 'tv' };
      }
    } catch {}
    return null;
  }
  // -------------------------------------------------
  // fetchResumeDataFromLocal()
  // SOLO anime, come prima (sincrono)
  // -------------------------------------------------
  static fetchResumeDataFromLocal() {
    const collected = [];

    for (const series of CATALOG) {
      const state = ProgressManager.load(series.id);
      if (!state || !state.positions) continue;

      let best = null;
      for (const [epStr, info] of Object.entries(state.positions)) {
        const ts = info.ts || 0;
        if (!best || ts > best.ts) {
          best = {
            ep: parseInt(epStr, 10),
            seconds: info.t || 0,
            ts
          };
        }
      }
      if (!best) continue;

      collected.push({
        series,
        ep: best.ep,
        seconds: best.seconds,
        updated_at: null,
        _tsLocal: best.ts
      });
    }

    collected.sort((a, b) => (b._tsLocal || 0) - (a._tsLocal || 0));
    return collected.slice(0, 20);
  }

  // -------------------------------------------------
  // fetchResumeFromLocalSeriesOnly()
  // (solo le serie anime, per eventuale fallback)
  // -------------------------------------------------
  static fetchResumeFromLocalSeriesOnly() {
    const data = HomePage.fetchResumeDataFromLocal();
    return data.map(x => ({
      series: x.series,
      updated_at: x.updated_at || null,
      _tsLocal: x._tsLocal
    }));
  }

  // -------------------------------------------------
  // formatMinutes(seconds)
  // -------------------------------------------------
  static formatMinutes(totalSeconds) {
    const mins = Math.floor((totalSeconds || 0) / 60);
    if (mins <= 0) return "al minuto 0";
    if (mins === 1) return "al minuto 1";
    return `al minuto ${mins}`;
  }
}



