// js/carousel.js
class Carousel {
  static create({ id, title, items, size = 'default', showProgress = false }) {
    if (!items || !items.length) return null;

    const row = document.createElement('div');
    row.className = 'row' + (size === 'xl' ? ' row--xl' : '');
    row.innerHTML = `
      <div class="row-head">
        <div class="row-title">${title}</div>
        <div class="row-ctrls">
          <button class="arrow" id="${id}-prev" aria-label="Scorri a sinistra">◀</button>
          <button class="arrow" id="${id}-next" aria-label="Scorri a destra">▶</button>
        </div>
      </div>`;

    const track = document.createElement('div');
    track.className = 'carousel';
    track.id = `${id}-track`;
    row.appendChild(track);

    const updateFades = () => {
      const max = track.scrollWidth - track.clientWidth;
      row.classList.toggle('has-fade-right', track.scrollLeft < max - 2);
    };

    track.addEventListener('scroll', updateFades, { passive: true });
    new ResizeObserver(updateFades).observe(track);
    requestAnimationFrame(updateFades);

    for (const item of items) {
      track.appendChild(this.createCard(item, size, showProgress));
    }

    this.setupControls(row, track, id, size);
    return row;
  }

  static createCard(item, size, showProgress) {
    const cell = document.createElement('div');
    cell.className = 'c-item';

    const card = document.createElement('div');
    card.className = size === 'xl' ? 'c-card c-card--xl' : 'c-card';

    // BADGES (lingua)
    const badges = document.createElement('div');
    badges.className = 'c-badges';
    if (item.lang) {
      const badge = document.createElement('span');
      badge.className = 'c-badge';
      badge.textContent = item.lang;
      badges.appendChild(badge);
    }
    card.appendChild(badges);

    // POSTER
    const img = document.createElement('img');
    img.className = size === 'xl' ? 'c-poster c-poster--xl' : 'c-poster';
    img.src = item.image || '';
    img.alt = item.title;
    img.onerror = () => this.setFallbackImage(img, item.title);
    card.appendChild(img);

    if (size === 'xl') {
      const grad = document.createElement('div');
      grad.className = 'c-grad--xl';

      const info = document.createElement('div');
      info.className = 'c-info--xl';

      const titleEl = document.createElement('div');
      titleEl.className = 'c-title--xl';
      titleEl.textContent = item.title;

      info.appendChild(titleEl);
      card.appendChild(grad);
      card.appendChild(info);
    }

    // PROGRESS BAR
    if (showProgress) {
      const pct = ProgressManager.getLatestProgressPercent(item);
      const bar = document.createElement('div');
      bar.className = 'c-progress';
      const fill = document.createElement('i');
      fill.style.width = pct + '%';
      bar.appendChild(fill);
      card.appendChild(bar);
    }

    card.addEventListener('click', () => WatchPage.open(item));
    cell.appendChild(card);
    return cell;
  }

  static setFallbackImage(img, title) {
    img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600">
        <rect width="100%" height="100%" fill="#131318"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
              fill="#fff" font-family="Arial" font-size="24">${title}</text>
      </svg>`
    );
  }

  static setupControls(row, track, id, size) {
    const prev = row.querySelector(`#${id}-prev`);
    const next = row.querySelector(`#${id}-next`);

    const step = () => {
      const c = track.querySelector('.c-item');
      return (c ? c.getBoundingClientRect().width : 280) * (size === 'xl' ? 1.2 : 3);
    };

    prev.onclick = () => track.scrollBy({ left: -step(), behavior: 'smooth' });
    next.onclick = () => track.scrollBy({ left: step(), behavior: 'smooth' });
  }
}
