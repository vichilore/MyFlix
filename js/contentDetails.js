// js/contentDetails.js
(function() {
  const escapeHtml = (str) => String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const formatLabelMap = {
    series: 'Serie TV',
    movie: 'Film / Special',
    special: 'Special'
  };

  let lastFocused = null;
  let cleanupFns = [];

  function buildData(item) {
    const catalogEntry = (item && item.id && typeof Catalog !== 'undefined' && Catalog.findById)
      ? Catalog.findById(item.id)
      : null;

    const base = catalogEntry || item || {};
    const title = base.title || item?.title || 'Dettagli contenuto';
    const description = base.description || item?.description || base.overview || item?.overview || base.synopsis || item?.synopsis || '';
    const backdrop = item?.backdrop || base.backdrop || base.image || item?.image || '';

    const languages = SeriesHelper.listLanguages(base);
    if (!languages.length && item?.lang) {
      languages.push(item.lang);
    }

    const formatKey = SeriesHelper.guessFormat(base);
    const formatLabel = formatLabelMap[formatKey] || '—';

    const episodes = SeriesHelper.totalEpisodes(base) || (formatKey === 'movie' ? 1 : 0);
    const seasons = SeriesHelper.seasonCount(base);
    const hosts = SeriesHelper.collectHosts(base);

    const ratingRaw = Number(item?.rating || base.rating);
    const rating = Number.isFinite(ratingRaw) && ratingRaw > 0 ? ratingRaw : null;
    const year = item?.year || base.year || '';
    const providerName = item?.providerName || base.providerName || '';

    const tmdbId = item?.tmdbId || (typeof item?.id === 'number' ? item.id : null);
    const mediaTypeRaw = (item?.mediaType || item?.kind || '').toLowerCase();
    const tmdbType = /tv|serie/.test(mediaTypeRaw) ? 'tv' : 'movie';
    const tmdbUrl = tmdbId ? `https://www.themoviedb.org/${tmdbType}/${tmdbId}?language=it-IT` : null;

    const tags = new Set();
    (Array.isArray(base.genres) ? base.genres : []).forEach(g => g && tags.add(g));
    (Array.isArray(base.tags) ? base.tags : []).forEach(t => t && tags.add(t));
    languages.forEach(lang => lang && tags.add(lang));
    if (providerName) tags.add(providerName);
    if (formatLabel !== '—') tags.add(formatLabel);

    return {
      title,
      description,
      backdrop,
      languages,
      formatKey,
      formatLabel,
      episodes,
      seasons,
      hosts,
      rating,
      year,
      providerName,
      tmdbUrl,
      tags: Array.from(tags).slice(0, 8),
      catalogEntry,
      searchTitle: title
    };
  }

  function bindActions(data) {
    const body = UIManager.elements.contentDrawerBody;
    if (!body) return;

    const playBtn = body.querySelector('[data-action="drawer-play"]');
    if (playBtn && data.catalogEntry) {
      playBtn.addEventListener('click', () => {
        hide();
        UIManager.goWatch?.(data.catalogEntry.id);
      });
    }

    const tmdbBtn = body.querySelector('[data-action="drawer-tmdb"]');
    if (tmdbBtn && data.tmdbUrl) {
      tmdbBtn.addEventListener('click', () => {
        window.open(data.tmdbUrl, '_blank', 'noopener');
      });
    }

    const searchBtn = body.querySelector('[data-action="drawer-search"]');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        const query = encodeURIComponent(`${data.searchTitle} streaming`);
        window.open(`https://www.google.com/search?q=${query}`, '_blank', 'noopener');
      });
    }
  }

  function show(item = {}) {
    const { contentDrawer, contentDrawerBody, contentDrawerClose } = UIManager.elements;
    if (!contentDrawer || !contentDrawerBody) {
      return;
    }

    const data = buildData(item);
    lastFocused = document.activeElement;

    const synopsis = escapeHtml(data.description || 'Informazioni non disponibili.').replace(/\n+/g, '<br />');
    const languagesText = data.languages.length ? data.languages.join(' • ') : '—';
    const hostsText = data.hosts.length ? data.hosts.join(' • ') : (data.providerName || 'Catalogo interno');

    const metaRows = [
      { label: 'Formato', value: data.formatLabel || '—' },
      { label: 'Anno', value: data.year || '—' },
      { label: 'Lingue', value: languagesText },
      { label: 'Episodi', value: data.formatKey === 'movie' ? '—' : (data.episodes ? String(data.episodes) : '—') },
      { label: 'Stagioni', value: data.formatKey === 'series' ? (data.seasons ? String(data.seasons) : '—') : '—' },
      { label: 'Valutazione', value: data.rating ? `${data.rating.toFixed(1)}/10` : '—' },
      { label: 'Disponibilità', value: hostsText }
    ];

    const metaHtml = metaRows.map(row => `
      <div class="content-drawer__meta-row">
        <dt>${escapeHtml(row.label)}</dt>
        <dd>${escapeHtml(row.value)}</dd>
      </div>
    `).join('');

    const tagsHtml = data.tags.length
      ? data.tags.map(tag => `<span class="content-drawer__tag">${escapeHtml(tag)}</span>`).join('')
      : '';

    const actions = [];
    if (data.catalogEntry) {
      actions.push('<button class="btn primary" data-action="drawer-play" type="button">Riproduci ora</button>');
    }
    if (data.tmdbUrl) {
      actions.push('<button class="btn ghost" data-action="drawer-tmdb" type="button">Apri su TMDb</button>');
    }
    actions.push('<button class="btn ghost" data-action="drawer-search" type="button">Cerca streaming</button>');

    contentDrawerBody.innerHTML = `
      <div class="content-drawer__hero">
        ${data.backdrop ? `<img src="${escapeHtml(data.backdrop)}" alt="${escapeHtml(data.title)}" />` : ''}
        <h2 class="content-drawer__title">${escapeHtml(data.title)}</h2>
      </div>
      <div class="content-drawer__grid">
        <section class="content-drawer__section">
          <h3>Sinossi</h3>
          <p>${synopsis || 'Informazioni non disponibili.'}</p>
          <div class="content-drawer__actions">${actions.join('')}</div>
        </section>
        <section class="content-drawer__section">
          <h3>Dettagli</h3>
          <dl class="content-drawer__meta">${metaHtml}</dl>
          ${tagsHtml ? `<div class="content-drawer__taglist">${tagsHtml}</div>` : ''}
        </section>
      </div>
    `;

    contentDrawer.setAttribute('aria-hidden', 'false');

    const dismissTargets = contentDrawer.querySelectorAll('[data-close]');
    const onEscape = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        hide();
      }
    };

    cleanupFns.forEach(fn => { try { fn(); } catch (_) {} });
    cleanupFns = [];

    dismissTargets.forEach((el) => {
      const handler = () => hide();
      el.addEventListener('click', handler);
      cleanupFns.push(() => el.removeEventListener('click', handler));
    });

    if (contentDrawerClose) {
      const handler = () => hide();
      contentDrawerClose.addEventListener('click', handler);
      cleanupFns.push(() => contentDrawerClose.removeEventListener('click', handler));
    }

    document.addEventListener('keydown', onEscape, true);
    cleanupFns.push(() => document.removeEventListener('keydown', onEscape, true));

    bindActions(data);

    requestAnimationFrame(() => {
      contentDrawerClose?.focus();
    });
  }

  function hide() {
    const { contentDrawer, contentDrawerBody } = UIManager.elements;
    if (!contentDrawer) return;

    contentDrawer.setAttribute('aria-hidden', 'true');
    cleanupFns.forEach(fn => { try { fn(); } catch (_) {} });
    cleanupFns = [];
    if (contentDrawerBody) {
      contentDrawerBody.innerHTML = '';
    }

    const trigger = UIManager.elements.watchDetailsMore;
    trigger?.setAttribute('aria-expanded', 'false');

    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus();
    }
  }

  window.ContentDetails = { show, hide };
})();
