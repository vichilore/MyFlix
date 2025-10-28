// js/homePage.js

class HomePage {

  // -------------------------------------------------
  // Render della Home:
  // - se stai cercando (query) mostra solo i risultati
  // - sennò:
  //   1. mostra "Continua a guardare" con episodio/minuto
  //   2. poi i caroselli classici
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

    // ---------- 1. CONTINUA A GUARDARE ----------
    // qui vogliamo episodi e timestamp precisi
    const resumeData = await HomePage.fetchResumeDataDetailed();
    HomePage.renderResumeSection(resumeData);

    // ---------- 2. CAROSELLO "RIPRENDI" CLASSICO ----------
    // (opzionale: lo puoi anche tenere o togliere,
    //  questo è quello che avevi prima che mostrava solo la serie)
    let resumeItemsForCarousel = resumeData.map(x => x.series);
    // se è vuoto o se vuoi fallback locale per estetica
    if (!resumeItemsForCarousel.length) {
      resumeItemsForCarousel = HomePage.fetchResumeFromLocalSeriesOnly();
    }

    if (resumeItemsForCarousel.length) {
      const rowResume = Carousel.create({
        id: 'row-resume',
        title: 'Riprendi',
        items: resumeItemsForCarousel,
        size: 'xl',
        showProgress: true
      });
      if (rowResume) {
        carouselsContainer.appendChild(rowResume);
      }
    }

    // ---------- 3. DOPPIAGGIO ITA ----------
    const itaAnime = CATALOG.filter(s => /\(ITA\)/i.test(s.title));
    const rowITA = Carousel.create({
      id: 'row-ita',
      title: 'Anime doppiati in italiano 🇮🇹',
      items: itaAnime,
      size: 'xl'
    });
    if (rowITA) carouselsContainer.appendChild(rowITA);

    // ---------- 4. SUB ITA ----------
    const subIta = CATALOG.filter(s => /SUB.?ITA/i.test(s.title));
    const rowSub = Carousel.create({
      id: 'row-sub',
      title: 'Anime SUB-ITA',
      items: subIta
    });
    if (rowSub) carouselsContainer.appendChild(rowSub);
  }


  // -------------------------------------------------
  // fetchResumeDataDetailed()
  // Ritorna array di oggetti tipo:
  // [
  //   {
  //     series: { ...voce catalog... },
  //     ep: 17,
  //     seconds: 532,
  //     updated_at: '2025-10-27T17:08:03.255Z'
  //   },
  //   ...
  // ]
  //
  // Ordina per updated_at e tiene max 20 serie distinte.
  // Se sei loggato → prende dal backend.
  // Se non sei loggato o backend vuoto → fallback locale.
  // -------------------------------------------------

static syncCloudIntoLocal(progressRows) {
  if (!Array.isArray(progressRows)) return;

  // durata "finta" stimata per calcolare la percentuale e per far apparire il resume button
  const DEFAULT_DURATION = 24 * 60; // 24 minuti = 1440 secondi

  for (const row of progressRows) {
    const seriesId = row.series_id;
    const ep       = row.ep_number;
    const seconds  = row.seconds || 0;

    // Salviamo qual è stato l'ultimo episodio aperto
    ProgressManager.setLastEpisode(seriesId, ep);

    // Salviamo anche la posizione locale
    // t = dove sei arrivato
    // d = durata stimata
    // questo serve sia per la progress bar del carosello
    // sia per WatchPage.updateResumeButton() su altri device
    ProgressManager.setPosition(seriesId, ep, seconds, DEFAULT_DURATION);
  }
}

  static async fetchResumeDataDetailed() {
  if (Auth.isLoggedIn()) {
    try {
      const data = await API.getProgress();
      if (data && Array.isArray(data.progress) && data.progress.length) {

        // 1. sync cloud -> localStorage
        HomePage.syncCloudIntoLocal(data.progress);

        // 2. ordina per updated_at desc
        const sorted = [...data.progress].sort((a, b) => {
          const ta = new Date(a.updated_at || 0).getTime();
          const tb = new Date(b.updated_at || 0).getTime();
          return tb - ta;
        });

        // 3. tieni solo la voce più recente per ogni series_id
        const bestPerSeries = new Map();
        for (const row of sorted) {
          if (!bestPerSeries.has(row.series_id)) {
            bestPerSeries.set(row.series_id, row);
          }
          if (bestPerSeries.size >= 20) break;
        }

        // 4. costruisci oggetti dettagliati {series, ep, seconds, updated_at}
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
  // fetchResumeDataFromLocal()
  // versione offline/locale della stessa cosa:
  // cerchiamo nella roba del ProgressManager
  // e costruiamo oggetti { series, ep, seconds, updated_at:null }
  // -------------------------------------------------
  static fetchResumeDataFromLocal() {
    // Scorri tutte le serie e guarda quello che hai salvato localmente
    const collected = [];

    for (const series of CATALOG) {
      const state = ProgressManager.load(series.id);
      if (!state || !state.positions) continue;

      // individua l'episodio più "recente" in base a ts
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

    // ordina per timestamp locale desc
    collected.sort((a, b) => (b._tsLocal || 0) - (a._tsLocal || 0));

    // taglia a 20
    return collected.slice(0, 20);
  }


  // -------------------------------------------------
  // fetchResumeFromLocalSeriesOnly()
  // (solo le serie, per il vecchio carosello "Riprendi")
  // -------------------------------------------------
  static fetchResumeFromLocalSeriesOnly() {
    const data = HomePage.fetchResumeDataFromLocal();
    return data.map(x => x.series);
  }


  // -------------------------------------------------
  // renderResumeSection(resumeData)
  // Prende l'array di oggetti dettagliati (series + ep + seconds)
  // e costruisce la sezione #homeResume con le card,
  // ognuna con bottone "Riprendi".
  // Se non c'è niente, nasconde #homeResume.
  // -------------------------------------------------
  static renderResumeSection(resumeData) {
    const container = document.querySelector("#homeResume");
    if (!container) return;

    container.innerHTML = "";

    if (!resumeData.length) {
      container.style.display = "none";
      return;
    }

    container.style.display = "";

    // titolo sezione
    const titleEl = document.createElement("div");
    titleEl.className = "resumeSectionTitle";
    titleEl.textContent = "Continua a guardare";
    container.appendChild(titleEl);

    // lista scrollabile
    const listEl = document.createElement("div");
    listEl.className = "resumeList";
    container.appendChild(listEl);

    // una card per ciascuna serie
    resumeData.forEach(item => {
      const { series, ep, seconds } = item;

      const mins = HomePage.formatMinutes(seconds);

      const card = document.createElement("div");
      card.className = "resumeCard";

      // Poster
      const poster = document.createElement("div");
      poster.className = "resumePoster";
      if (series.image) {
        poster.style.backgroundImage = `url('${series.image}')`;
      }
      card.appendChild(poster);

      // Info testo
      const infoWrap = document.createElement("div");
      infoWrap.className = "resumeInfo";

      const t = document.createElement("div");
      t.className = "resumeTitle";
      t.textContent = series.title;
      infoWrap.appendChild(t);

      const meta = document.createElement("div");
      meta.className = "resumeMeta";
      meta.textContent = `Ep ${ep} · ${mins}`;
      infoWrap.appendChild(meta);

      // Bottone "Riprendi"
      const btn = document.createElement("button");
      btn.className = "resumePlayBtn";
      btn.textContent = "Riprendi";
      btn.addEventListener("click", () => {
        // Navigazione verso la pagina watch
        // Dovresti avere una funzione tipo UIManager.goWatch(series.id, ep, seconds)
        // che:
        //   - apre la pagina WatchPage della serie giusta
        //   - chiama Player.play(seriesObj, ep)
        //   - quando il video è pronto -> video.currentTime = seconds;
        UIManager.goWatch(series.id, ep, seconds);
      });
      infoWrap.appendChild(btn);

      card.appendChild(infoWrap);
      listEl.appendChild(card);
    });
  }


  // -------------------------------------------------
  // formatMinutes(seconds)
  // piccoli testi tipo "al minuto 12"
  // -------------------------------------------------
  static formatMinutes(totalSeconds) {
    const mins = Math.floor((totalSeconds || 0) / 60);
    if (mins <= 0) return "al minuto 0";
    if (mins === 1) return "al minuto 1";
    return `al minuto ${mins}`;
  }

}
