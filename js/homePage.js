// js/homePage.js

class HomePage {
  // render principale
  static async render({ query = '', results = null } = {}) {
    const container = UIManager.elements.homeCarousels;
    const statusEl  = UIManager.elements.searchStatus;

    container.innerHTML = '';

    // --- modalità ricerca ---
    if (query) {
      statusEl.style.display = 'block';
      statusEl.textContent = results?.length
        ? `Risultati per "${query}" — ${results.length}`
        : `Nessun risultato per "${query}"`;

      const row = Carousel.create({
        id: 'row-search',
        title: 'Risultati',
        items: results || [],
        size: 'xl'
      });

      if (row) container.appendChild(row);
      return;
    } else {
      statusEl.style.display = 'none';
      statusEl.textContent = '';
    }

    // --- RIPRENDI (cloud prima, locale se non c'è nulla) ---
    let resumeItems = [];
    try {
      if (Auth.isLoggedIn()) {
        resumeItems = await HomePage.fetchResumeFromBackend();
      }
    } catch (err) {
      console.warn("fetchResumeFromBackend error:", err);
    }

    if (!resumeItems.length) {
      resumeItems = HomePage.fetchResumeFromLocal();
    }

    const rowResume = Carousel.create({
      id: 'row-resume',
      title: 'Riprendi',
      items: resumeItems,
      size: 'xl',
      showProgress: true
    });
    if (rowResume && resumeItems.length) {
      container.appendChild(rowResume);
    }

    // --- DOPPIAGGIO ITA ---
    const itaAnime = CATALOG.filter(s => /\(ITA\)/i.test(s.title));
    const rowITA = Carousel.create({
      id: 'row-ita',
      title: 'Anime doppiati in italiano 🇮🇹',
      items: itaAnime,
      size: 'xl'
    });
    if (rowITA) container.appendChild(rowITA);

    // --- SUB ITA ---
    const subIta = CATALOG.filter(s => /SUB.?ITA/i.test(s.title));
    const rowSub = Carousel.create({
      id: 'row-sub',
      title: 'Anime SUB-ITA',
      items: subIta
    });
    if (rowSub) container.appendChild(rowSub);
  }

  // ==============================================
  // prende dal backend i progressi dell'utente loggato
  // e li traduce in oggetti del CATALOG
  // ==============================================
  static async fetchResumeFromBackend() {
    const data = await API.getProgress();
    // data.progress è tipo:
    // [
    //   { series_id: 'soloLeveling-ita', ep_number: 17, seconds: 4, updated_at: '2025-10-27T17:08:03.255Z' },
    //   { series_id: 'gachiakuta-ita',   ep_number: 3,  seconds: 1, updated_at: '2025-10-27T17:04:30.552Z' }
    // ]

    if (!data || !Array.isArray(data.progress)) return [];

    // ordina per updated_at (più recente prima)
    const sorted = [...data.progress].sort((a, b) => {
      const ta = new Date(b.updated_at || 0).getTime();
      const tb = new Date(a.updated_at || 0).getTime();
      return ta - tb;
    });

    // tieni solo la prima occorrenza di ogni series_id
    const seen = new Set();
    const orderedUniqueSeries = [];
    for (const row of sorted) {
      if (!seen.has(row.series_id)) {
        seen.add(row.series_id);
        orderedUniqueSeries.push(row.series_id);
      }
      if (orderedUniqueSeries.length >= 20) break;
    }

    // mappa series_id -> oggetto vero dal catalogo
    const items = orderedUniqueSeries
      .map(id => SeriesHelper.findById(id))
      .filter(Boolean);

    return items;
  }

  // ==============================================
  // fallback locale se non sei loggato o il backend non ha niente
  // ==============================================
  static fetchResumeFromLocal() {
    // guardiamo i progressi salvati localmente col ProgressManager
    const arr = CATALOG
      .map(series => {
        const p = ProgressManager.load(series.id);
        if (!p || !p.positions) return null;

        // prendi timestamp più recente salvato
        const latestTs = Object.values(p.positions)
          .map(x => x.ts || 0)
          .reduce((a,b)=>Math.max(a,b), 0);

        if (!latestTs) return null;
        return { series, ts: latestTs };
      })
      .filter(Boolean)
      .sort((a,b) => b.ts - a.ts)
      .slice(0,20)
      .map(x => x.series);

    return arr;
  }
}
