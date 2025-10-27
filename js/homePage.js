// js/homePage.js
class HomePage {
  static render({ query = '', results = null } = {}) {
    const container = UIManager.elements.homeCarousels;
    const statusEl  = UIManager.elements.searchStatus;

    container.innerHTML = '';

    if (query) {
      statusEl.style.display = 'block';
      statusEl.textContent = results?.length
        ? `Risultati per "${query}" — ${results.length}`
        : `Nessun risultato per "${query}"`;
    } else {
      statusEl.style.display = 'none';
      statusEl.textContent = '';
    }

    if (query) {
      const row = Carousel.create({
        id: 'row-search',
        title: 'Risultati',
        items: results || [],
        size: 'xl'
      });
      if (row) container.appendChild(row);
      return;
    }

    // "Riprendi"
    const resumeItems = CATALOG
      .map(s => {
        const p = ProgressManager.load(s.id);
        const ts = p?.positions
          ? Math.max(...Object.values(p.positions).map(x => x.ts || 0), 0)
          : 0;
        return ts ? { s, ts } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.ts - a.ts)
      .map(x => x.s)
      .slice(0, 20);

    const rowResume = Carousel.create({
      id: 'row-resume',
      title: 'Riprendi',
      items: resumeItems,
      size: 'xl',
      showProgress: true
    });
    if (rowResume) container.appendChild(rowResume);

    // Anime ITA
    const itaAnime = CATALOG.filter(s => /\(ITA\)/i.test(s.title));
    const rowITA = Carousel.create({
      id: 'row-ita',
      title: 'Anime doppiati in italiano 🇮🇹',
      items: itaAnime,
      size: 'xl'
    });
    if (rowITA) container.appendChild(rowITA);

    // SUB ITA
    const subIta = CATALOG.filter(s => /SUB.?ITA/i.test(s.title));
    const rowSub = Carousel.create({
      id: 'row-sub',
      title: 'Anime SUB-ITA',
      items: subIta
    });
    if (rowSub) container.appendChild(rowSub);
  }
}
