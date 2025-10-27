// js/search.js
class Search {
  static init() {
    const fab    = UIManager.elements.searchFab;
    const panel  = UIManager.elements.searchPanel;
    const input  = UIManager.elements.searchInput;
    const clearB = UIManager.elements.searchClear;

    fab?.addEventListener('click', () => this.toggle());
    input?.addEventListener('input', () => this.handleInput(), { passive: true });
    input?.addEventListener('keydown', (e) => this.handleKeydown(e));
    clearB?.addEventListener('click', () => this.clear());

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
    const results = this.filter(query);

    HomePage.render({ query: query.trim(), results });

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
    this.handleInput();
    input.focus();
  }

  static filter(query) {
    const normalize = (str) => (str || '').toLowerCase();
    const q = normalize(query).trim();

    if (!q) return CATALOG;

    return CATALOG.filter(s => {
      const title = normalize(s.title);
      const lang  = normalize(
        s.lang || (SeriesHelper.isSeasonal(s) ? s.seasons[0]?.lang : '')
      );
      return title.includes(q) || lang.includes(q);
    });
  }
}
