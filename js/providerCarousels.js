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
        options: { endpoint: '/discover/movie', maxPages: 5 }
      },
      {
        id: 'provider-now',
        title: 'NOW: film da non perdere',
        providerId: 39,
        fallbackRoute: 'film',
        options: { endpoint: '/discover/movie', maxPages: 5 }
      }
    ],
    tv: [
      {
        id: 'provider-netflix',
        title: 'In streaming su Netflix',
        providerId: 8,
        size: 'xl',
        fallbackRoute: 'serie',
        options: { endpoint: '/discover/tv', maxPages: 5 }
      },
      {
        id: 'provider-disney',
        title: 'Serie da guardare su Disney+',
        providerId: 337,
        size: 'xl',
        fallbackRoute: 'serie',
        options: { endpoint: '/discover/tv', maxPages: 5 }
      }
    ]
  };

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

  function ensureHost(container, def, options = {}) {
    if (!container) return null;
    const host = document.createElement('div');
    host.className = options.hostClass || 'provider-carousel-host';
    host.id = `${def.id || `provider-${def.providerId}`}-host`;
    container.appendChild(host);
    return host;
  }

  async function renderDefinition(definition, host, options = {}) {
    if (!definition || !host || !window.Carousel || !window.API) {
      return;
    }

    const rowId = definition.id || `provider-${definition.providerId}`;
    const fallbackRoute = options.fallbackRoute || definition.fallbackRoute;
    const clickHandler = typeof options.onClick === 'function'
      ? options.onClick
      : (item) => navigateToItem(item, fallbackRoute);

    window.Carousel.renderCarousel(host, {
      id: rowId,
      title: definition.title,
      state: 'loading'
    });

    try {
      const rawItems = await window.API.fetchProviderTop(
        definition.providerId,
        definition.options || {}
      );
      const limit = Number.isFinite(definition.limit) ? definition.limit : undefined;
      const items = Array.isArray(rawItems)
        ? rawItems.slice(0, limit || rawItems.length)
        : [];

      if (!items.length) {
        window.Carousel.renderCarousel(host, {
          id: rowId,
          title: definition.title,
          state: 'empty'
        });
        return;
      }

      window.Carousel.renderCarousel(host, {
        id: rowId,
        title: definition.title,
        items,
        size: definition.size || options.size || 'default',
        onClick: clickHandler
      });
    } catch (error) {
      console.error(`[ProviderCarousels] Errore provider ${definition.providerId}`, error);
      window.Carousel.renderCarousel(host, {
        id: rowId,
        title: definition.title,
        state: 'error',
        errorMessage: definition.errorMessage || 'Contenuti non disponibili al momento.'
      });
    }
  }

  function renderGroup(type, container, options = {}) {
    const definitions = cloneDefinitions(type);
    if (!container || !definitions.length) {
      return Promise.resolve([]);
    }

    const hosts = definitions.map(def => ({
      def,
      host: ensureHost(container, def, options)
    })).filter(entry => Boolean(entry.host));

    return Promise.all(hosts.map(({ def, host }) => renderDefinition(def, host, options)));
  }

  window.ProviderCarousels = {
    getDefinitions: cloneDefinitions,
    renderDefinition,
    renderGroup,
    navigateToItem
  };
})();
