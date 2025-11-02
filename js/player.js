// js/player.js

class Player {
  static currentSeries = null;
  static currentEp = null;
  static lastSave = 0;
  static skipTimer = null;
  static skipUI = null;
  static isChangingEpisode = false;

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

    // salvataggio avanzamento
    video.addEventListener('timeupdate', () => this.handleTimeUpdate());
    video.addEventListener('ended',      () => this.handleEnded());

    // sync con WatchTogether se presente
    video.addEventListener('play',   () => { if (window.WatchTogether) WatchTogether.broadcastState?.(); });
    video.addEventListener('pause',  () => { if (window.WatchTogether) WatchTogether.broadcastState?.(); });
    video.addEventListener('seeked', () => { if (window.WatchTogether) WatchTogether.broadcastState?.(); });

    // tastiera
    overlay.addEventListener('keydown', (e) => this.handleKeyboard(e));

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
}

// 👇 QUESTO È IL PEZZO CRITICO 👇
// Forza l'oggetto Player a diventare globale, SEMPRE.
// Funziona anche se lo script è type="module".
window.Player = Player;

// inizializza i listener del player
Player.init?.();
