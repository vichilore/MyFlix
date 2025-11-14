// js/watchPage.js
class WatchPage {
  static currentSeries = null;
  static currentSeasonIndex = 0;

  static open(series, fromAll = false) {
    UIManager.showWatch();
    this.currentSeries = series;
    this.updateHeader(series);
    this.renderSeasons(series);
    this.renderDetails(series);

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
    this.renderDetails(seriesObj);
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
    this.renderDetails(series);
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

  static renderDetails(series) {
    const {
      watchHeroSummary,
      watchHeroMeta,
      watchHeroBadges,
      watchHeroMore,
      watchSynopsis,
      watchFormat,
      watchSeasons,
      watchEpisodes,
      watchLanguages,
      watchSources,
      watchTags,
      watchDetailsMore
    } = UIManager.elements;

    if (!series) {
      if (watchHeroSummary) {
        watchHeroSummary.textContent = 'Seleziona una serie per leggere la sinossi e iniziare la visione.';
      }
      if (watchHeroMeta) watchHeroMeta.innerHTML = '';
      if (watchHeroBadges) watchHeroBadges.innerHTML = '';
      if (watchHeroMore) {
        watchHeroMore.disabled = true;
        watchHeroMore.setAttribute('aria-expanded', 'false');
      }
      if (watchSynopsis) watchSynopsis.textContent = 'Seleziona una serie per vedere sinossi, lingue e altri dettagli.';
      if (watchFormat) watchFormat.textContent = '—';
      if (watchSeasons) watchSeasons.textContent = '—';
      if (watchEpisodes) watchEpisodes.textContent = '—';
      if (watchLanguages) watchLanguages.textContent = '—';
      if (watchSources) watchSources.textContent = '—';
      if (watchTags) watchTags.innerHTML = '';
      if (watchDetailsMore) {
        watchDetailsMore.disabled = true;
        watchDetailsMore.setAttribute('aria-expanded', 'false');
      }
      return;
    }

    const synopsis = series.description || series.overview || series.synopsis || series.subtitle || '';
    const normalizedSynopsis = typeof synopsis === 'string' ? synopsis.trim() : '';
    const shortSynopsis = normalizedSynopsis.length > 380
      ? `${normalizedSynopsis.slice(0, 377).trim()}…`
      : normalizedSynopsis;
    if (watchSynopsis) {
      watchSynopsis.textContent = normalizedSynopsis || 'Nessuna sinossi disponibile per questa serie.';
    }
    if (watchHeroSummary) {
      watchHeroSummary.textContent = shortSynopsis || 'Nessuna sinossi disponibile per questa serie.';
    }

    const format = SeriesHelper.guessFormat(series);
    const formatLabel = (
      format === 'series' ? 'Serie TV' :
      format === 'movie' ? 'Film / Special' :
      format === 'special' ? 'Special' :
      '—'
    );
    if (watchFormat) watchFormat.textContent = formatLabel;

    const seasonCount = SeriesHelper.seasonCount(series);
    const totalEpisodes = SeriesHelper.totalEpisodes(series);

    if (watchSeasons) {
      watchSeasons.textContent = seasonCount ? String(seasonCount) : '—';
    }

    if (watchEpisodes) {
      watchEpisodes.textContent = totalEpisodes ? String(totalEpisodes) : '—';
    }

    const langs = SeriesHelper.listLanguages(series);
    if (watchLanguages) {
      watchLanguages.textContent = langs.length ? langs.join(' • ') : '—';
    }

    if (watchHeroMeta) {
      const metaItems = [];
      if (formatLabel && formatLabel !== '—') metaItems.push(formatLabel);
      if (series.year) metaItems.push(String(series.year));
      if (seasonCount > 1) {
        metaItems.push(`${seasonCount} stagioni`);
      } else if (seasonCount === 1 && format === 'series') {
        metaItems.push('1 stagione');
      }
      if (totalEpisodes) {
        const label = totalEpisodes === 1 ? '1 episodio' : `${totalEpisodes} episodi`;
        if (!metaItems.includes(label)) metaItems.push(label);
      }

      watchHeroMeta.innerHTML = '';
      if (metaItems.length) {
        metaItems.forEach(text => {
          const chip = document.createElement('span');
          chip.className = 'watch-hero-meta__item';
          chip.textContent = text;
          watchHeroMeta.appendChild(chip);
        });
      }
    }

    if (watchHeroBadges) {
      watchHeroBadges.innerHTML = '';
      if (langs.length) {
        langs.forEach(lang => {
          const badge = document.createElement('span');
          badge.className = 'watch-hero-badge';
          badge.textContent = lang;
          watchHeroBadges.appendChild(badge);
        });
      } else {
        const badge = document.createElement('span');
        badge.className = 'watch-hero-badge is-muted';
        badge.textContent = 'Lingua non specificata';
        watchHeroBadges.appendChild(badge);
      }
    }

    if (watchSources) {
      const hosts = SeriesHelper.collectHosts(series);
      watchSources.textContent = hosts.length ? hosts.join(' • ') : 'Server dedicato';
    }

    if (watchTags) {
      const tags = new Set();
      if (Array.isArray(series.genres)) {
        series.genres.forEach(g => g && tags.add(g));
      }
      if (Array.isArray(series.tags)) {
        series.tags.forEach(t => t && tags.add(t));
      }
      if (series.year) tags.add(String(series.year));
      if (formatLabel && formatLabel !== '—') tags.add(formatLabel);

      watchTags.innerHTML = '';
      if (tags.size) {
        tags.forEach(tag => {
          const chip = document.createElement('span');
          chip.className = 'watch-tag';
          chip.textContent = tag;
          watchTags.appendChild(chip);
        });
      }
    }

    const hasDetails = typeof ContentDetails !== 'undefined' && typeof ContentDetails.show === 'function';

    if (watchDetailsMore) {
      watchDetailsMore.disabled = !hasDetails;
      watchDetailsMore.setAttribute('aria-expanded', 'false');
    }

    if (watchHeroMore) {
      watchHeroMore.disabled = !hasDetails;
      watchHeroMore.setAttribute('aria-expanded', 'false');
    }

    if (hasDetails) {
      const openDetails = () => {
        ContentDetails.show(series);
        if (watchDetailsMore) {
          watchDetailsMore.setAttribute('aria-expanded', 'true');
        }
        if (watchHeroMore) {
          watchHeroMore.setAttribute('aria-expanded', 'true');
        }
      };

      if (watchDetailsMore) {
        watchDetailsMore.onclick = openDetails;
      }

      if (watchHeroMore) {
        watchHeroMore.onclick = openDetails;
      }
    } else {
      if (watchDetailsMore) watchDetailsMore.onclick = null;
      if (watchHeroMore) watchHeroMore.onclick = null;
    }
  }
}

window.WatchPage = WatchPage;
