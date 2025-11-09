// js/providerCarousels.js
// Helper per generare caroselli TMDb per film e serie IPTV

(function () {
  const TYPE_ALIAS = {
    movie: 'movie',
    film: 'movie',
    films: 'movie',
    serie: 'tv',
    series: 'tv',
    tv: 'tv',
    show: 'tv'
  };

  const PROVIDER_CAROUSEL_DEFINITIONS = {
    movie: [
      {
        id: 'provider-prime',
        title: 'Film popolari su Prime Video',
        providerId: 119,
        size: 'xl',
        fallbackRoute: 'film',
        options: { endpoint: '/discover/movie', maxPages: 2 }
      },
      {
        id: 'provider-now',
        title: 'NOW: film da non perdere',
        providerId: 39,
        fallbackRoute: 'film',
        options: { endpoint: '/discover/movie', maxPages: 2 }
      }
    ],
    tv: [
      {
        id: 'provider-netflix',
        title: 'In streaming su Netflix',
        providerId: 8,
        size: 'xl',
        fallbackRoute: 'serie',
        options: { endpoint: '/discover/tv', maxPages: 2 }
      },
      {
        id: 'provider-disney',
        title: 'Serie da guardare su Disney+',
        providerId: 337,
        size: 'xl',
        fallbackRoute: 'serie',
        options: { endpoint: '/discover/tv', maxPages: 2 }
      }
    ]
  };

  const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p/w342';
  const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/w780';

  function getApi() {
    if (typeof window !== 'undefined' && window.API) {
      return window.API;
    }
    if (typeof API !== 'undefined') {
      return API;
    }
    return null;
  }

  function resolveType(type) {
    if (!type) return null;
    const key = TYPE_ALIAS[String(type).toLowerCase()] || null;
    return key && PROVIDER_CAROUSEL_DEFINITIONS[key] ? key : null;
  }

  function cloneDefinitions(type) {
    const resolved = resolveType(type);
    if (!resolved) return [];
    return PROVIDER_CAROUSEL_DEFINITIONS[resolved].map(def => ({ ...def }));
  }

  // ---------- NORMALIZZAZIONE CARD (stessa struttura dei caroselli base) ----------

  function resolveImage(item) {
    if (item.image) return item.image;
    if (item.poster) return item.poster;
    if (item.backdrop) return item.backdrop;

    if (item.poster_path) {
      return `${TMDB_POSTER_BASE}${item.poster_path}`;
    }
    if (item.backdrop_path) {
      return `${TMDB_BACKDROP_BASE}${item.backdrop_path}`;
    }
    return '';
  }

  function resolveYear(item, isTv) {
    if (item.year) return item.year;

    const dateField = isTv
      ? (item.first_air_date || item.air_date || '')
      : (item.release_date || item.first_air_date || '');

    if (!dateField) return '';
    return String(dateField).slice(0, 4);
  }

  function resolveRating(item) {
    if (typeof item.rating === 'number') return item.rating;
    if (typeof item.vote_average === 'number') return item.vote_average;
    return 0;
  }

  function resolveKind(raw, fallbackKind) {
    const k = String(
      raw.kind ||
      raw.mediaType ||
      raw.media_type ||
      raw.type ||
      ''
    ).toLowerCase();

    if (k === 'tv' || k === 'serie' || k === 'series' || k === 'show') {
      return 'tv';
    }
    if (k === 'movie' || k === 'film' || k === 'films') {
      return 'movie';
    }
    return fallbackKind || 'movie';
  }

  function resolveTitleMovie(m) {
    return (
      m.title ||
      m.name ||
      m.original_title ||
      m.original_name ||
      'Senza titolo'
    );
  }

  function resolveTitleSerie(s) {
    return (
      s.name ||
      s.title ||
      s.original_name ||
      s.original_title ||
      'Senza titolo'
    );
  }

  function mapProviderMovieToCard(m) {
    const kind = resolveKind(m, 'movie');
    return {
      id: m.id,
      title: resolveTitleMovie(m),
      image: resolveImage(m),
      lang: 'IT',
      year: resolveYear(m, false),
      rating: resolveRating(m),
      kind
    };
  }

  function mapProviderSerieToCard(s) {
    const kind = resolveKind(s, 'tv');
    return {
      id: s.id,
      title: resolveTitleSerie(s),
      image: resolveImage(s),
      lang: 'IT',
      year: resolveYear(s, true),
      rating: resolveRating(s),
      kind
    };
  }

  // ---------- NAVIGAZIONE ----------

  function navigateToItem(item, fallbackRoute) {
    if (!item || item.id == null) {
      return;
    }

    const id = item.id;
    const kind = String(item.kind || item.mediaType || item.type || '').toLowerCase();

    if (kind === 'tv' || kind === 'serie') {
      location.hash = `#/serie/${id}`;
      return;
    }

    if (kind === 'movie' || kind === 'film') {
      location.hash = `#/film/${id}`;
      return;
    }

    if (fallbackRoute === 'serie') {
      location.hash = `#/serie/${id}`;
    } else {
      location.hash = `#/film/${id}`;
    }
  }

  // ---------- RENDER DI UNA SINGOLA DEFINIZIONE ----------
  // N.B.: qui usiamo *lo stesso* Carousel.create dei consigliati.

  async function renderDefinition(definition, container, options = {}) {
    const carouselLib = typeof window !== 'undefined' ? window.Carousel : null;
    if (!definition || !container || !carouselLib) {
      return;
    }

    const rowId = definition.id || `provider-${definition.providerId}`;
    const fallbackRoute = options.fallbackRoute || definition.fallbackRoute;

    const clickHandler = typeof options.onClick === 'function'
      ? options.onClick
      : (item) => navigateToItem(item, fallbackRoute);

    const api = getApi();
    if (!api || typeof api.fetchProviderTop !== 'function') {
      // niente riga se l’API non c’è
      return;
    }

    // placeholder “Caricamento…” nello stesso container
    const loadingRow = document.createElement('div');
    loadingRow.className = 'row';
    loadingRow.innerHTML = `
      <div class="row-head">
        <div class="row-title">${definition.title}</div>
      </div>
      <p class="iptv-empty">Caricamento contenuti…</p>
    `;
    container.appendChild(loadingRow);

    try {
      const raw = await api.fetchProviderTop(
        definition.providerId,
        definition.options || {}
      );

      let rawItems = [];
      if (Array.isArray(raw)) {
        rawItems = raw;
      } else if (raw && Array.isArray(raw.results)) {
        rawItems = raw.results;
      }

      const limit = Number.isFinite(definition.limit) ? definition.limit : undefined;
      if (limit != null) {
        rawItems = rawItems.slice(0, limit);
      }

      const endpoint = (definition.options && definition.options.endpoint) || '';
      const inferredType =
        endpoint.includes('/tv') || fallbackRoute === 'serie'
          ? 'tv'
          : 'movie';

      const mapFn = inferredType === 'tv'
        ? mapProviderSerieToCard
        : mapProviderMovieToCard;

      const items = rawItems
        .map(mapFn)
        .filter(it => it && it.id != null);

      // tolgo il placeholder
      container.removeChild(loadingRow);

      if (!items.length) {
        return; // nessun contenuto, niente riga
      }

      const row = carouselLib.create({
        id: rowId,
        title: definition.title,
        items,
        size: definition.size || options.size || 'xl',
        showProgress: false,
        onClick: clickHandler
      });

      if (row) {
        container.appendChild(row);
      }
    } catch (error) {
      console.error(`[ProviderCarousels] Errore provider ${definition.providerId}`, error);
      try {
        container.removeChild(loadingRow);
      } catch (_) { /* ignore */ }

      const errorRow = document.createElement('div');
      errorRow.className = 'row';
      errorRow.innerHTML = `
        <div class="row-head">
          <div class="row-title">${definition.title}</div>
        </div>
        <p class="iptv-empty">Contenuti non disponibili al momento.</p>
      `;
      container.appendChild(errorRow);
    }
  }

  // ---------- RENDER DI TUTTI I PROVIDER PER UN TIPO (movie/tv) ----------

  function renderGroup(type, container, options = {}) {
    const definitions = cloneDefinitions(type);
    if (!container || !definitions.length) {
      return Promise.resolve([]);
    }

    // pulisco il container e metto le righe una sotto l’altra,
    // esattamente come fai per i vari caroselli “base”.
    container.innerHTML = '';

    return Promise.all(
      definitions.map(def => renderDefinition(def, container, options))
    );
  }

  window.ProviderCarousels = {
    getDefinitions: cloneDefinitions,
    renderDefinition,
    renderGroup,
    navigateToItem
  };
})();
