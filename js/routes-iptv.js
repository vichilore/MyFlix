// js/routes-iptv.js
// - #/film         => pagina lista film (carosello XL stile anime)
// - #/film/:id     => pagina player film (iframe vixsrc)
// - #/serie        => pagina lista serie
// - #/serie/:id    => pagina player serie

(function () {
  let iptvRoot = null
  let catalogCache = null // { movies: [...], series: [...] }

  function ensureRoot() {
    if (!iptvRoot) {
      iptvRoot = document.createElement('section')
      iptvRoot.id = 'iptv-root'
      iptvRoot.className = 'iptv-page'
    }
    return iptvRoot
  }

  async function getCatalog() {
    if (catalogCache) return catalogCache
    if (!window.IPTV || !window.IPTV.getItalianCatalog) {
      throw new Error('window.IPTV.getItalianCatalog non disponibile')
    }
    catalogCache = await window.IPTV.getItalianCatalog()
    return catalogCache
  }

  function setActiveNav(id) {
    try {
      document
        .querySelectorAll('.nav-center-box li')
        .forEach(li => li.classList.remove('active'))

      if (id) {
        const el = document.getElementById(id)
        if (el && el.parentElement) el.parentElement.classList.add('active')
      }
    } catch {}
  }

  function forceShowNav() {
    const nav = document.querySelector('.nav-center-box')
    if (!nav) return
    let el = nav
    while (el) {
      if (el.style) {
        el.style.display = ''
        el.style.visibility = ''
      }
      el = el.parentElement
    }
  }

  // Mostra solo la pagina IPTV come overlay, lasciando intatta la home
  function showIptvPage() {
    const root = ensureRoot()

    if (root.parentElement !== document.body) {
      document.body.appendChild(root)
    }

    root.style.display = 'block'
    forceShowNav()
  }

  function hideIptvPage() {
    if (iptvRoot && iptvRoot.parentElement) {
      iptvRoot.parentElement.removeChild(iptvRoot)
    }
    iptvRoot = null
    setActiveNav(null)
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
    }
  }

  function mapSerieToCard(s) {
    return {
      id: s.id,
      title: s.title || s.name || 'Senza titolo',
      image: s.poster || s.backdrop || '',
      lang: 'IT',
      year: s.year || (s.first_air_date ? String(s.first_air_date).slice(0, 4) : ''),
      rating: s.rating || s.vote_average || 0,
    }
  }

  // ---------- LISTA FILM ----------

  async function renderFilmList() {
    showIptvPage()
    setActiveNav('nav-film')

    const root = ensureRoot()
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

        <div class="iptv-rows"></div>
      </div>
    `

    const rowsHost    = root.querySelector('.iptv-rows')
    const searchInput = root.querySelector('#iptv-film-search')

    const loading = document.createElement('div')
    loading.className = 'iptv-loading'
    loading.textContent = 'Caricamento consigliati…'
    rowsHost.appendChild(loading)

    let recommendedItems = []

    function renderHome() {
      rowsHost.innerHTML = ''

      if (!recommendedItems.length) {
        rowsHost.innerHTML = `<p class="iptv-empty">Nessun film consigliato trovato.</p>`
        return
      }

      const rowRec = window.Carousel.create({
        id: 'iptv-film-recommended',
        title: 'Consigliati per te',
        items: recommendedItems,
        size: 'xl',
        showProgress: false,
        onClick: (item) => {
          location.hash = `#/film/${item.id}`
        }
      })
      rowsHost.appendChild(rowRec)
    }

    function renderSearchResults(list) {
      rowsHost.innerHTML = ''

      if (!list.length) {
        rowsHost.innerHTML = `<p class="iptv-empty">Nessun film trovato per questa ricerca.</p>`
        return
      }

      const rowSearch = window.Carousel.create({
        id: 'iptv-film-search-results',
        title: 'Risultati della ricerca',
        items: list,
        size: 'xl',
        showProgress: false,
        onClick: (item) => {
          location.hash = `#/film/${item.id}`
        }
      })
      rowsHost.appendChild(rowSearch)
    }

    try {
      if (!window.IPTV || !window.IPTV.loadRecommendedMovies || !window.IPTV.searchMovies) {
        throw new Error('Funzioni IPTV recommended/search non disponibili')
      }

      // 1) Film consigliati
      const recommended = await window.IPTV.loadRecommendedMovies(2)
      rowsHost.innerHTML = ''

      recommendedItems = (recommended || []).map(mapMovieToCard)

      // 2) Prima render: solo "Consigliati per te"
      renderHome()

      // 3) Search
      let lastSearchId = 0

      if (searchInput) {
        searchInput.addEventListener('input', () => {
          const q = searchInput.value.trim()
          lastSearchId++
          const searchId = lastSearchId

          if (!q) {
            renderHome()
            return
          }

          rowsHost.innerHTML = `
            <div class="iptv-loading">Ricerca in corso…</div>
          `

          window.IPTV.searchMovies(q, 1)
            .then(movies => {
              if (searchId !== lastSearchId) return
              const results = (movies || []).map(mapMovieToCard)
              renderSearchResults(results)
            })
            .catch(err => {
              console.error('[IPTV] errore search TMDB', err)
              if (searchId !== lastSearchId) return

              rowsHost.innerHTML = `
                <p class="iptv-empty">Errore durante la ricerca.</p>
              `
            })
        })
      }
    } catch (e) {
      console.error('[IPTV] errore lista Film', e)
      rowsHost.innerHTML = `<p class="iptv-empty">Errore nel caricamento dei Film.</p>`
    }
  }

  // ---------- LISTA SERIE ----------

  async function renderSerieList() {
    showIptvPage()
    setActiveNav('nav-serie')

    const root = ensureRoot()
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

        <div class="iptv-rows"></div>
      </div>
    `

    const rowsHost    = root.querySelector('.iptv-rows')
    const searchInput = root.querySelector('#iptv-serie-search')

    const loading = document.createElement('div')
    loading.className = 'iptv-loading'
    loading.textContent = 'Caricamento serie consigliate…'
    rowsHost.appendChild(loading)

    let recommendedItems = []

    function renderHome() {
      rowsHost.innerHTML = ''

      if (!recommendedItems.length) {
        rowsHost.innerHTML = `<p class="iptv-empty">Nessuna serie consigliata trovata.</p>`
        return
      }

      const rowRec = window.Carousel.create({
        id: 'iptv-serie-recommended',
        title: 'Serie consigliate per te',
        items: recommendedItems,
        size: 'xl',
        showProgress: false,
        onClick: (item) => {
          location.hash = `#/serie/${item.id}`
        }
      })
      rowsHost.appendChild(rowRec)
    }

    function renderSearchResults(list) {
      rowsHost.innerHTML = ''

      if (!list.length) {
        rowsHost.innerHTML = `<p class="iptv-empty">Nessuna serie trovata per questa ricerca.</p>`
        return
      }

      const rowSearch = window.Carousel.create({
        id: 'iptv-serie-search-results',
        title: 'Risultati della ricerca',
        items: list,
        size: 'xl',
        showProgress: false,
        onClick: (item) => {
          location.hash = `#/serie/${item.id}`
        }
      })
      rowsHost.appendChild(rowSearch)
    }

    try {
      if (!window.IPTV ||
          !window.IPTV.loadRecommendedSeries ||
          !window.IPTV.searchSeries) {
        throw new Error('Funzioni IPTV serie recommended/search non disponibili')
      }

      // 1) Serie consigliate
      const recommended = await window.IPTV.loadRecommendedSeries(2)
      rowsHost.innerHTML = ''

      recommendedItems = (recommended || []).map(mapSerieToCard)

      // 2) Prima render
      renderHome()

      // 3) Search
      let lastSearchId = 0

      if (searchInput) {
        searchInput.addEventListener('input', () => {
          const q = searchInput.value.trim()
          lastSearchId++
          const searchId = lastSearchId

          if (!q) {
            renderHome()
            return
          }

          rowsHost.innerHTML = `
            <div class="iptv-loading">Ricerca serie in corso…</div>
          `

          window.IPTV.searchSeries(q, 1)
            .then(series => {
              if (searchId !== lastSearchId) return
              const results = (series || []).map(mapSerieToCard)
              renderSearchResults(results)
            })
            .catch(err => {
              console.error('[IPTV] errore search serie TMDB', err)
              if (searchId !== lastSearchId) return

              rowsHost.innerHTML = `
                <p class="iptv-empty">Errore durante la ricerca.</p>
              `
            })
        })
      }
    } catch (e) {
      console.error('[IPTV] errore lista Serie', e)
      rowsHost.innerHTML = `<p class="iptv-empty">Errore nel caricamento delle Serie TV.</p>`
    }
  }

  // ---------- PLAYER PAGE (hero + iframe) ----------

  function renderPlayerPage({ type, item }) {
    showIptvPage()
    setActiveNav(type === 'film' ? 'nav-film' : 'nav-serie')

    const root = ensureRoot()

    const title   = item.title || item.name || 'Senza titolo'
    const year    = item.year || (item.release_date ? String(item.release_date).slice(0, 4) : '')
    const rating  = item.rating || item.vote_average
    const runtime = item.runtime || item.duration
    const genres  = item.genres || item.genre_names || []

    const backdrop = item.backdrop || item.backdrop_path || item.poster || ''
    const poster   = item.poster || item.poster_path || backdrop

    const bgStyle = backdrop
      ? `style="background-image: url('${backdrop}');"`
      : ''

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
                  <button class="iptv-btn iptv-btn--primary iptv-btn-play">
                    ▶ Riproduci
                  </button>
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
                src="${item.url || ''}"
                class="iptv-player-frame"
                allowfullscreen
              ></iframe>
            </div>
          </section>
        </div>
      </div>
    `

    const playBtn = root.querySelector('.iptv-btn-play')
    const iframe  = root.querySelector('.iptv-player-frame')
    if (playBtn && iframe) {
      playBtn.addEventListener('click', () => {
        iframe.focus()
      })
    }
  }

  // ---------- PLAYER FILM ----------

  async function renderFilmPlayer(id) {
    showIptvPage()
    setActiveNav('nav-film')

    const root = ensureRoot()
    root.innerHTML = `
      <div class="container iptv-container">
        <div class="iptv-loading">Caricamento film…</div>
      </div>
    `

    try {
      let movie = null

      if (window.IPTV && typeof window.IPTV.getMovieById === 'function') {
        movie = await window.IPTV.getMovieById(id)
      } else {
        const { movies } = await getCatalog()
        movie = (movies || []).find(m => String(m.id) === String(id))
      }

      if (!movie) {
        root.innerHTML = `
          <div class="container iptv-container">
            <p class="iptv-empty">Film non trovato.</p>
            <button class="iptv-back-btn" onclick="location.hash='#/film'">⬅ Torna ai film</button>
          </div>
        `
        return
      }

      // salva "continua a guardare" per questo film
      if (window.IPTVProgress) {
        window.IPTVProgress.saveMovieProgress(movie)
      }

      renderPlayerPage({ type: 'film', item: movie })
    } catch (e) {
      console.error('[IPTV] errore player Film', e)
      root.innerHTML = `
        <div class="container iptv-container">
          <p class="iptv-empty">Errore nel caricamento del film.</p>
          <button class="iptv-back-btn" onclick="location.hash='#/film'">⬅ Torna ai film</button>
        </div>
      `
    }
  }

  // ---------- PLAYER SERIE + EPISODI (stagione 1) ----------

  async function renderSeriePlayer(id) {
    showIptvPage()
    setActiveNav('nav-serie')

    const root = ensureRoot()
    root.innerHTML = `
      <div class="container iptv-container">
        <div class="iptv-loading">Caricamento serie…</div>
      </div>
    `

    try {
      let show = null

      if (window.IPTV && typeof window.IPTV.getSerieById === 'function') {
        show = await window.IPTV.getSerieById(id)
      } else {
        const { series } = await getCatalog()
        show = (series || []).find(s => String(s.id) === String(id))
      }

      if (!show) {
        root.innerHTML = `
          <div class="container iptv-container">
            <p class="iptv-empty">Serie non trovata.</p>
            <button class="iptv-back-btn" onclick="location.hash='#/serie'">⬅ Torna alle serie</button>
          </div>
        `
        return
      }

            // 🔴 appena apro la pagina serie, segno già "continua a guardare"
      // come Stagione 1 Episodio 1
      if (window.IPTVProgress) {
        window.IPTVProgress.saveEpisodeProgress(show, 1, 1)
      }



      // Render base (hero + player vuoto o url base)
      renderPlayerPage({ type: 'serie', item: show })

      // Sezione episodi
      const container = root.querySelector('.iptv-player-page .container')
      const iframe    = root.querySelector('.iptv-player-frame')
      if (!container || !iframe) return

      const episodesSection = document.createElement('section')
      episodesSection.className = 'iptv-episodes-section'
      episodesSection.innerHTML = `
        <div class="iptv-episodes-head">
          <h2>Episodi - Stagione 1</h2>
          <div class="iptv-episodes-sub">Seleziona un episodio per riprodurlo</div>
        </div>
        <div class="iptv-episodes-list">
          <div class="iptv-loading">Caricamento episodi…</div>
        </div>
      `
      container.appendChild(episodesSection)

      const listHost = episodesSection.querySelector('.iptv-episodes-list')

      if (window.IPTV && typeof window.IPTV.getSerieSeasonEpisodes === 'function') {
        try {
          const seasonNumber = 1
          const episodes = await window.IPTV.getSerieSeasonEpisodes(show.id, seasonNumber)

          if (!episodes.length) {
            listHost.innerHTML = `<p class="iptv-empty">Nessun episodio trovato.</p>`
            return
          }

          listHost.innerHTML = ''

          episodes.forEach(ep => {
            const episodeNumber = ep.episode_number

            const item = document.createElement('button')
            item.type = 'button'
            item.className = 'iptv-episode-item'
            item.innerHTML = `
              <div class="iptv-episode-meta">
                <div class="iptv-episode-number">E${episodeNumber}</div>
                <div class="iptv-episode-title">${ep.title}</div>
              </div>
              ${ep.overview
                ? `<div class="iptv-episode-overview">${ep.overview}</div>`
                : ''
              }
            `

            item.addEventListener('click', () => {
              const url = `https://vixsrc.to/tv/${show.id}/${seasonNumber}/${episodeNumber}`

              // aggiorno iframe
              iframe.src = url

              // salva "continua a guardare" per questa serie
              if (window.IPTVProgress) {
                window.IPTVProgress.saveEpisodeProgress(show, seasonNumber, episodeNumber)
              }

              // evidenzio l'episodio corrente
              listHost
                .querySelectorAll('.iptv-episode-item')
                .forEach(btn => btn.classList.remove('active'))
              item.classList.add('active')
            })

            listHost.appendChild(item)
          })

          // opzionale: evidenzia il primo episodio (non parte da solo)
          const firstButton = listHost.querySelector('.iptv-episode-item')
          if (firstButton) {
            firstButton.classList.add('active')
          }
        } catch (err) {
          console.error('[IPTV] errore caricamento episodi serie', err)
          listHost.innerHTML = `<p class="iptv-empty">Errore nel caricamento degli episodi.</p>`
        }
      } else {
        listHost.innerHTML = `<p class="iptv-empty">Funzione episodi non disponibile.</p>`
      }
    } catch (e) {
      console.error('[IPTV] errore player Serie', e)
      root.innerHTML = `
        <div class="container iptv-container">
          <p class="iptv-empty">Errore nel caricamento della serie.</p>
          <button class="iptv-back-btn" onclick="location.hash='#/serie'">⬅ Torna alle serie</button>
        </div>
      `
    }
  }

  // ---------- ROUTER HASH ----------

  function onRoute() {
    const raw = (location.hash || '#').toLowerCase()

    let hash = raw.startsWith('#') ? raw.slice(1) : raw

    if (hash.startsWith('/')) {
      hash = hash.slice(1)
    }

    if (!hash) {
      hideIptvPage()
      return
    }

    const [section, maybeId] = hash.split('/')

    if (section === 'film') {
      if (maybeId) {
        renderFilmPlayer(maybeId)
      } else {
        renderFilmList()
      }
      return
    }

    if (section === 'serie') {
      if (maybeId) {
        renderSeriePlayer(maybeId)
      } else {
        renderSerieList()
      }
      return
    }

    hideIptvPage()
  }

  // ---------- CLICK NAVBAR ----------

  document.addEventListener('click', (e) => {
    const link = e.target.closest('.nav-center-box a')
    if (!link) return

    const href = (link.getAttribute('href') || '').toLowerCase()
    const id   = link.id

    // 🏠 HOME → url base e chiudi overlay IPTV
    if (id === 'navHomeBtn') {
      e.preventDefault()
      hideIptvPage()
      location.hash = '#'
      return
    }

    // "Tutti" → chiudi overlay, lascia al router anime
    if (id === 'navAllBtn') {
      hideIptvPage()
      return
    }

    // Film / Serie → IPTV
    if (href.includes('#film') || href.includes('#/film') ||
        href.includes('#serie') || href.includes('#/serie')) {
      setTimeout(onRoute, 0)
      return
    }

    // qualsiasi altra cosa → chiudi overlay IPTV
    hideIptvPage()
  })

  window.addEventListener('hashchange', onRoute)
  window.addEventListener('load', onRoute)

})()
