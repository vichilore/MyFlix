// js/roulettePage.js
(function () {
  const PROVIDER_SOURCES = [
    {
      id: 8,
      name: 'Netflix',
      options: {
        endpoint: '/discover/movie',
        maxPages: 10,
        params: {
          sort_by: 'vote_average.desc',
          'vote_count.gte': 500
        }
      }
    },
    {
      id: 337,
      name: 'Disney+',
      options: {
        endpoint: '/discover/movie',
        maxPages: 10,
        params: {
          sort_by: 'vote_average.desc',
          'vote_count.gte': 400
        }
      }
    },
    {
      id: 39,
      name: 'NOW',
      options: {
        endpoint: '/discover/movie',
        maxPages: 10,
        params: {
          sort_by: 'vote_average.desc',
          'vote_count.gte': 400
        }
      }
    }
  ];

  const state = {
    initialized: false,
    hasSpun: false,
    isSpinning: false,
    carouselEl: null,
    resultEl: null,
    spinBtn: null,
    loading: false,
    loadingPromise: null,
    items: [],
    error: null
  };

  const SPIN_DURATION = 1000;
  const MAX_ITEMS = 14;
  const PLACEHOLDER_ITEMS = 10;

  function getApi() {
    if (typeof window !== 'undefined' && window.API) {
      return window.API;
    }
    if (typeof API !== 'undefined') {
      return API;
    }
    return null;
  }

  function randomChoice(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function setLoading(isLoading) {
    state.loading = isLoading;

    if (state.spinBtn) {
      state.spinBtn.disabled = isLoading || state.isSpinning;
      state.spinBtn.textContent = isLoading ? 'Caricamento…' : 'Gira';
    }

    if (isLoading && !state.hasSpun) {
      showLoadingMessage();
    }
  }

  function createPlaceholderItem() {
    const item = document.createElement('div');
    item.className = 'roulette-item is-placeholder';
    item.setAttribute('aria-hidden', 'true');
    return item;
  }

  function createCarouselItem(film) {
    const item = document.createElement('div');
    item.className = 'roulette-item';

    const img = document.createElement('img');
    img.src = film.image;
    img.alt = '';
    img.loading = 'lazy';

    item.appendChild(img);
    return item;
  }

  function populateCarousel() {
    if (!state.carouselEl) return;

    state.carouselEl.innerHTML = '';
    const fragment = document.createDocumentFragment();
    const pool = state.items;

    if (!pool.length) {
      const count = Math.max(PLACEHOLDER_ITEMS, MAX_ITEMS);
      for (let i = 0; i < count; i += 1) {
        fragment.appendChild(createPlaceholderItem());
      }
      state.carouselEl.appendChild(fragment);
      return;
    }

    const target = Math.min(MAX_ITEMS, Math.max(pool.length, MAX_ITEMS));

    for (let i = 0; i < target; i += 1) {
      const film = randomChoice(pool);
      fragment.appendChild(createCarouselItem(film));
    }

    state.carouselEl.appendChild(fragment);
  }

  function renderResultCard(film) {
    if (!state.resultEl) return;

    const ratingValue = Number(film.rating);
    const ratingMarkup = Number.isFinite(ratingValue) && ratingValue > 0
      ? `<p class="roulette-card__meta">Valutazione TMDb: ${ratingValue.toFixed(1)}/10</p>`
      : '';

    state.lastFilm = film;
    const hasDetails = typeof ContentDetails !== 'undefined' && typeof ContentDetails.show === 'function';
    const tmdbUrl = film.tmdbUrl || '';
    const detailButton = hasDetails
      ? '<button class="btn primary" data-roulette-action="details" type="button">Apri dettagli</button>'
      : '';
    const tmdbButton = tmdbUrl
      ? '<button class="btn ghost" data-roulette-action="tmdb" type="button">Apri su TMDb</button>'
      : '';

    state.resultEl.innerHTML = `
      <article class="roulette-card">
        <img class="roulette-card__cover" src="${film.poster || film.image}" alt="${film.title}" loading="lazy" />
        <div class="roulette-card__body">
          <p class="roulette-card__tag">${film.providerName ? `Top ${film.providerName}` : 'Film consigliato'}</p>
          <h2 class="roulette-card__title">${film.title}</h2>
          <p class="roulette-card__subtitle">${film.originalTitle}${film.year ? ` · ${film.year}` : ''}</p>
          ${ratingMarkup}
          <p class="roulette-card__description">${film.description}</p>
          <div class="roulette-card__actions">
            ${detailButton}
            ${tmdbButton}
            <button class="btn ghost" data-roulette-action="search" type="button">Cerca streaming</button>
          </div>
        </div>
      </article>
    `;

    requestAnimationFrame(() => {
      state.resultEl.classList.remove('is-hidden');
    });

    const detailBtn = hasDetails ? state.resultEl.querySelector('[data-roulette-action="details"]') : null;
    if (detailBtn) {
      detailBtn.addEventListener('click', () => ContentDetails.show(film));
    }

    const tmdbBtn = tmdbUrl ? state.resultEl.querySelector('[data-roulette-action="tmdb"]') : null;
    if (tmdbBtn && tmdbUrl) {
      tmdbBtn.addEventListener('click', () => window.open(tmdbUrl, '_blank', 'noopener'));
    }

    const searchBtn = state.resultEl.querySelector('[data-roulette-action="search"]');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        const query = encodeURIComponent(`${film.title || film.originalTitle || 'film'} streaming`);
        window.open(`https://www.google.com/search?q=${query}`, '_blank', 'noopener');
      });
    }
  }

  function showInitialMessage() {
    if (!state.resultEl || state.loading || state.error) return;

    state.resultEl.innerHTML = '<p class="roulette-hint">Premi “Gira” per scoprire quale film guardare questa sera.</p>';
    state.resultEl.classList.remove('is-hidden');
  }

  function showLoadingMessage() {
    if (!state.resultEl) return;

    state.resultEl.innerHTML = '<p class="roulette-hint">Caricamento dei migliori film in corso…</p>';
    state.resultEl.classList.remove('is-hidden');
  }

  function showErrorMessage(message) {
    if (!state.resultEl) return;

    state.resultEl.innerHTML = `<p class="roulette-error">${message}</p>`;
    state.resultEl.classList.remove('is-hidden');
  }

  function mapProviderItem(item, source) {
    if (!item) return null;

    const poster = item.image || '';
    const backdrop = item.backdrop || poster;
    const mediaType = (item.mediaType || item.type || 'movie').toLowerCase();
    const tmdbId = typeof item.id === 'number' ? item.id : Number(item.tmdbId || item.id);
    const tmdbType = /tv|serie/.test(mediaType) ? 'tv' : 'movie';
    const tmdbUrl = Number.isFinite(tmdbId)
      ? `https://www.themoviedb.org/${tmdbType}/${tmdbId}?language=it-IT`
      : '';

    return {
      id: item.id,
      title: item.title,
      originalTitle: item.title,
      year: item.year || '',
      image: backdrop,
      poster,
      backdrop,
      description: item.overview || 'Descrizione non disponibile.',
      rating: item.rating || 0,
      providerName: source?.name || '',
      mediaType,
      tmdbUrl
    };
  }

  async function loadFilms() {
    if (state.items.length) {
      return state.items;
    }

    if (state.loadingPromise) {
      return state.loadingPromise;
    }

    const api = getApi();
    if (!api || typeof api.fetchProviderTop !== 'function') {
      const error = new Error('API TMDb non disponibile');
      state.error = error;
      throw error;
    }

    setLoading(true);

    const promise = (async () => {
      try {
        const results = await Promise.allSettled(
          PROVIDER_SOURCES.map(source => api.fetchProviderTop(source.id, source.options || {}))
        );

        const aggregated = [];
        const seen = new Set();

        results.forEach((result, index) => {
          if (result.status !== 'fulfilled' || !Array.isArray(result.value)) {
            if (result.status === 'rejected') {
              console.warn('Roulette TMDb fetch fallita per provider', PROVIDER_SOURCES[index]?.id, result.reason);
            }
            return;
          }

          const source = PROVIDER_SOURCES[index];

          result.value.forEach(item => {
            if (!item || item.id == null) return;
            const key = `${item.kind || 'movie'}:${item.id}`;
            if (seen.has(key)) return;
            seen.add(key);

            const mapped = mapProviderItem(item, source);
            if (mapped) {
              aggregated.push(mapped);
            }
          });
        });

        if (!aggregated.length) {
          throw new Error('Nessun titolo disponibile dai provider selezionati');
        }

        state.items = aggregated;
        state.error = null;
        populateCarousel();
        if (!state.hasSpun) {
          showInitialMessage();
        }

        return state.items;
      } catch (error) {
        state.error = error;
        showErrorMessage('Non è stato possibile caricare i migliori film al momento. Riprova più tardi.');
        throw error;
      } finally {
        setLoading(false);
        state.loadingPromise = null;
      }
    })();

    state.loadingPromise = promise;
    return promise;
  }

  async function onSpin() {
    if (state.isSpinning) return;
    if (!state.carouselEl || !state.spinBtn) return;

    try {
      await loadFilms();
    } catch (error) {
      console.error('Impossibile avviare la roulette TMDb:', error);
      return;
    }

    if (state.resultEl) {
      state.resultEl.classList.add('is-hidden');
    }

    populateCarousel();

    if (!state.items.length) {
      showErrorMessage('Nessun film disponibile per il momento.');
      return;
    }

    const selectedFilm = randomChoice(state.items);
    state.isSpinning = true;
    state.spinBtn.disabled = true;

    requestAnimationFrame(() => {
      state.carouselEl.classList.add('is-spinning');
    });

    setTimeout(() => {
      state.carouselEl.classList.remove('is-spinning');
      state.spinBtn.disabled = false;
      state.isSpinning = false;
      state.hasSpun = true;
      renderResultCard(selectedFilm);
    }, SPIN_DURATION);
  }

  const RoulettePage = {
    init() {
      if (state.initialized) return;

      state.carouselEl = document.getElementById('rouletteCarousel');
      state.resultEl = document.getElementById('rouletteResult');
      state.spinBtn = document.getElementById('rouletteSpin');

      populateCarousel();
      showLoadingMessage();

      if (state.spinBtn) {
        state.spinBtn.addEventListener('click', onSpin);
      }

      state.initialized = true;
    },

    async render() {
      this.init();

      try {
        await loadFilms();
      } catch (error) {
        console.error('Caricamento Roulette fallito:', error);
      }
    }
  };

  window.RoulettePage = RoulettePage;
})();
