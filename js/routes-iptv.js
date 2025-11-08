// js/routes-iptv.js
// - #/film         => pagina lista film (carosello XL stile anime)
// - #/film/:id     => pagina player film (iframe vixsrc)
// - #/serie        => pagina lista serie
// - #/serie/:id    => pagina player serie

(function () {
  let iptvRoot = null;
  let catalogCache = null; // { movies: [...], series: [...] }

  window.IPTV_PREVIOUS_POSITION_T = 0;
  const VIX_PRIMARY_COLOR = 'B20710';
  const VIX_SECONDARY_COLOR = '170000';
  const VIX_LANG = 'it';

  function ensureRoot() {
    if (!iptvRoot) {
      iptvRoot = document.createElement('section');
      iptvRoot.id = 'iptv-root';
      iptvRoot.className = 'iptv-page';
    }
    return iptvRoot;
  }

  async function getCatalog() {
    if (catalogCache) return catalogCache;
    if (!window.IPTV || !window.IPTV.getItalianCatalog) {
      throw new Error('window.IPTV.getItalianCatalog non disponibile');
    }
    catalogCache = await window.IPTV.getItalianCatalog();
    return catalogCache;
  }

  // Restituisce l'URL base tipo "https://vixsrc.to/movie/786892/"
  function getVixMovieBaseUrl(item) {
    const raw = item?.url || '';
    if (!raw) return '';

    try {
      const u = new URL(raw);
      const path = u.pathname.endsWith('/') ? u.pathname : u.pathname + '/';
      return u.origin + path; // es: https://vixsrc.to/movie/786892/
    } catch {
      const noQuery = raw.split('?')[0];
      return noQuery.endsWith('/') ? noQuery : noQuery + '/';
    }
  }

  function setActiveNav(id) {
    try {
      document
        .querySelectorAll('.nav-center-box li')
        .forEach(li => li.classList.remove('active'));

      if (id) {
        const el = document.getElementById(id);
        if (el && el.parentElement) el.parentElement.classList.add('active');
      }
    } catch {}
  }

  function forceShowNav() {
    const nav = document.querySelector('.nav-center-box');
    if (!nav) return;
    let el = nav;
    while (el) {
      if (el.style) {
        el.style.display = '';
        el.style.visibility = '';
      }
      el = el.parentElement;
    }
  }

  // Mostra solo la pagina IPTV come overlay, lasciando intatta la home
  function showIptvPage() {
    const root = ensureRoot();

    if (root.parentElement !== document.body) {
      document.body.appendChild(root);
    }

    root.style.display = 'block';
    forceShowNav();
  }

  function hideIptvPage() {
    if (iptvRoot && iptvRoot.parentElement) {
      iptvRoot.parentElement.removeChild(iptvRoot);
    }
    iptvRoot = null;
    setActiveNav(null);
  }

  // ---------- MAPPERS: Film / Serie → card carousel ----------

  function mapMovieToCard(m) {
    return {
      id: m.id,
      title: m.title || m.name || 'Senza titolo',
      image: m.poster || m.backdrop || '',
      lang: 'IT',
      year: m.year || (m.release_date ? String(m.release_date).slice(0, 4) : ''),
      rating: m.rating || m.vote_average || 0,
    };
  }

  function mapSerieToCard(s) {
    return {
      id: s.id,
      title: s.title || s.name || 'Senza titolo',
      image: s.poster || s.backdrop || '',
      lang: 'IT',
      year: s.year || (s.first_air_date ? String(s.first_air_date).slice(0, 4) : ''),
      rating: s.rating || s.vote_average || 0,
    };
  }

  // carousels da provider esterni (se presenti)
  function appendProviderCarousels(host, type) {
    if (!host || !window.ProviderCarousels ||
        typeof window.ProviderCarousels.renderGroup !== 'function') {
      return;
    }

    const section = document.createElement('div');
    section.className = 'iptv-provider-section';
    host.appendChild(section);

    const fallbackRoute = type === 'tv' ? 'serie' : 'film';

    window.ProviderCarousels.renderGroup(type, section, {
      hostClass: 'iptv-provider-row',
      fallbackRoute
    });
  }

  // ---------- LISTA FILM ----------

  async function renderFilmList() {
    showIptvPage();
    setActiveNav('nav-film');

    const root = ensureRoot();
    root.innerHTML = `
      <div class="container iptv-container">
        <h1 class="iptv-page-title">Film Italia</h1>

        <div class="iptv-search-bar">
          <input
            id="iptv-film-search"
            class="iptv-search-input"
            type="text"
            placeholder="Cerca un film…"
          />
        </div>

        <div class="iptv-rows">
          <div class="iptv-recommended" id="iptv-film-recommended-host"></div>
          <div class="iptv-provider-section" id="iptv-film-provider-host"></div>
        </div>
      </div>
    `;

    const recommendedHost = root.querySelector('#iptv-film-recommended-host');
    const providerHost    = root.querySelector('#iptv-film-provider-host');
    const searchInput     = root.querySelector('#iptv-film-search');

    const loading = document.createElement('div');
    loading.className = 'iptv-loading';
    loading.textContent = 'Caricamento consigliati…';
    recommendedHost.appendChild(loading);

    let recommendedItems = [];
    let providersVisible = false;

    function ensureProviders() {
      if (!providerHost) return;
      providerHost.style.display = '';
      if (!providersVisible) {
        appendProviderCarousels(providerHost, 'movie');
        providersVisible = true;
      }
    }

    function renderHome() {
      if (!recommendedHost) return;

      recommendedHost.innerHTML = '';

      if (!recommendedItems.length) {
        recommendedHost.innerHTML = `<p class="iptv-empty">Nessun film consigliato trovato.</p>`;
      } else {
        const rowRec = window.Carousel.create({
          id: 'iptv-film-recommended',
          title: 'Consigliati per te',
          items: recommendedItems,
          size: 'xl',
          showProgress: false,
          onClick: (item) => {
            location.hash = `#/film/${item.id}`;
          }
        });
        if (rowRec) {
          recommendedHost.appendChild(rowRec);
        }
      }

      ensureProviders();
    }

    function renderSearchResults(list) {
      if (!recommendedHost) return;

      recommendedHost.innerHTML = '';

      // in ricerca nascondo la parte provider
      if (providerHost) {
        providerHost.style.display = 'none';
      }

      if (!list.length) {
        recommendedHost.innerHTML = `<p class="iptv-empty">Nessun film trovato per questa ricerca.</p>`;
        return;
      }

      const rowSearch = window.Carousel.create({
        id: 'iptv-film-search-results',
        title: 'Risultati della ricerca',
        items: list,
        size: 'xl',
        showProgress: false,
        onClick: (item) => {
          location.hash = `#/film/${item.id}`;
        }
      });
      recommendedHost.appendChild(rowSearch);
    }

    try {
      if (!window.IPTV || !window.IPTV.loadRecommendedMovies || !window.IPTV.searchMovies) {
        throw new Error('Funzioni IPTV recommended/search non disponibili');
      }

      const recommended = await window.IPTV.loadRecommendedMovies(2);
      recommendedHost.innerHTML = '';

      recommendedItems = (recommended || []).map(mapMovieToCard);

      renderHome();

      let lastSearchId = 0;

      if (searchInput) {
        searchInput.addEventListener('input', () => {
          const q = searchInput.value.trim();
          lastSearchId++;
          const searchId = lastSearchId;

          if (!q) {
            // reset → torno a home + provider
            renderHome();
            return;
          }

          recommendedHost.innerHTML = `
            <div class="iptv-loading">Ricerca in corso…</div>
          `;

          window.IPTV.searchMovies(q, 1)
            .then(movies => {
              if (searchId !== lastSearchId) return;
              const results = (movies || []).map(mapMovieToCard);
              renderSearchResults(results);
            })
            .catch(err => {
              console.error('[IPTV] errore search TMDB', err);
              if (searchId !== lastSearchId) return;

              recommendedHost.innerHTML = `
                <p class="iptv-empty">Errore durante la ricerca.</p>
              `;
            });
        });
      }

      // se tutto ok e non in modalità ricerca, mostro sempre provider
      ensureProviders();
    } catch (e) {
      console.error('[IPTV] errore lista Film', e);
      if (recommendedHost) {
        recommendedHost.innerHTML = `<p class="iptv-empty">Errore nel caricamento dei Film.</p>`;
      }
      // anche in errore, provo a mostrare comunque i provider
      if (providerHost) {
        appendProviderCarousels(providerHost, 'movie');
        providersVisible = true;
      }
    }
  }

  // ---------- LISTA SERIE ----------

  async function renderSerieList() {
    showIptvPage();
    setActiveNav('nav-serie');

    const root = ensureRoot();
    root.innerHTML = `
      <div class="container iptv-container">
        <h1 class="iptv-page-title">Serie TV Italia</h1>

        <div class="iptv-search-bar">
          <input
            id="iptv-serie-search"
            class="iptv-search-input"
            type="text"
            placeholder="Cerca una serie…"
          />
        </div>

        <div class="iptv-rows">
          <div class="iptv-recommended" id="iptv-serie-recommended-host"></div>
          <div class="iptv-provider-section" id="iptv-serie-provider-host"></div>
        </div>
      </div>
    `;

    const recommendedHost = root.querySelector('#iptv-serie-recommended-host');
    const providerHost    = root.querySelector('#iptv-serie-provider-host');
    const searchInput     = root.querySelector('#iptv-serie-search');

    const loading = document.createElement('div');
    loading.className = 'iptv-loading';
    loading.textContent = 'Caricamento serie consigliate…';
    recommendedHost.appendChild(loading);

    let recommendedItems = [];
    let providersVisible = false;

    function ensureProviders() {
      if (!providerHost) return;
      providerHost.style.display = '';
      if (!providersVisible) {
        appendProviderCarousels(providerHost, 'tv');
        providersVisible = true;
      }
    }

    function renderHome() {
      if (!recommendedHost) return;

      recommendedHost.innerHTML = '';

      if (!recommendedItems.length) {
        recommendedHost.innerHTML = `<p class="iptv-empty">Nessuna serie consigliata trovata.</p>`;
      } else {
        const rowRec = window.Carousel.create({
          id: 'iptv-serie-recommended',
          title: 'Serie consigliate per te',
          items: recommendedItems,
          size: 'xl',
          showProgress: false,
          onClick: (item) => {
            location.hash = `#/serie/${item.id}`;
          }
        });
        if (rowRec) {
          recommendedHost.appendChild(rowRec);
        }
      }

      ensureProviders();
    }

    function renderSearchResults(list) {
      if (!recommendedHost) return;

      recommendedHost.innerHTML = '';

      if (providerHost) {
        providerHost.style.display = 'none';
      }

      if (!list.length) {
        recommendedHost.innerHTML = `<p class="iptv-empty">Nessuna serie trovata per questa ricerca.</p>`;
        return;
      }

      const rowSearch = window.Carousel.create({
        id: 'iptv-serie-search-results',
        title: 'Risultati della ricerca',
        items: list,
        size: 'xl',
        showProgress: false,
        onClick: (item) => {
          location.hash = `#/serie/${item.id}`;
        }
      });
      recommendedHost.appendChild(rowSearch);
    }

    try {
      if (!window.IPTV ||
          !window.IPTV.loadRecommendedSeries ||
          !window.IPTV.searchSeries) {
        throw new Error('Funzioni IPTV serie recommended/search non disponibili');
      }

      const recommended = await window.IPTV.loadRecommendedSeries(2);
      recommendedHost.innerHTML = '';

      recommendedItems = (recommended || []).map(mapSerieToCard);

      renderHome();

      let lastSearchId = 0;

      if (searchInput) {
        searchInput.addEventListener('input', () => {
          const q = searchInput.value.trim();
          lastSearchId++;
          const searchId = lastSearchId;

          if (!q) {
            renderHome();
            return;
          }

          recommendedHost.innerHTML = `
            <div class="iptv-loading">Ricerca serie in corso…</div>
          `;

          window.IPTV.searchSeries(q, 1)
            .then(series => {
              if (searchId !== lastSearchId) return;
              const results = (series || []).map(mapSerieToCard);
              renderSearchResults(results);
            })
            .catch(err => {
              console.error('[IPTV] errore search serie TMDB', err);
              if (searchId !== lastSearchId) return;

              recommendedHost.innerHTML = `
                <p class="iptv-empty">Errore durante la ricerca.</p>
              `;
            });
        });
      }

      ensureProviders();
    } catch (e) {
      console.error('[IPTV] errore lista Serie', e);
      if (recommendedHost) {
        recommendedHost.innerHTML = `<p class="iptv-empty">Errore nel caricamento delle Serie TV.</p>`;
      }
      if (providerHost) {
        appendProviderCarousels(providerHost, 'tv');
        providersVisible = true;
      }
    }
  }

  // ---- Bridge postMessage events from vixsrc iframe ----

  const lastSentByVideo = new Map();
  const lastKnownTimeByVideo = new Map(); // cache dell'ultimo (currentTime, duration) per video
  let iptvBridgeAttached = false;

  function shouldSendTimeupdate(videoId) {
    const key = videoId + '|timeupdate';
    const now = Date.now();
    const last = lastSentByVideo.get(key) || 0;
    const minGap = 1000; // 1 secondo
    if (now - last < minGap) return false;
    lastSentByVideo.set(key, now);
    return true;
  }

  function attachIptvEventBridgeOnce() {
    if (iptvBridgeAttached) return;
    iptvBridgeAttached = true;

    window.addEventListener('message', (e) => {
      let raw = e.data;
      let msg = raw;

      // Se è STRINGA JSON (caso VixSrc) → parse
      if (typeof raw === 'string') {
        try {
          msg = JSON.parse(raw);
        } catch {
          return;
        }
      }

      // Aspettato:
      // { type: 'PLAYER_EVENT', data: { event, currentTime?, duration?, video_id, ... } }
      if (!msg || msg.type !== 'PLAYER_EVENT' || !msg.data) {
        return;
      }

      const inner = msg.data || {};
      const evName = String(inner.event || '');
      const vixVideoId = inner.video_id != null ? String(inner.video_id) : '';

      // ID logico TMDB che usiamo per backend e posizione
      const logicalId = (typeof window.IPTV_CURRENT_MEDIA_ID === 'string' &&
                         window.IPTV_CURRENT_MEDIA_ID)
        ? window.IPTV_CURRENT_MEDIA_ID
        : vixVideoId; // fallback

      if (!logicalId) {
        return;
      }

      let currentTime = Number(inner.currentTime);
      let duration    = Number(inner.duration);
      let hasTime     = Number.isFinite(currentTime) && Number.isFinite(duration);

      // se l'evento ha tempo valido, aggiorniamo la cache locale
      if (hasTime) {
        lastKnownTimeByVideo.set(logicalId, { currentTime, duration });
      } else {
        // es. 'pause' di VixSrc → niente currentTime/duration
        const last = lastKnownTimeByVideo.get(logicalId);
        if (last) {
          currentTime = last.currentTime;
          duration    = last.duration;
          hasTime = true;
        }
      }

      // Se NON abbiamo una coppia tempo/durata valida → NON mandiamo nulla al backend
      if (!hasTime) {
        return;
      }

      // Evita di sovrascrivere una posizione esistente >5s con un evento iniziale a 0s
      const prevT = (typeof window.IPTV_PREVIOUS_POSITION_T === 'number')
        ? window.IPTV_PREVIOUS_POSITION_T
        : null;

      if (
        prevT && prevT > 5 &&
        currentTime <= 1 &&                // siamo praticamente a 0
        (evName === 'play' ||
         evName === 'pause' ||
         evName === 'timeupdate')
      ) {
        // Primo evento auto-play dopo hard refresh → non toccare il DB
        return;
      }

      // ---------- BACKEND ----------

      const apiRef = (typeof API !== 'undefined')
        ? API
        : (typeof window !== 'undefined' ? window.API : null);

      if (!apiRef || typeof apiRef.saveIptvEvent !== 'function') {
        return;
      }

      try {
        const isTimeupdate = evName === 'timeupdate';
        const isImportant  =
          evName === 'pause' || evName === 'ended' || evName === 'seeked';

        // normalizziamo i valori da mandare
        const tSend = Math.max(0, Number(currentTime) || 0);
        const dSend = Math.max(0, Number(duration) || 0);

        if (!Number.isFinite(tSend) || !Number.isFinite(dSend)) {
          return;
        }

        // timeupdate → throttling per video; eventi importanti sempre
        if (!isTimeupdate || shouldSendTimeupdate(logicalId) || isImportant) {
          const payloadForBackend = {
            type: 'PLAYER_EVENT',
            data: {
              event: evName,
              currentTime: tSend,
              duration:   dSend,
              video_id: logicalId,                      // TMDB id logico
              media_type: window.IPTV_CURRENT_MEDIA_TYPE || null,
              season: window.IPTV_CURRENT_SEASON ?? null,
              episode: window.IPTV_CURRENT_EPISODE ?? null
            }
          };

          apiRef.saveIptvEvent(payloadForBackend)
            .catch(() => {
              // errori silenziati, evitiamo rumore
            });
        }
      } catch {
        // silenzioso
      }
    });
  }

  // ---------- PLAYER PAGE (hero + iframe) ----------

  async function renderPlayerPage({ type, item }) {
    showIptvPage();
    setActiveNav(type === 'film' ? 'nav-film' : 'nav-serie');

    const root = ensureRoot();

    const title   = item.title || item.name || 'Senza titolo';
    const year    = item.year || (item.release_date ? String(item.release_date).slice(0, 4) : '');
    const rating  = item.rating || item.vote_average;
    const runtime = item.runtime || item.duration;
    const genres  = item.genres || item.genre_names || [];

    const backdrop = item.backdrop || item.backdrop_path || item.poster || '';
    const poster   = item.poster || item.poster_path || backdrop;

    const bgStyle = backdrop
      ? `style="background-image: url('${backdrop}');"`
      : '';

    let resumeSeconds = 0;
    let initialSrc = item.url || '';

    // Film: usiamo /iptv/position per riprendere da dove era rimasto
    if (type === 'film') {
      const base = getVixMovieBaseUrl(item);

      if (base) {
        initialSrc = `${base}?lang=${VIX_LANG}&autoplay=true&primaryColor=${VIX_PRIMARY_COLOR}&secondaryColor=${VIX_SECONDARY_COLOR}`;
      }

      try {
        const pos = await API.getIptvPosition(String(item.id));
        const seconds = Number(pos?.position?.t ?? 0) || 0;
        resumeSeconds = seconds;

        // 👉 qui salviamo il valore precedente per l'anti-reset
        window.IPTV_PREVIOUS_POSITION_T = resumeSeconds;

        if (seconds > 5 && base) {
          initialSrc = `${base}?startAt=${Math.floor(seconds)}&lang=${VIX_LANG}&autoplay=true&primaryColor=${VIX_PRIMARY_COLOR}&secondaryColor=${VIX_SECONDARY_COLOR}`;
        }
      } catch (err) {
        console.warn('[IPTV] getIptvPosition film error', err);
      }
    }

    if (!initialSrc) {
      initialSrc = item.url || '';
    }

    root.innerHTML = `
      <div class="iptv-player-page">
        <div class="container iptv-container">

          <!-- HERO / BANNER IN ALTO -->
          <section class="iptv-hero-card" ${bgStyle}>
            <div class="iptv-hero-card__overlay"></div>
            <div class="iptv-hero-card__content">
              ${poster ? `
                <div class="iptv-hero-card__poster-wrap">
                  <img
                    class="iptv-hero-card__poster"
                    src="${poster}"
                    alt="${title}"
                    loading="lazy"
                  />
                </div>
              ` : ''}

              <div class="iptv-hero-card__text">
                <h1 class="iptv-hero-title">${title}</h1>

                <div class="iptv-hero-sub">
                  ${year ? `<span>${year}</span>` : ''}
                  ${runtime ? `<span>${runtime} min</span>` : ''}
                  ${rating ? `<span class="iptv-hero-vote">★ ${Number(rating).toFixed(1)}</span>` : ''}
                </div>

                ${Array.isArray(genres) && genres.length
                  ? `<div class="iptv-hero-genres">${genres.join(' • ')}</div>`
                  : ''
                }

                ${item.overview
                  ? `<p class="iptv-hero-overview">${item.overview}</p>`
                  : ''
                }

                <div class="iptv-hero-actions">
                  <button class="iptv-btn iptv-btn--ghost">
                    ＋ La mia lista
                  </button>
                </div>
              </div>
            </div>
          </section>

          <!-- PLAYER SOTTO IL BANNER -->
          <section class="iptv-player-section">
            <div class="iptv-player-section__head">
              <h2>Riproduzione</h2>
            </div>
            <div class="iptv-player-frame-inner">
              <iframe
                src="${initialSrc}"
                class="iptv-player-frame"
                allowfullscreen
              ></iframe>
            </div>
          </section>
        </div>
      </div>
    `;

    const iframe  = root.querySelector('.iptv-player-frame');

    // Bottone "Riprendi da" SOLO per i film
    if (type === 'film' && resumeSeconds > 5 && iframe) {
      const actions = root.querySelector('.iptv-hero-actions');
      if (actions) {
        const btn = document.createElement('button');
        btn.className = 'iptv-btn iptv-btn--primary iptv-btn-resume';
        const mm = Math.floor(resumeSeconds / 60);
        const ss = String(Math.floor(resumeSeconds % 60)).padStart(2, '0');
        btn.textContent = 'Riprendi da ' + mm + ':' + ss;

        btn.addEventListener('click', () => {
          try {
            const base = getVixMovieBaseUrl(item) || (item.url || iframe.src);
            const seconds = Math.floor(resumeSeconds);
            const nextSrc = `${base}?startAt=${seconds}&lang=${VIX_LANG}&autoplay=true&primaryColor=${VIX_PRIMARY_COLOR}&secondaryColor=${VIX_SECONDARY_COLOR}`;
            iframe.src = nextSrc;
            iframe.focus();
          } catch (err) {
            console.warn('[IPTV] resume click error', err);
          }
        });

        actions.insertBefore(btn, actions.firstChild);
      }
    }

    attachIptvEventBridgeOnce();
  }

  // ---------- PLAYER FILM ----------

  async function renderFilmPlayer(id) {
    showIptvPage();
    setActiveNav('nav-film');

    const root = ensureRoot();
    root.innerHTML = `
      <div class="container iptv-container">
        <div class="iptv-loading">Caricamento film…</div>
      </div>
    `;

    try {
      let movie = null;

      if (window.IPTV && typeof window.IPTV.getMovieById === 'function') {
        movie = await window.IPTV.getMovieById(id);
      } else {
        const { movies } = await getCatalog();
        movie = (movies || []).find(m => String(m.id) === String(id));
      }

      if (!movie) {
        root.innerHTML = `
          <div class="container iptv-container">
            <p class="iptv-empty">Film non trovato.</p>
            <button class="iptv-back-btn" onclick="location.hash='#/film'">⬅ Torna ai film</button>
          </div>
        `;
        return;
      }

      // global per il bridge
      window.IPTV_CURRENT_MEDIA_ID = String(movie.id);
      window.IPTV_CURRENT_MEDIA_TYPE = 'movie';
      window.IPTV_CURRENT_SEASON = null;
      window.IPTV_CURRENT_EPISODE = null;

      if (window.IPTVProgress) {
        window.IPTVProgress.saveMovieProgress(movie);
      }

      renderPlayerPage({ type: 'film', item: movie });
    } catch (e) {
      console.error('[IPTV] errore player Film', e);
      root.innerHTML = `
        <div class="container iptv-container">
          <p class="iptv-empty">Errore nel caricamento del film.</p>
          <button class="iptv-back-btn" onclick="location.hash='#/film'">⬅ Torna ai film</button>
        </div>
      `;
    }
  }

  // ---------- PLAYER SERIE + EPISODI ----------

  async function renderSeriePlayer(id) {
    showIptvPage();
    setActiveNav('nav-serie');

    const root = ensureRoot();
    root.innerHTML = `
      <div class="container iptv-container">
        <div class="iptv-loading">Caricamento serie…</div>
      </div>
    `;

    try {
      let show = null;

      if (window.IPTV && typeof window.IPTV.getSerieById === 'function') {
        show = await window.IPTV.getSerieById(id);
      } else {
        const { series } = await getCatalog();
        show = (series || []).find(s => String(s.id) === String(id));
      }

      if (!show) {
        root.innerHTML = `
          <div class="container iptv-container">
            <p class="iptv-empty">Serie non trovata.</p>
            <button class="iptv-back-btn" onclick="location.hash='#/serie'">⬅ Torna alle serie</button>
          </div>
        `;
        return;
      }

      // normalizza stagioni
      const normalizedSeasons = Array.isArray(show.seasons)
        ? show.seasons
            .map(season => {
              const seasonNumber = typeof season.season_number === 'number'
                ? season.season_number
                : Number(season.season_number);

              return {
                season_number: Number.isFinite(seasonNumber) ? seasonNumber : null,
                name: season.name || '',
                episode_count: typeof season.episode_count === 'number'
                  ? season.episode_count
                  : typeof season.episodes === 'number'
                    ? season.episodes
                    : 0,
                air_date: season.air_date || ''
              };
            })
            .filter(season => Number.isFinite(season.season_number))
            .sort((a, b) => a.season_number - b.season_number)
        : [];

      const filteredSeasons = normalizedSeasons.filter(season => season.season_number > 0);
      const seasons = filteredSeasons.length ? filteredSeasons : normalizedSeasons;

      const defaultSeasonNumber = seasons.length ? seasons[0].season_number : 1;

      // --- RIPRESA DA BACKEND (stagione + episodio + secondi) ---
      let resumeSeason  = defaultSeasonNumber;
      let resumeEpisode = 1;
      let resumeSeconds = 0;

      try {
        const posResp = await API.getIptvPosition(String(show.id));
        const p = posResp && posResp.position;

        if (p) {
          const tNum = Number(p.t);
          if (Number.isFinite(tNum) && tNum >= 0) {
            resumeSeconds = tNum;
          }

          // valore usato dall'anti-reset nel bridge
          window.IPTV_PREVIOUS_POSITION_T = resumeSeconds;

          const sNum = Number(p.season);
          if (Number.isFinite(sNum) && sNum > 0) {
            resumeSeason = sNum;
          }

          const eNum = Number(p.episode);
          if (Number.isFinite(eNum) && eNum > 0) {
            resumeEpisode = eNum;
          }
        }
      } catch (err) {
        console.warn('[IPTV] getIptvPosition serie error', err);
      }

      const baseTvUrl = `https://vixsrc.to/tv/${show.id}/${resumeSeason}/${resumeEpisode}`;
      show = {
        ...show,
        seasons,
        url: `${baseTvUrl}?startAt=${Math.floor(resumeSeconds)}&lang=${VIX_LANG}&autoplay=true&primaryColor=${VIX_PRIMARY_COLOR}&secondaryColor=${VIX_SECONDARY_COLOR}`
      };

      // global per il bridge
      window.IPTV_CURRENT_MEDIA_ID = String(show.id);
      window.IPTV_CURRENT_MEDIA_TYPE = 'tv';   // <— coerente con movie/tv
      window.IPTV_CURRENT_SEASON = resumeSeason;
      window.IPTV_CURRENT_EPISODE = resumeEpisode;

      if (window.IPTVProgress) {
        window.IPTVProgress.saveEpisodeProgress(show, resumeSeason, resumeEpisode);
      }

      // Render base (hero + player)
      renderPlayerPage({ type: 'serie', item: show });

      const container = root.querySelector('.iptv-player-page .container');
      const iframe    = root.querySelector('.iptv-player-frame');
      if (!container || !iframe) return;

      // --- Sezione episodi sotto il player ---
      const episodesSection = document.createElement('section');
      episodesSection.className = 'iptv-episodes-section';
      episodesSection.innerHTML = `
        <div class="iptv-episodes-head">
          <div class="iptv-season-bar" role="tablist"></div>
          <div class="iptv-episodes-headline">
            <h2 class="iptv-episodes-title">Episodi <span class="iptv-current-season"></span></h2>
            <div class="iptv-episodes-sub">Seleziona un episodio per riprodurlo</div>
          </div>
        </div>
        <div class="iptv-episodes-list">
          <div class="iptv-loading">Caricamento episodi…</div>
        </div>
      `;
      container.appendChild(episodesSection);

      const seasonBar = episodesSection.querySelector('.iptv-season-bar');
      const currentSeasonLabel = episodesSection.querySelector('.iptv-current-season');
      const listHost = episodesSection.querySelector('.iptv-episodes-list');

      if (!listHost) return;

      const getSeasonDisplayName = season => {
        if (!season) return '';

        const fallback = `Stagione ${season.season_number}`;

        if (!season.name) {
          return fallback;
        }

        const normalizedName = season.name.trim();
        const genericMatch = /^stagione\s+\d+$/i;
        const englishGenericMatch = /^season\s+\d+$/i;

        if (genericMatch.test(normalizedName) || englishGenericMatch.test(normalizedName)) {
          return fallback;
        }

        return normalizedName;
      };

      const updateSeasonLabel = seasonNumber => {
        if (!currentSeasonLabel) return;
        const season = seasons.find(s => s.season_number === seasonNumber);
        const label = getSeasonDisplayName(season) || `Stagione ${seasonNumber}`;
        currentSeasonLabel.textContent = label;
      };

      let currentSeasonNumber  = resumeSeason;
      let seasonRequestId      = 0;
      let resumeSeasonNumber   = resumeSeason;
      let resumeEpisodeNumber  = resumeEpisode;

      episodesSection.classList.toggle('no-seasons', seasons.length === 0);

      if (seasonBar && seasons.length) {
        seasons.forEach(season => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'iptv-season-btn';
          btn.dataset.season = String(season.season_number);
          btn.textContent = getSeasonDisplayName(season);

          btn.addEventListener('click', () => {
            if (currentSeasonNumber === season.season_number) return;
            loadSeason(season.season_number, { scrollToTop: true });
          });

          seasonBar.appendChild(btn);
        });
      }

      const applySeasonActiveState = targetSeasonNumber => {
        if (!seasonBar) return;
        seasonBar.querySelectorAll('.iptv-season-btn').forEach(btn => {
          const btnSeason = Number(btn.dataset.season);
          if (btnSeason === targetSeasonNumber) {
            btn.classList.add('active');
          } else {
            btn.classList.remove('active');
          }
        });
      };

      async function loadSeason(targetSeasonNumber, { scrollToTop = false } = {}) {
        if (!window.IPTV || typeof window.IPTV.getSerieSeasonEpisodes !== 'function') {
          listHost.innerHTML = `<p class="iptv-empty">Funzione episodi non disponibile.</p>`;
          return;
        }

        currentSeasonNumber = targetSeasonNumber;
        applySeasonActiveState(targetSeasonNumber);
        updateSeasonLabel(targetSeasonNumber);

        const requestId = ++seasonRequestId;
        listHost.innerHTML = `<div class="iptv-loading">Caricamento episodi…</div>`;

        try {
          const episodes = await window.IPTV.getSerieSeasonEpisodes(show.id, targetSeasonNumber);

          if (requestId !== seasonRequestId) {
            return;
          }

          if (!episodes.length) {
            listHost.innerHTML = `<p class="iptv-empty">Nessun episodio trovato per questa stagione.</p>`;
            return;
          }

          const fragment = document.createDocumentFragment();

          episodes.forEach(ep => {
            const episodeNumber = ep.episode_number;
            const itemBtn = document.createElement('button');
            itemBtn.type = 'button';
            itemBtn.className = 'iptv-episode-item';
            itemBtn.dataset.episode = String(episodeNumber);
            itemBtn.innerHTML = `
              <div class="iptv-episode-meta">
                <div class="iptv-episode-number">E${episodeNumber}</div>
                <div class="iptv-episode-title">${ep.title}</div>
              </div>
              ${ep.overview
                ? `<div class="iptv-episode-overview">${ep.overview}</div>`
                : ''
              }
            `;

            itemBtn.addEventListener('click', () => {
              const baseUrl = `https://vixsrc.to/tv/${show.id}/${targetSeasonNumber}/${episodeNumber}`;
              const url = `${baseUrl}?lang=${VIX_LANG}&autoplay=true&primaryColor=${VIX_PRIMARY_COLOR}&secondaryColor=${VIX_SECONDARY_COLOR}`;
              iframe.src = url;

              // aggiorna global per il bridge
              window.IPTV_CURRENT_MEDIA_ID = String(show.id);
              window.IPTV_CURRENT_MEDIA_TYPE = 'tv';
              window.IPTV_CURRENT_SEASON = targetSeasonNumber;
              window.IPTV_CURRENT_EPISODE = episodeNumber;

              resumeSeasonNumber  = targetSeasonNumber;
              resumeEpisodeNumber = episodeNumber;

              if (window.IPTVProgress) {
                window.IPTVProgress.saveEpisodeProgress(show, targetSeasonNumber, episodeNumber);
              }

              listHost
                .querySelectorAll('.iptv-episode-item')
                .forEach(btn => btn.classList.remove('active'));
              itemBtn.classList.add('active');
            });

            fragment.appendChild(itemBtn);
          });

          listHost.innerHTML = '';
          listHost.appendChild(fragment);

          // Marca l'episodio "riprendi" se è questa stagione, altrimenti il primo
          let activeSet = false;
          if (targetSeasonNumber === resumeSeasonNumber) {
            listHost.querySelectorAll('.iptv-episode-item').forEach(btn => {
              if (activeSet) return;
              const epNum = Number(btn.dataset.episode);
              if (epNum === resumeEpisodeNumber) {
                btn.classList.add('active');
                activeSet = true;
              }
            });
          }

          if (!activeSet) {
            const firstButton = listHost.querySelector('.iptv-episode-item');
            if (firstButton) {
              firstButton.classList.add('active');
            }
          }

          if (scrollToTop) {
            listHost.scrollTo({ top: 0, behavior: 'smooth' });
          }
        } catch (err) {
          console.error('[IPTV] errore caricamento episodi serie', err);
          if (requestId === seasonRequestId) {
            listHost.innerHTML = `<p class="iptv-empty">Errore nel caricamento degli episodi.</p>`;
          }
        }
      }

      updateSeasonLabel(currentSeasonNumber);
      applySeasonActiveState(currentSeasonNumber);

      if (window.IPTV && typeof window.IPTV.getSerieSeasonEpisodes === 'function') {
        loadSeason(currentSeasonNumber);
      } else {
        listHost.innerHTML = `<p class="iptv-empty">Funzione episodi non disponibile.</p>`;
      }
    } catch (e) {
      console.error('[IPTV] errore player Serie', e);
      root.innerHTML = `
        <div class="container iptv-container">
          <p class="iptv-empty">Errore nel caricamento della serie.</p>
          <button class="iptv-back-btn" onclick="location.hash='#/serie'">⬅ Torna alle serie</button>
        </div>
      `;
    }
  }

  // ---------- ROUTER HASH ----------

  function onRoute() {
    const raw = (location.hash || '#').toLowerCase();

    let hash = raw.startsWith('#') ? raw.slice(1) : raw;

    if (hash.startsWith('/')) {
      hash = hash.slice(1);
    }

    if (!hash) {
      hideIptvPage();
      return;
    }

    const [section, maybeId] = hash.split('/');

    if (section === 'film') {
      if (maybeId) {
        renderFilmPlayer(maybeId);
      } else {
        renderFilmList();
      }
      return;
    }

    if (section === 'serie') {
      if (maybeId) {
        renderSeriePlayer(maybeId);
      } else {
        renderSerieList();
      }
      return;
    }

    hideIptvPage();
  }

  // ---------- CLICK NAVBAR ----------

  document.addEventListener('click', (e) => {
    const link = e.target.closest('.nav-center-box a');
    if (!link) return;

    const href = (link.getAttribute('href') || '').toLowerCase();
    const id   = link.id;

    if (id === 'navHomeBtn') {
      e.preventDefault();
      hideIptvPage();
      location.hash = '#';
      return;
    }

    if (id === 'navAllBtn') {
      hideIptvPage();
      return;
    }

    if (href.includes('#film') || href.includes('#/film') ||
        href.includes('#serie') || href.includes('#/serie')) {
      setTimeout(onRoute, 0);
      return;
    }

    hideIptvPage();
  });

  window.addEventListener('hashchange', onRoute);
  window.addEventListener('load', () => {
    attachIptvEventBridgeOnce();
    onRoute();
  });

})();
