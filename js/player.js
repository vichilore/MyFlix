// js/player.js

class Player {
  static currentSeries = null;
  static currentEp = null;
  static lastSave = 0;
  static skipTimer = null;
  static skipUI = null;
  static isChangingEpisode = false;
  static _ending = false;

  static init() {
    const overlay = document.getElementById('playerOverlay');
    const video   = document.getElementById('video');
    const source  = document.getElementById('episode');
    const closeBtn= document.getElementById('playerClose');
    const prevBtn = document.getElementById('prevEp');
    const nextBtn = document.getElementById('nextEp');

    if (!overlay || !video || !source) {
      console.warn("Player.init: elementi video mancanti");
      return;
    }

    // salva ref per gesture
    this.overlay = overlay;
    this.video = video;

    // chiudi player
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // episodio precedente / successivo
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        const prev = (this.currentEp || 1) - 1;
        this.move(prev);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const currentEp = this.currentEp || 1;
        const next = currentEp + 1;
        const max = this.currentSeries ? SeriesHelper.totalEpisodes(this.currentSeries) : 999;

        console.log('[Player] Next button clicked:', { currentEp, next, max });

        if (next <= max) {
          this.move(next);
        }
      });
    }

    // Add season navigation buttons to player bar
    const seasonPrevBtn = document.createElement('button');
    seasonPrevBtn.className = 'btn';
    seasonPrevBtn.innerHTML = '⇽';
    seasonPrevBtn.title = 'Stagione precedente';
    seasonPrevBtn.style.display = 'none';
    seasonPrevBtn.addEventListener('click', () => this.changeSeason(-1));

    const seasonNextBtn = document.createElement('button');
    seasonNextBtn.className = 'btn';
    seasonNextBtn.innerHTML = '⇾';
    seasonNextBtn.title = 'Prossima stagione';
    seasonNextBtn.style.display = 'none';
    seasonNextBtn.addEventListener('click', () => this.changeSeason(1));

    // Insert season navigation buttons
    const playerControls = document.querySelector('.player-controls');
    if (playerControls) {
      playerControls.insertBefore(seasonPrevBtn, playerControls.firstChild);
      playerControls.appendChild(seasonNextBtn);
      this.seasonPrevBtn = seasonPrevBtn;
      this.seasonNextBtn = seasonNextBtn;
    }

    // iOS/iPad playback attributes and custom controls
    try {
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.setAttribute('x-webkit-airplay', 'allow');
      video.setAttribute('controlslist', 'nodownload');
      video.disableRemotePlayback = false;
    } catch {}

    try {
      const controlsHost = document.querySelector('.player-controls');
      if (controlsHost) {
        // Picture-in-Picture
        const pipBtn = document.createElement('button');
        pipBtn.className = 'btn';
        pipBtn.id = 'togglePiP';
        pipBtn.title = 'Picture in Picture';
        pipBtn.textContent = 'PiP';
        pipBtn.style.display = 'none';
        pipBtn.addEventListener('click', () => Player.togglePiP());

        // Fullscreen
        const fsBtn = document.createElement('button');
        fsBtn.className = 'btn';
        fsBtn.id = 'toggleFullscreen';
        fsBtn.title = 'Schermo intero';
        fsBtn.textContent = 'Fullscreen';
        fsBtn.addEventListener('click', () => Player.toggleFullscreen());

        controlsHost.insertBefore(fsBtn, controlsHost.firstChild);
        controlsHost.insertBefore(pipBtn, controlsHost.firstChild);

        const pipSupported = 'pictureInPictureEnabled' in document && typeof video.requestPictureInPicture === 'function';
        if (pipSupported) pipBtn.style.display = '';

        ['fullscreenchange', 'webkitfullscreenchange', 'MSFullscreenChange'].forEach(evt =>
          document.addEventListener(evt, () => {
            const el = document.getElementById('toggleFullscreen');
            if (el) el.textContent = Player.isFullscreen() ? 'Esci Fullscreen' : 'Fullscreen';
          })
        );
      }
    } catch {}

    // salvataggio avanzamento
    video.addEventListener('timeupdate', () => this.handleTimeUpdate());
    video.addEventListener('ended',      () => this.handleEnded());

    // sync con WatchTogether se presente
    video.addEventListener('play',   () => { if (window.WatchTogether) WatchTogether.broadcastState?.(); });
    video.addEventListener('pause',  () => { if (window.WatchTogether) WatchTogether.broadcastState?.(); });
    video.addEventListener('seeked', () => { if (window.WatchTogether) WatchTogether.broadcastState?.(); });

    // tastiera
    overlay.addEventListener('keydown', (e) => this.handleKeyboard(e));

    // === [AGGIUNTA] Gesture touch iPad: tap singolo / doppio tap ±10s ===
    // evita conflitti con elementi UI (skip-ui, bottoni ecc.)
    let lastTap = 0;
    overlay.addEventListener('touchend', (e) => {
      // non gestire se si è toccato un controllo esplicito
      const t = e.changedTouches && e.changedTouches[0];
      if (!t) return;

      const targetIsControl =
        e.target.closest('.skip-ui') ||
        e.target.closest('[data-action]') ||
        e.target.closest('button') ||
        e.target.closest('a');

      if (targetIsControl) return;

      const now = Date.now();
      const dt = now - lastTap;
      lastTap = now;

      const x = t.clientX;
      const mid = window.innerWidth / 2;

      if (dt < 280) {
        // doppio tap -> seek ±10s
        if (!this.video) return;
        const delta = (x < mid) ? -10 : +10;
        const dur = this.video.duration || 1e9;
        try {
          this.video.currentTime = Math.min(dur, Math.max(0, (this.video.currentTime || 0) + delta));
        } catch (err) {
          console.warn('[Player] seek (double tap) error', err);
        }
      } else {
        // tap singolo -> toggle controlli nativi per 2.5s
        // if (!this.video) return;
        // if (this.video.hasAttribute('controls')) {
        //   this.video.removeAttribute('controls');
        // } else {
        //   this.video.setAttribute('controls', '');
        //   setTimeout(() => { try { this.video.removeAttribute('controls'); } catch {} }, 2500);
        // }
      }
    }, { passive: true });
    // === fine aggiunta gesture ===
  }

  static play(series, ep) {
    if (!series) {
      console.warn("Player.play: serie mancante");
      return;
    }

    this.currentSeries = series;
    this.currentEp = ep;

    const overlay = document.getElementById('playerOverlay');
    const video   = document.getElementById('video');
    const source  = document.getElementById('episode');
    const nowTitle= document.getElementById('nowTitle');
    const nowInfo = document.getElementById('nowInfo');

    if (!overlay || !video || !source) {
      console.warn("Player.play: elementi DOM mancanti");
      return;
    }

    // URL dell'episodio da SeriesHelper
    const src = SeriesHelper.buildEpisodeUrl(series, ep);

    // metti src
    source.src = src;
    // tagga dataset per WatchTogether sync
    try {
      video.dataset.seriesId = String(series.id);
      video.dataset.epNumber = String(ep);
    } catch {}
    video.load();

    // UI info
    if (nowTitle) {
      nowTitle.textContent = `${series.title} — Ep ${String(ep).padStart(3, '0')}`;
    }
    if (nowInfo) {
      nowInfo.textContent  = src.split('/').slice(-2).join('/');
    }

    // aggiorna progress manager locale
    ProgressManager.setLastEpisode(series.id, ep);

    // mostra overlay player
    overlay.style.display = 'flex';
    overlay.classList.add('show');
    document.documentElement.style.overflow = 'hidden';

    // resume da posizione salvata
    const pos = ProgressManager.getPosition(series.id, ep); // {t,d,ts}? o null

    const trySeek = () => {
      if (pos && pos.t && pos.t > 5) {
        video.currentTime = pos.t - 1;
      }
      video.play().catch(() => {});
    };

    if (video.readyState >= 2) {
      trySeek();
    } else {
      video.addEventListener('canplay', trySeek, { once: true });
    }

    // watch together broadcast
    if (window.WatchTogether && WatchTogether.roomId) {
      WatchTogether.joinRoom?.(WatchTogether.roomId);
      WatchTogether.notifyEpisodeChange?.();
      setTimeout(() => WatchTogether.broadcastState?.(), 400);
    }
  }

  static move(epNum) {
    if (!this.currentSeries || this.isChangingEpisode) {
      console.log('[Player] move blocked:', { hasSeries: !!this.currentSeries, isChanging: this.isChangingEpisode });
      return;
    }

    const max = SeriesHelper.totalEpisodes(this.currentSeries);
    if (epNum < 1 || epNum > max) {
      console.log('[Player] move out of range:', { epNum, max });
      return;
    }

    console.log('[Player] move to episode:', epNum);
    this.isChangingEpisode = true;

    // se cambia stagione aggiorniamo la view di WatchPage
    if (SeriesHelper.isSeasonal(this.currentSeries) && window.WatchPage) {
      const data = SeriesHelper.seasonFromAbsolute(this.currentSeries, epNum);
      if (data && data.seasonIndex !== WatchPage.currentSeasonIndex) {
        WatchPage.currentSeasonIndex = data.seasonIndex;
        WatchPage.renderSeasons(this.currentSeries);
      }
    }

    this.play(this.currentSeries, epNum);

    // Reset flag dopo un breve delay
    setTimeout(() => {
      this.isChangingEpisode = false;
    }, 1000);
  }

  static close() {
    this.persistProgress();
    this.hideSkipUI(); // Pulisci UI skip

    const overlay = document.getElementById('playerOverlay');
    const video   = document.getElementById('video');
    const source  = document.getElementById('episode');

    try { video.pause(); } catch {}
    if (source) source.src = '';

    overlay.classList.remove('show');
    overlay.style.display = 'none';
    document.documentElement.style.overflow = '';

    // aggiorna UI riprendi
    if (this.currentSeries && window.WatchPage) {
      WatchPage.updateResumeButton?.(this.currentSeries);
    }
  }

  static persistProgress() {
    try {
      if (!this.currentSeries || !this.currentEp) return;
      const video = document.getElementById('video');
      const t = video?.currentTime || 0;
      const d = video?.duration || 0;

      if (d > 0) {
        // salva localmente
        ProgressManager.setPosition(this.currentSeries.id, this.currentEp, t, d);

        // manda al backend
        if (Auth.isLoggedIn && Auth.isLoggedIn()) {
          API.saveProgress(this.currentSeries.id, this.currentEp, Math.floor(t))
            .catch(() => {});
        }
      }
    } catch(e) {
      console.warn("persistProgress error:", e);
    }
  }

  static handleTimeUpdate() {
    if (!this.currentSeries || !this.currentEp) return;

    const video = document.getElementById('video');
    const t = video.currentTime;
    const d = video.duration;

    // salva max ogni ~2s
    if ((Date.now() - this.lastSave) < 2000) return;
    this.lastSave = Date.now();

    if (d > 0) {
      ProgressManager.setPosition(this.currentSeries.id, this.currentEp, t, d);

      if (Auth.isLoggedIn && Auth.isLoggedIn()) {
        API.saveProgress(this.currentSeries.id, this.currentEp, Math.floor(t))
          .catch(() => {});
      }

      // se hai visto >=90%
      if (t / d >= 0.9) {
        ProgressManager.markWatched(this.currentSeries.id, this.currentEp);
        if (window.WatchPage) {
          WatchPage.updateEpisodeButtonState?.(this.currentSeries.id, this.currentEp);
          WatchPage.updateResumeButton?.(this.currentSeries);
        }
      }

      // Auto-skip negli ultimi 60 secondi
      const remaining = d - t;
      if (remaining <= 60 && remaining > 0) {
        this.showSkipUI(Math.ceil(remaining));
      } else {
        this.hideSkipUI();
      }
    }
  }

  static handleEnded() {
    if (!this.currentSeries || !this.currentEp || this.isChangingEpisode) return;

    // Evita chiamate multiple
    if (this._ending) return;
    this._ending = true;

    console.log('[Player] episode ended, auto-advancing');

    ProgressManager.markWatched(this.currentSeries.id, this.currentEp);
    ProgressManager.clearPosition(this.currentSeries.id, this.currentEp);

    if (window.WatchPage) {
      WatchPage.updateResumeButton?.(this.currentSeries);
    }

    const nextEp = this.currentEp + 1;
    const max = SeriesHelper.totalEpisodes(this.currentSeries);
    if (nextEp <= max) {
      this.move(nextEp);
    } else {
      // serie finita -> chiudi il player
      this.close();
    }

    // Reset flag dopo un breve delay
    setTimeout(() => { this._ending = false; }, 1000);
  }

  static handleKeyboard(e) {
    if (/(input|textarea|select)/i.test(e.target.tagName)) return;
    const video = document.getElementById('video');

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

  static showSkipUI(seconds) {
    if (this.skipUI) {
      this.updateSkipUI(seconds);
      return;
    }

    // Crea UI skip
    const overlay = document.getElementById('playerOverlay');
    const skipUI = document.createElement('div');
    skipUI.className = 'skip-ui';
    skipUI.innerHTML = `
      <div class="skip-content">
        <div class="skip-text">Prossimo episodio tra</div>
        <div class="skip-countdown">${seconds}</div>
        <button class="skip-btn" id="skipNowBtn">▶ Salta ora</button>
        <button class="skip-btn skip-cancel" id="skipCancelBtn">✕</button>
      </div>
    `;

    overlay.appendChild(skipUI);
    this.skipUI = skipUI;

    // Event listeners
    document.getElementById('skipNowBtn')?.addEventListener('click', () => {
      this.skipToNext();
    });

    document.getElementById('skipCancelBtn')?.addEventListener('click', () => {
      this.hideSkipUI();
    });

    // Timer per countdown
    this.skipTimer = setInterval(() => {
      const remaining = this.getRemainingTime();
      if (remaining > 0) {
        this.updateSkipUI(remaining);
      } else {
        this.skipToNext();
      }
    }, 1000);
  }

  static updateSkipUI(seconds) {
    const countdown = this.skipUI?.querySelector('.skip-countdown');
    if (countdown) {
      countdown.textContent = seconds;
    }
  }

  static hideSkipUI() {
    if (this.skipTimer) {
      clearInterval(this.skipTimer);
      this.skipTimer = null;
    }
    if (this.skipUI) {
      this.skipUI.remove();
      this.skipUI = null;
    }
  }

  static getRemainingTime() {
    const video = document.getElementById('video');
    if (!video || !video.duration) return 0;
    return Math.ceil(video.duration - video.currentTime);
  }

  static skipToNext() {
    this.hideSkipUI();
    const nextEp = (this.currentEp || 1) + 1;
    const max = this.currentSeries ? SeriesHelper.totalEpisodes(this.currentSeries) : 0;
    if (nextEp <= max) {
      this.move(nextEp);
    } else {
      this.close();
    }
  }

  static isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  static isFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
  }

  static async toggleFullscreen() {
    const video = document.getElementById('video');
    const container = document.getElementById('playerOverlay');
    try {
      if (this.isFullscreen()) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.msExitFullscreen) document.msExitFullscreen();
      } else {
        if (video && typeof video.webkitEnterFullscreen === 'function' && this.isIOS()) {
          video.webkitEnterFullscreen();
        } else if (container && container.requestFullscreen) {
          await container.requestFullscreen();
        } else if (video && video.requestFullscreen) {
          await video.requestFullscreen();
        } else if (video && typeof video.webkitRequestFullscreen === 'function') {
          video.webkitRequestFullscreen();
        }
      }
    } catch (e) {
      console.warn('[Player] toggleFullscreen error', e);
    }
  }

  static async togglePiP() {
    try {
      const video = document.getElementById('video');
      if (!video) return;
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        return;
      }
      if ('pictureInPictureEnabled' in document && typeof video.requestPictureInPicture === 'function') {
        if (video.paused) await video.play().catch(() => {});
        await video.requestPictureInPicture();
      }
    } catch (e) {
      console.warn('[Player] togglePiP error', e);
    }
  }
}

// 👇 QUESTO È IL PEZZO CRITICO 👇
// Forza l'oggetto Player a diventare globale, SEMPRE.
// Funziona anche se lo script è type="module".
window.Player = Player;

// inizializza i listener del player
Player.init?.();
