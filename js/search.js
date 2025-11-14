// js/search.js
class Search {
  static state = {
    query: '',
    languages: new Set(),
    format: 'all'
  };
  static languageLabels = new Map();

  static init() {
    const fab    = UIManager.elements.searchFab;
    const panel  = UIManager.elements.searchPanel;
    const input  = UIManager.elements.searchInput;
    const clearB = UIManager.elements.searchClear;

    fab?.addEventListener('click', () => this.toggle());
    input?.addEventListener('input', () => this.handleInput(), { passive: true });
    input?.addEventListener('keydown', (e) => this.handleKeydown(e));
    clearB?.addEventListener('click', () => this.clear());

    this.setupFilters();

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && panel.classList.contains('show')) {
        this.close();
      }
    });

    document.addEventListener('click', (e) => {
      if (!panel.classList.contains('show')) return;
      const isInside = panel.contains(e.target) || fab.contains(e.target);
      if (!isInside) this.close();
    });
  }

  static toggle() {
    const panel = UIManager.elements.searchPanel;
    if (panel.classList.contains('show')) {
      this.close();
    } else {
      this.open();
    }
  }

  static open() {
    const panel = UIManager.elements.searchPanel;
    const fab   = UIManager.elements.searchFab;
    const input = UIManager.elements.searchInput;

    panel.classList.add('show');
    panel.setAttribute('aria-hidden', 'false');
    fab.setAttribute('aria-expanded', 'true');
    setTimeout(() => input?.focus(), 0);
  }

  static close() {
    const panel = UIManager.elements.searchPanel;
    const fab   = UIManager.elements.searchFab;

    panel.classList.remove('show');
    panel.setAttribute('aria-hidden', 'true');
    fab.setAttribute('aria-expanded', 'false');
  }

  static handleInput() {
    const input   = UIManager.elements.searchInput;
    const clearB  = UIManager.elements.searchClear;
    const query   = input?.value || '';
    this.state.query = query;
    const results = this.filter(query, this.state);

    this.applyFilters(results);

    if (clearB) {
      clearB.style.visibility = query ? 'visible' : 'hidden';
    }
  }

  static handleKeydown(e) {
    const input = UIManager.elements.searchInput;
    if (e.key === 'Escape') {
      input.value = '';
      this.handleInput();
      input.blur();
      this.close();
    }
  }

  static clear() {
    const input = UIManager.elements.searchInput;
    input.value = '';
    this.state.query = '';
    this.handleInput();
    input.focus();
  }

  static filter(query, filters = {}) {
    const normalize = (str) => (str || '').toLowerCase();
    const q = normalize(query).trim();

    const langFilter = filters.languages instanceof Set
      ? filters.languages
      : new Set(Array.isArray(filters.languages) ? filters.languages : []);

    const formatFilter = filters.format || 'all';

    return CATALOG.filter(series => {
      const title = normalize(series.title);
      const langs = SeriesHelper.listLanguages(series);
      const langJoined = normalize(langs.join(' '));

      const matchesQuery = !q || title.includes(q) || langJoined.includes(q);

      const matchesLang = !langFilter.size || langs.some(lang =>
        langFilter.has(Search.normalizeLanguage(lang))
      );

      const format = SeriesHelper.guessFormat(series);
      const matchesFormat = formatFilter === 'all'
        || format === formatFilter
        || (formatFilter === 'series' && format === 'special');

      return matchesQuery && matchesLang && matchesFormat;
    });
  }

  static applyFilters(precomputedResults = null) {
    const { query, languages, format } = this.state;
    const results = precomputedResults || this.filter(query, this.state);
    const activeFilters = languages.size > 0 || format !== 'all';

    const filterLabel = this.describeFilters();
    const queryLabel = (query || '').trim();

    HomePage.render({
      query: queryLabel,
      results,
      filtersActive: activeFilters,
      filterLabel
    });
  }

  static setupFilters() {
    const container = UIManager.elements.searchFilterLanguages;
    const resetBtn  = UIManager.elements.searchFilterReset;
    const panel     = UIManager.elements.searchFilters;

    if (container) {
      container.innerHTML = '';
      const langs = this.collectCatalogLanguages();
      this.languageLabels = new Map(langs.map(({ key, label }) => [key, label]));
      langs.forEach(({ key, label }) => {
        const id = `search-lang-${key.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        const wrapper = document.createElement('label');
        wrapper.className = 'search-filter-chip';
        wrapper.setAttribute('for', id);

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = id;
        input.value = key;

        const span = document.createElement('span');
        span.textContent = label;

        input.addEventListener('change', () => {
          if (input.checked) {
            this.state.languages.add(key);
          } else {
            this.state.languages.delete(key);
          }
          this.applyFilters();
        });

        wrapper.appendChild(input);
        wrapper.appendChild(span);
        container.appendChild(wrapper);
      });
    }

    if (panel) {
      const formatRadios = panel.querySelectorAll('input[name="searchFormat"]');
      formatRadios.forEach((radio) => {
        radio.addEventListener('change', () => {
          if (radio.checked) {
            this.state.format = radio.value;
            this.applyFilters();
          }
        });
      });
    }

    resetBtn?.addEventListener('click', () => this.resetFilters());
  }

  static resetFilters() {
    this.state.languages.clear();
    this.state.format = 'all';

    const panel = UIManager.elements.searchFilters;
    if (panel) {
      panel.querySelectorAll('input[type="checkbox"]').forEach((input) => {
        input.checked = false;
      });
      const defaultRadio = panel.querySelector('input[name="searchFormat"][value="all"]');
      if (defaultRadio) defaultRadio.checked = true;
    }

    this.applyFilters();
  }

  static describeFilters() {
    const parts = [];
    if (this.state.languages.size) {
      const labels = Array.from(this.state.languages).map(code => this.languageLabels.get(code) || code);
      parts.push(`Lingue: ${labels.join(', ')}`);
    }
    if (this.state.format !== 'all') {
      parts.push(`Formato: ${this.state.format === 'series' ? 'Serie' : 'Film / Special'}`);
    }
    return parts.join(' • ');
  }

  static collectCatalogLanguages() {
    const map = new Map();
    (CATALOG || []).forEach(series => {
      SeriesHelper.listLanguages(series).forEach(lang => {
        const key = Search.normalizeLanguage(lang);
        if (!key) return;
        if (!map.has(key)) map.set(key, lang);
      });
    });

    return Array.from(map.entries())
      .map(([key, label]) => ({ key, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  static normalizeLanguage(lang) {
    return (lang || '').trim().toUpperCase();
  }
}
