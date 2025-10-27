// js/watchPage.js
class WatchPage {
  static currentSeries = null;
  static currentSeasonIndex = 0;

  static open(series, fromAll = false) {
    UIManager.showWatch();
    this.currentSeries = series;
    this.updateHeader(series);
    this.renderSeasons(series);

    if (fromAll) {
      requestAnimationFrame(() => {
        const cardElem = document.querySelector(`[data-id="${series.id}"]`);
        if (cardElem) {
          cardElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }
  }

  static updateHeader(series) {
    const banner = $('#watchBanner');
    const title  = $('#watchTitle');

    const currentSeason = SeriesHelper.isSeasonal(series)
      ? series.seasons?.[this.currentSeasonIndex]
      : null;

    banner.src = currentSeason?.image || series.image || '';
    title.textContent = series.title || 'Titolo';
  }

  static renderSeasons(series) {
    this.buildSeasonPicker(series);
    this.renderEpisodeButtons(series);
    this.updateResumeButton(series);
  }

  static buildSeasonPicker(series) {
    const picker = $('#seasonPicker');
    picker.innerHTML = '';

    if (SeriesHelper.isSeasonal(series)) {
      series.seasons.forEach((s, idx) => {
        const pill = document.createElement('button');
        pill.className = 'season-pill' + (idx === this.currentSeasonIndex ? ' active' : '');
        pill.textContent = s.title || `Stagione ${idx + 1}`;
        pill.onclick = () => {
          this.currentSeasonIndex = idx;
          this.renderSeasons(series);
        };
        picker.appendChild(pill);
      });
    } else {
      this.currentSeasonIndex = 0;
      const pill = document.createElement('button');
      pill.className = 'season-pill active';
      pill.textContent = 'Tutti gli episodi';
      picker.appendChild(pill);
    }

    this.updateHeader(series);
  }

  static renderEpisodeButtons(series) {
    const list = $('#episodeList');
    list.innerHTML = '';

    let startAbs = 1;

    if (SeriesHelper.isSeasonal(series)) {
      for (let i = 0; i < this.currentSeasonIndex; i++) {
        startAbs += series.seasons[i].episodes || 0;
      }
      const count = series.seasons[this.currentSeasonIndex].episodes || 0;

      for (let i = 1; i <= count; i++) {
        const absEp = startAbs + (i - 1);
        this.createEpisodeButton(series, absEp, i, list);
      }
    } else {
      const count = SeriesHelper.totalEpisodes(series);
      for (let i = 1; i <= count; i++) {
        this.createEpisodeButton(series, i, i, list);
      }
    }
  }

  static createEpisodeButton(series, absEp, label, container) {
    const btn = document.createElement('button');
    btn.className = 'episode-btn';
    btn.dataset.ep = absEp;
    btn.textContent = String(label).padStart(3, '0');

    if (ProgressManager.isWatched(series.id, absEp)) {
      btn.classList.add('watched');
    }

    btn.onclick = () => Player.play(series, absEp);
    container.appendChild(btn);
  }

  static updateResumeButton(series) {
    const btn = $('#watchResumeBtn');
    if (!btn || !series) return;

    const progress = ProgressManager.load(series.id);
    let resumeEp = 0;

    if (progress?.positions) {
      const entries = Object.entries(progress.positions).filter(([n, p]) =>
        p && typeof p.t === 'number' && typeof p.d === 'number' && p.t < (p.d - 10)
      );
      if (entries.length) {
        entries.sort((a, b) => (b[1].ts || 0) - (a[1].ts || 0));
        resumeEp = parseInt(entries[0][0], 10);
      }
    }

    if (!resumeEp && progress?.lastEpisode) {
      const lp = progress.positions?.[progress.lastEpisode];
      if (lp && lp.t && lp.d && lp.t < lp.d - 10) {
        resumeEp = progress.lastEpisode;
      }
    }

    if (resumeEp) {
      btn.style.display = 'inline-flex';
      btn.textContent = `▶ Riprendi episodio ${String(resumeEp).padStart(2, '0')}`;
      btn.onclick = () => Player.play(series, resumeEp);
    } else {
      btn.style.display = 'none';
    }
  }

  static updateEpisodeButtonState(seriesId, ep) {
    const list = $('#episodeList');
    const btn = list.querySelector(`.episode-btn[data-ep="${ep}"]`);
    if (btn) btn.classList.add('watched');
  }
}
