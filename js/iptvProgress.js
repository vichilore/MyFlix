// js/iptvProgress.js

(function () {
  const STORAGE_KEY = 'iptv-progress-v1';

  function loadRaw() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { movies: {}, series: {} };
      const data = JSON.parse(raw);
      return {
        movies: data.movies || {},
        series: data.series || {}
      };
    } catch (e) {
      console.warn('[IPTVProgress] load error', e);
      return { movies: {}, series: {} };
    }
  }

  function saveRaw(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('[IPTVProgress] save error', e);
    }
  }

  function nowTs() {
    return Date.now();
  }

  function pickMovieInfo(movie) {
    if (!movie) return null;
    const id = movie.id;
    if (id == null) return null;

    return {
      id: String(id),
      title: movie.title || movie.name || 'Senza titolo',
      image:
        movie.poster ||
        movie.backdrop ||
        movie.poster_path ||
        movie.backdrop_path ||
        '',
      year:
        movie.year ||
        (movie.release_date ? String(movie.release_date).slice(0, 4) : ''),
      rating: movie.rating || movie.vote_average || 0,
      kind: 'movie'
    };
  }

  function pickShowInfo(show) {
    if (!show) return null;
    const id = show.id;
    if (id == null) return null;

    return {
      id: String(id),
      title: show.name || show.title || 'Senza titolo',
      image:
        show.poster ||
        show.backdrop ||
        show.poster_path ||
        show.backdrop_path ||
        '',
      year:
        show.year ||
        (show.first_air_date ? String(show.first_air_date).slice(0, 4) : ''),
      rating: show.rating || show.vote_average || 0,
      kind: 'tv'
    };
  }

  const IPTVProgress = {
    // -------- FILM --------
    saveMovieProgress(movie, seconds = 0, duration = 0) {
      const info = pickMovieInfo(movie);
      if (!info) return;

      const data = loadRaw();
      data.movies[info.id] = {
        ...info,
        seconds: Math.max(0, Number(seconds) || 0),
        duration: Math.max(0, Number(duration) || 0),
        updatedAt: nowTs()
      };
      saveRaw(data);
    },

    // -------- SERIE / EPISODI --------
    // show = oggetto TMDb della serie
    // seasonNumber = numero stagione (1,2,...)
    // episodeNumber = numero episodio (1,2,...)
    saveEpisodeProgress(show, seasonNumber, episodeNumber, seconds = 0, duration = 0) {
      const info = pickShowInfo(show);
      if (!info) return;

      const data = loadRaw();
      data.series[info.id] = {
        ...info,
        season: seasonNumber || 1,
        episode: episodeNumber || 1,
        seconds: Math.max(0, Number(seconds) || 0),
        duration: Math.max(0, Number(duration) || 0),
        updatedAt: nowTs()
      };
      saveRaw(data);
    },

    // -------- LETTURA COMBINATA (film + serie) --------
    getAllResume(limit = 20) {
      const data = loadRaw();
      const arr = [];

      Object.values(data.movies || {}).forEach(m => arr.push(m));
      Object.values(data.series || {}).forEach(s => arr.push(s));

      arr.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

      if (limit && limit > 0) {
        return arr.slice(0, limit);
      }
      return arr;
    },

    // alias, nel caso la usassi da qualche parte
    getRecent(limit = 20) {
      return this.getAllResume(limit);
    }
  };

  window.IPTVProgress = IPTVProgress;
})();


