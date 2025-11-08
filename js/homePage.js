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

    // pulisco i caroselli SEMPRE
    carouselsContainer.innerHTML = '';

    // ---------- MODALITÀ RICERCA ----------
    if (query) {
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
      statusEl.style.display = 'none';
      statusEl.textContent = '';
    }

    // ---------- 1. CONTINUA A GUARDARE (carosello unico) ----------

    // 1a) ANIME: dati dettagliati (serie + ep + seconds)
    const resumeData = await HomePage.fetchResumeDataDetailed();

    // Base: le serie anime, marcate come kind: 'anime'
    let resumeItems = resumeData.map(x => ({
      ...x.series,
      kind: 'anime'
    }));

    // Fallback se non c'è nulla da backend: solo locale anime
    if (!resumeItems.length) {
      const localSeries = HomePage.fetchResumeFromLocalSeriesOnly();
      resumeItems = localSeries.map(s => ({
        ...s,
        kind: 'anime'
      }));
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
        const iptvItems = iptvResume.map(row => ({
          id: row.tmdbId || row.id,
          title: row.title,
          image: row.image,
          lang: 'IT',
          year: row.year || '',
          rating: row.rating || 0,
          kind: row.kind === 'movie' ? 'movie' : 'tv'
        }));
        resumeItems = [...resumeItems, ...iptvItems];
      }
    }

    // de-duplicate by kind+id
    if (resumeItems.length) {
      const seen = new Set();
      resumeItems = resumeItems.filter(it => {
        const k = (it.kind||'') + ':' + String(it.id);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    }

    if (resumeItems.length) {
      const rowResume = Carousel.create({
        id: 'row-resume',
        title: 'Riprendi',
        items: resumeItems,
        size: 'xl',
        showProgress: true,
        onClick: (item) => {
          console.log('[Riprendi click]', item);

          // 1) Se è un ANIME (esiste nel CATALOG) → vai alla pagina watch classica
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

          // 2) IPTV (film / serie)
          const kind = (item.kind || item.mediaType || item.type || '').toLowerCase();

          if (kind === 'tv' || kind === 'serie') {
            // Serie TV IPTV
            location.hash = `#/serie/${item.id}`;
          } else if (kind === 'movie' || kind === 'film') {
            // Film IPTV
            location.hash = `#/film/${item.id}`;
          } else {
            // fallback: trattalo come film
            location.hash = `#/film/${item.id}`;
          }
        }
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
    const rowITA = Carousel.create({
      id: 'row-ita',
      title: 'Anime doppiati in italiano 🇮🇹',
      items: itaAnime,
      size: 'xl'
    });
    if (rowITA) carouselsContainer.appendChild(rowITA);

    // ---------- 3. SUB ITA ----------
    const subIta = CATALOG.filter(s => /SUB.?ITA/i.test(s.title));
    const rowSub = Carousel.create({
      id: 'row-sub',
      title: 'Anime SUB-ITA',
      items: subIta
    });
    if (rowSub) carouselsContainer.appendChild(rowSub);
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

        return {
          id: details.id,
          title: details.title,
          image: details.poster || details.image || details.backdrop || '',
          lang: 'IT',
          year: details.year || '',
          rating: details.rating || 0,
          kind: details.kind === 'tv' ? 'tv' : 'movie'
        };
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
    return data.map(x => x.series);
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



