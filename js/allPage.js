// js/allPage.js
class AllPage {
  static render(items = CATALOG) {
    const grid = UIManager.elements.allGrid;
    grid.innerHTML = '';

    const sorted = [...items].sort((a, b) =>
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
}
