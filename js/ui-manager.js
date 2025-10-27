// js/ui-manager.js
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

class UIManager {
  static elements = {
    home: $('#home'),
    all: $('#all'),
    watch: $('#watch'),
    allGrid: $('#allGrid'),
    homeCarousels: $('#homeCarousels'),
    searchStatus: $('#searchStatus'),
    searchInput: $('#searchInput'),
    searchClear: $('#searchClear'),
    searchPanel: $('#searchPanel'),
    searchFab: $('#searchFab')
  };

  static showHome() {
    this.elements.all.style.display = 'none';
    this.elements.watch.style.display = 'none';
    this.elements.home.style.display = 'block';
    requestAnimationFrame(() => {
      const nb = $('.nav-center-box')?.getBoundingClientRect().bottom || 0;
      document.documentElement.style.setProperty('--dock-h', Math.ceil(nb) + 'px');
    });
  }

  static showAll() {
    this.elements.home.style.display = 'none';
    this.elements.watch.style.display = 'none';
    this.elements.all.style.display = 'block';
  }

  static showWatch() {
    this.elements.home.style.display = 'none';
    this.elements.all.style.display = 'none';
    this.elements.watch.style.display = 'block';
  }
}
