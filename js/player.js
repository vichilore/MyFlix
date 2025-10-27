// js/player.js
class Player {
  static currentSeries = null;
  static currentEp = null;
  static lastSave = 0;

  static init() {
    const overlay = $('#playerOverlay');
    const video   = $('#video');
    const closeBtn= $('#playerClose');
    const prevBtn = $('#prevEp');
    const nextBtn = $('#nextEp');

    closeBtn?.addEventListener('click', () => this.close());
    prevBtn.onclick = () => this.move((this.currentEp || 1) - 1);
    nextBtn.onclick = () => this.move((this.currentEp || 1) + 1);

    video.addEventListener('timeupdate', () => this.handleTimeUpdate());
    video.addEventListener('ended', () => this.handleEnded());

    // Sync events for watch together hooks (stub-safe)
    video.addEventListener('play',   () => WatchTogether.broadcastState());
    video.addEventListener('pause',  () => WatchTogether.broadcastState());
    video.addEventListener('seeked', () => WatchTogether.broadcastState());

    overlay.addEventListener('keydown', (e) => this.handleKeyboard(e));

    this.setupTouchGestures(overlay);
  }

  static play(series, ep) {
    this.currentSeries = series;
    this.currentEp = ep;

    const overlay = $('#playerOverlay');
    const video   = $('#video');
    const source  = $('#episode');
    const nowTitle= $('#nowTitle');
    const nowInfo = $('#nowInfo');

    const src = SeriesHelper.buildEpisodeUrl(series, ep);
    source.src = src;
    video.load();

    nowTitle.textContent = `${series.title} — Ep ${String(ep).padStart(3, '0')}`;
    nowInfo.textContent  = src.split('/').slice(-2).join('/');

    ProgressManager.setLastEpisode(series.id, ep);

    overlay.style.display = 'flex';
    overlay.classList.add('show');
    document.documentElement.style.overflow = 'hidden';

    // resume from saved position
    const pos = ProgressManager.getPosition(series.id, ep);
    const trySeek = () => {
      if (pos?.t > 5) video.currentTime = pos.t - 1;
      video.play().catch(() => {});
    };

    if (video.readyState >= 2) {
      trySeek();
    } else {
      video.addEventListener('canplay', trySeek, { once: true });
    }

    // WatchTogether hooks
    if (WatchTogether.roomId) {
      WatchTogether.joinRoom(WatchTogether.roomId);
      WatchTogether.notifyEpisodeChange();
      setTimeout(() => WatchTogether.broadcastState(), 400);
    }
  }

  static move(epNum) {
    if (!this.currentSeries) return;
    const max = SeriesHelper.totalEpisodes(this.currentSeries);
    if (epNum < 1 || epNum > max) return;

    // se cambia stagione, aggiorniamo il picker
    if (SeriesHelper.isSeasonal(this.currentSeries)) {
      const { seasonIndex } = SeriesHelper.seasonFromAbsolute(this.currentSeries, epNum);
      if (seasonIndex !== WatchPage.currentSeasonIndex) {
        WatchPage.currentSeasonIndex = seasonIndex;
        WatchPage.renderSeasons(this.currentSeries);
      }
    }

    this.play(this.currentSeries, epNum);
  }

  static close() {
    this.persistProgress();
    const overlay = $('#playerOverlay');
    const video   = $('#video');
    const source  = $('#episode');

    try { video.pause(); } catch {}
    source.src = '';

    overlay.classList.remove('show');
    overlay.style.display = 'none';
    document.documentElement.style.overflow = '';

    if (this.currentSeries) {
      WatchPage.updateResumeButton(this.currentSeries);
    }
  }

  static persistProgress() {
    try {
      if (!this.currentSeries || !this.currentEp) return;
      const video = $('#video');
      const t = video?.currentTime || 0;
      const d = video?.duration || 0;
      if (d > 0) {
        ProgressManager.setPosition(this.currentSeries.id, this.currentEp, t, d);

        // opzionale: se loggato, manda anche al backend (non blocca la UI)
        if (Auth.isLoggedIn()) {
          API.saveProgress(this.currentSeries.id, this.currentEp, Math.floor(t))
            .catch(() => {});
        }
      }
    } catch {}
  }

  static handleTimeUpdate() {
    if (!this.currentSeries || !this.currentEp) return;
    const video = $('#video');
    const t = video.currentTime;
    const d = video.duration;

    // salva ogni ~2s
    if ((Date.now() - this.lastSave) < 2000) return;
    this.lastSave = Date.now();

    if (d > 0) {
      ProgressManager.setPosition(this.currentSeries.id, this.currentEp, t, d);

      // manda al backend best-effort
      if (Auth.isLoggedIn()) {
        API.saveProgress(this.currentSeries.id, this.currentEp, Math.floor(t)).catch(() => {});
      }

      // se >90% segna come visto
      if (t / d >= 0.9) {
        ProgressManager.markWatched(this.currentSeries.id, this.currentEp);
        WatchPage.updateEpisodeButtonState(this.currentSeries.id, this.currentEp);
        WatchPage.updateResumeButton(this.currentSeries);
      }
    }
  }

  static handleEnded() {
    if (!this.currentSeries || !this.currentEp) return;
    ProgressManager.markWatched(this.currentSeries.id, this.currentEp);
    ProgressManager.clearPosition(this.currentSeries.id, this.currentEp);
    WatchPage.updateResumeButton(this.currentSeries);
    this.move(this.currentEp + 1);
  }

  static handleKeyboard(e) {
    if (/(input|textarea|select)/i.test(e.target.tagName)) return;
    const video = $('#video');

    switch (e.key) {
      case ' ':
        e.preventDefault();
        if (video.paused) video.play().catch(() => {});
        else video.pause();
        break;
      case 'ArrowLeft':
        video.currentTime = Math.max(0, (video.currentTime || 0) - 5);
        break;
      case 'ArrowRight':
        video.currentTime = Math.min(video.duration || 1e9, (video.currentTime || 0) + 5);
        break;
      case 'Escape':
        this.close();
        break;
      case 'n':
      case 'N':
        this.move((this.currentEp || 1) + 1);
        break;
      case 'p':
      case 'P':
        this.move((this.currentEp || 1) - 1);
        break;
    }
  }

  static setupTouchGestures(overlay) {
    let startY = 0, dy = 0, swiping = false;

    overlay.addEventListener('touchstart', (e) => {
      if (!e.touches?.length) return;
      startY = e.touches[0].clientY;
      dy = 0;
      swiping = true;
    }, { passive: true });

    overlay.addEventListener('touchmove', (e) => {
      if (!swiping || !e.touches?.length) return;
      dy = e.touches[0].clientY - startY;
      if (dy > 10) {
        overlay.style.transform = `translateY(${Math.min(dy, 120)}px)`;
        overlay.style.opacity = String(Math.max(0.6, 1 - dy / 600));
      }
    }, { passive: true });

    overlay.addEventListener('touchend', () => {
      if (!swiping) return;
      swiping = false;
      overlay.style.transform = '';
      overlay.style.opacity = '';
      if (dy > 120) this.close();
    });
  }
}
