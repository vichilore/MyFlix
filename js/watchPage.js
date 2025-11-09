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
  
  static loadSeries(seriesObj) {
    if (!seriesObj) return;
    this.currentSeries = seriesObj;

    UIManager.showWatch();
    this.updateHeader(seriesObj);
    this.renderSeasons(seriesObj); // <- renderSeasons chiama updateResumeButton()
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
      const bar = document.createElement('div');
      bar.className = 'iptv-season-bar';
      picker.appendChild(bar);

      series.seasons.forEach((s, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'iptv-season-btn' + (idx === this.currentSeasonIndex ? ' active' : '');
        const label = (s.title && s.title.trim()) ? s.title : `Stagione ${idx + 1}`;
        btn.textContent = label;
        btn.addEventListener('click', () => {
          if (this.currentSeasonIndex === idx) return;
          this.currentSeasonIndex = idx;
          this.renderSeasons(series);
        });
        bar.appendChild(btn);
      });
    } else {
      const bar = document.createElement('div');
      bar.className = 'iptv-season-bar';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'iptv-season-btn active';
      btn.textContent = 'Tutti gli episodi';
      bar.appendChild(btn);
      picker.appendChild(bar);
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
  let resumeSeconds = 0;

  if (progress?.positions) {
    // prendiamo tutti gli episodi in cui NON sei già praticamente alla fine
    const entries = Object.entries(progress.positions).filter(([epNum, p]) =>
      p &&
      typeof p.t === 'number' &&
      typeof p.d === 'number' &&
      p.t < (p.d - 10) // se mancano più di ~10s alla fine, è riprendibile
    );

    if (entries.length) {
      // ordina per timestamp più recente
      entries.sort((a, b) => (b[1].ts || 0) - (a[1].ts || 0));
      resumeEp = parseInt(entries[0][0], 10);
      resumeSeconds = entries[0][1].t || 0;
    }
  }

  // fallback: se non ho trovato sopra, prova l'ultimo episodio noto
  if (!resumeEp && progress?.lastEpisode) {
    const lp = progress.positions?.[progress.lastEpisode];
    if (lp && lp.t && lp.d && lp.t < lp.d - 10) {
      resumeEp = progress.lastEpisode;
      resumeSeconds = lp.t || 0;
    }
  }

 if (resumeEp) {
  btn.style.display = 'inline-flex';
  btn.textContent = `▶ Riprendi episodio ${String(resumeEp).padStart(2, '0')}`;

  // usa UIManager.goWatch così:
  // - montiamo la pagina
  // - apriamo il player
  // - saltiamo al timestamp salvato
  btn.onclick = () => {
    UIManager.goWatch(series.id, resumeEp, resumeSeconds);
  };
} else {
  btn.style.display = 'none';
  btn.onclick = null;
}
  }

  static updateEpisodeButtonState(seriesId, ep) {
    const list = $('#episodeList');
    const btn = list.querySelector(`.episode-btn[data-ep="${ep}"]`);
    if (btn) btn.classList.add('watched');
  }
}

window.WatchPage = WatchPage;
