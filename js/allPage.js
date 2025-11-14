// js/allPage.js
class AllPage {
  static state = {
    query: '',
    language: 'all',
    format: 'all'
  };

  static init() {
    const {
      allFilterSearch,
      allFilterLanguage,
      allFilterFormat,
      allFilterReset
    } = UIManager.elements;

    this.populateLanguageOptions();

    allFilterSearch?.addEventListener('input', (e) => {
      this.state.query = e.target.value || '';
      this.render();
    });

    allFilterLanguage?.addEventListener('change', (e) => {
      this.state.language = e.target.value || 'all';
      this.render();
    });

    allFilterFormat?.addEventListener('change', (e) => {
      this.state.format = e.target.value || 'all';
      this.render();
    });

    allFilterReset?.addEventListener('click', () => {
      this.state = { query: '', language: 'all', format: 'all' };
      if (allFilterSearch) allFilterSearch.value = '';
      if (allFilterLanguage) allFilterLanguage.value = 'all';
      if (allFilterFormat) allFilterFormat.value = 'all';
      this.render();
    });
  }

  static render(items = null) {
    const grid = UIManager.elements.allGrid;
    if (!grid) return;

    const { allFilterSearch, allFilterLanguage, allFilterFormat } = UIManager.elements;
    if (allFilterSearch && allFilterSearch.value !== this.state.query) {
      allFilterSearch.value = this.state.query;
    }
    if (allFilterLanguage && allFilterLanguage.value !== this.state.language) {
      allFilterLanguage.value = this.state.language;
    }
    if (allFilterFormat && allFilterFormat.value !== this.state.format) {
      allFilterFormat.value = this.state.format;
    }

    const source = Array.isArray(items) ? items : this.applyFilters(CATALOG);
    grid.innerHTML = '';

    if (!source.length) {
      const empty = document.createElement('div');
      empty.className = 'all-empty';
      empty.textContent = 'Nessun titolo corrisponde ai filtri selezionati.';
      grid.appendChild(empty);
      return;
    }

    const sorted = [...source].sort((a, b) =>
      (a.title || '').localeCompare(b.title || '')
    );

    for (const s of sorted) {
      const card = this.createCard(s);
      grid.appendChild(card);
    }
  }

  static createCard(series) {
    const card = document.createElement('article');
    card.className = 'all-card';
    card.dataset.id = series.id;

    card.onclick = (e) => {
      e.preventDefault();
      WatchPage.open(series, true);
    };

    // Badge lingua
    const badges = document.createElement('div');
    badges.className = 'all-badges';
    const lang = series.lang || (Array.isArray(series.seasons) ? series.seasons[0]?.lang : '');
    if (lang) {
      const badge = document.createElement('span');
      badge.className = 'all-badge';
      badge.textContent = lang;
      badges.appendChild(badge);
    }
    card.appendChild(badges);

    // Poster
    const img = document.createElement('img');
    img.className = 'all-poster';
    img.src = series.image || '';
    img.alt = series.title;
    img.onerror = () => Carousel.setFallbackImage(img, series.title);
    card.appendChild(img);

    // Titolo
    const title = document.createElement('div');
    title.className = 'all-title-sm';
    title.textContent = series.title;
    card.appendChild(title);

    return card;
  }

  static applyFilters(list = CATALOG) {
    const { query, language, format } = this.state;
    const q = (query || '').toLowerCase().trim();

    return (list || []).filter(series => {
      const title = (series.title || '').toLowerCase();
      const languages = SeriesHelper.listLanguages(series);
      const matchesQuery = !q
        || title.includes(q)
        || languages.some(lang => (lang || '').toLowerCase().includes(q));

      const matchesLanguage = language === 'all'
        || languages.some(lang => this.normalizeLanguage(lang) === language);

      const seriesFormat = SeriesHelper.guessFormat(series);
      const matchesFormat = format === 'all'
        || seriesFormat === format
        || (format === 'series' && seriesFormat === 'special');

      return matchesQuery && matchesLanguage && matchesFormat;
    });
  }

  static populateLanguageOptions() {
    const select = UIManager.elements.allFilterLanguage;
    if (!select) return;

    const current = this.state.language;
    const options = this.collectLanguages();

    // keep the default "Tutte" option, remove others
    select.querySelectorAll('option:not([value="all"])').forEach(opt => opt.remove());

    options.forEach(([value, label]) => {
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = label;
      if (value === current) opt.selected = true;
      select.appendChild(opt);
    });
  }

  static collectLanguages() {
    const map = new Map();
    (CATALOG || []).forEach(series => {
      SeriesHelper.listLanguages(series).forEach(lang => {
        const key = this.normalizeLanguage(lang);
        if (!key) return;
        if (!map.has(key)) map.set(key, lang);
      });
    });

    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }

  static normalizeLanguage(lang) {
    return (lang || '').trim().toUpperCase();
  }
}
