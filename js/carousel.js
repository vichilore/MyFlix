// js/carousel.js
class Carousel {
  static create({ id, title, items, size = 'default', showProgress = false, onClick }) {
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

    for (const item of items) {
      track.appendChild(this.createCard(item, size, showProgress, onClick));
    }

    const controls = this.setupControls(row, track, id, size);

    if (controls && typeof controls.updateState === 'function') {
      const updateState = controls.updateState;

      track.addEventListener('scroll', updateState, { passive: true });

      if (typeof ResizeObserver === 'function') {
        const resizeObserver = new ResizeObserver(updateState);
        resizeObserver.observe(track);
        track.__carouselResizeObserver = resizeObserver;
      }

      requestAnimationFrame(updateState);
    }

    return row;
  }

  static createCard(item, size, showProgress, onClick) {
    const cell = document.createElement('div');
    cell.className = 'c-item';

    const card = document.createElement('div');
    card.className = size === 'xl' ? 'c-card c-card--xl' : 'c-card';
    card.setAttribute('data-id', item.id);

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
      let pct = 0;
      try {
        if (window.ProgressManager && typeof ProgressManager.getLatestProgressPercent === 'function') {
          pct = ProgressManager.getLatestProgressPercent(item.id) || 0;
        }
      } catch (e) {
        pct = 0;
      }

      const bar = document.createElement('div');
      bar.className = 'c-progress';
      const fill = document.createElement('i');
      fill.style.width = pct + '%';
      bar.appendChild(fill);
      card.appendChild(bar);
    }

    // CLICK HANDLER:
    // - se onClick è passato, usiamo quello (es. Film/Serie)
    // - altrimenti usiamo WatchPage.open (comportamento anime esistente)
    card.addEventListener('click', () => {
      if (typeof onClick === 'function') {
        onClick(item);
      } else if (window.WatchPage && typeof WatchPage.open === 'function') {
        WatchPage.open(item);
      }
    });

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

  static resolveHost(target) {
    if (!target) return null;
    if (typeof target === 'string') {
      return document.getElementById(target);
    }
    if (target instanceof HTMLElement) {
      return target;
    }
    return null;
  }

  static createStateRow({ id, title, message, spinner = false }) {
    const row = document.createElement('div');
    row.className = 'row row--state';
    row.id = `${id}-state`;
    row.innerHTML = `
      <div class="row-head">
        <div class="row-title">${title || ''}</div>
      </div>
      <div class="row-status">
        ${spinner ? '<span class="row-spinner" aria-hidden="true"></span>' : ''}
        <span>${message}</span>
      </div>
    `;
    return row;
  }

  static renderCarousel(target, { id, title, items = [], size = 'default', showProgress = false, onClick, state = 'ready', errorMessage } = {}) {
    const host = this.resolveHost(target);
    if (!host) {
      return;
    }

    const rowId = id || (typeof target === 'string' ? target : host.id || 'carousel');
    host.innerHTML = '';

    if (state === 'loading') {
      host.dataset.state = 'loading';
      host.appendChild(this.createStateRow({ id: rowId, title, message: 'Caricamento…', spinner: true }));
      return;
    }

    if (state === 'error') {
      host.dataset.state = 'error';
      host.appendChild(this.createStateRow({ id: rowId, title, message: errorMessage || 'Impossibile caricare i contenuti.' }));
      return;
    }

    if (!items || !items.length) {
      host.dataset.state = 'empty';
      host.appendChild(this.createStateRow({ id: rowId, title, message: 'Nessun contenuto disponibile.' }));
      return;
    }

    host.dataset.state = 'ready';
    const row = this.create({ id: rowId, title, items, size, showProgress, onClick });
    if (row) {
      host.appendChild(row);
    }
  }

  static setupControls(row, track, id, size) {
    const prev = row.querySelector(`#${id}-prev`);
    const next = row.querySelector(`#${id}-next`);

    const step = () => {
      const c = track.querySelector('.c-item');
      const w = c ? c.getBoundingClientRect().width : 280;
      const visible = Math.floor(track.clientWidth / Math.max(w, 1)) || 1;
      return w * Math.max(visible - 0.5, 1);
    };

    const updateState = () => {
      const maxScroll = Math.max(0, Math.round(track.scrollWidth - track.clientWidth));
      const current = Math.round(track.scrollLeft);
      const atStart = current <= 2;
      const atEnd = current >= (maxScroll - 2);

      row.classList.toggle('has-fade-left', !atStart && maxScroll > 0);
      row.classList.toggle('has-fade-right', !atEnd && maxScroll > 0);

      if (prev) prev.disabled = atStart;
      if (next) next.disabled = atEnd;
    };

    if (prev) {
      prev.addEventListener('click', () => {
        const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
        const target = Math.max(0, Math.min(track.scrollLeft - step(), maxScroll));
        track.scrollTo({ left: target, behavior: 'smooth' });
        requestAnimationFrame(updateState);
      });
    }

    if (next) {
      next.addEventListener('click', () => {
        const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
        const target = Math.max(0, Math.min(track.scrollLeft + step(), maxScroll));
        track.scrollTo({ left: target, behavior: 'smooth' });
        requestAnimationFrame(updateState);
      });
    }

    return { updateState };
  }
}

// di solito questo c'è già da qualche parte, nel dubbio:
window.Carousel = Carousel;


