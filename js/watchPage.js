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
      // Create Netflix-style season picker
      picker.innerHTML = `
        <button class="season-nav" id="seasonPrev" aria-label="Stagione precedente">‹</button>
        <div class="season-container">
          <div class="season-pills" id="seasonPills"></div>
        </div>
        <button class="season-nav" id="seasonNext" aria-label="Prossima stagione">›</button>
        <div class="season-info" id="seasonInfo"></div>
      `;

      const pillsContainer = $('#seasonPills');
      const prevBtn = $('#seasonPrev');
      const nextBtn = $('#seasonNext');
      const seasonInfo = $('#seasonInfo');

      // Create season pills
      series.seasons.forEach((s, idx) => {
        const pill = document.createElement('button');
        pill.className = 'season-pill' + (idx === this.currentSeasonIndex ? ' active' : '');
        pill.textContent = s.title || `Stagione ${idx + 1}`;
        pill.setAttribute('aria-label', `Seleziona ${s.title || `stagione ${idx + 1}`}`);
        pill.onclick = () => {
          this.currentSeasonIndex = idx;
          this.renderSeasons(series);
        };
        pillsContainer.appendChild(pill);
      });

      // Add navigation functionality
      prevBtn.onclick = () => {
        if (this.currentSeasonIndex > 0) {
          this.currentSeasonIndex--;
          this.renderSeasons(series);
        }
      };

      nextBtn.onclick = () => {
        if (this.currentSeasonIndex < series.seasons.length - 1) {
          this.currentSeasonIndex++;
          this.renderSeasons(series);
        }
      };

      // Update navigation buttons state
      prevBtn.disabled = this.currentSeasonIndex === 0;
      nextBtn.disabled = this.currentSeasonIndex === series.seasons.length - 1;

      // Update season info
      const currentSeason = series.seasons[this.currentSeasonIndex];
      seasonInfo.textContent = `${currentSeason.episodes || 0} episodi`;

      // Add keyboard navigation
      picker.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' && !prevBtn.disabled) {
          prevBtn.click();
        } else if (e.key === 'ArrowRight' && !nextBtn.disabled) {
          nextBtn.click();
        }
      });

      // Make season picker focusable for keyboard navigation
      picker.setAttribute('tabindex', '0');
    } else {
      // Flat series structure
      picker.innerHTML = `
        <div class="season-container">
          <div class="season-pills">
            <button class="season-pill active">Tutti gli episodi</button>
          </div>
        </div>
      `;
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
  if (!resumeEp && progress?.lastEp) {
    const lp = progress.positions?.[progress.lastEp];
    if (lp && lp.t && lp.d && lp.t < lp.d - 10) {
      resumeEp = progress.lastEp;
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
