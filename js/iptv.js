// js/iptv.js
// Catalogo "Film / Serie Italia" basato su TMDB + VixSrc

(function () {
  const TMDB_BASE      = "https://api.themoviedb.org/3";
  const TMDB_BASE_V4   = "https://api.themoviedb.org/4";
  const TMDB_V4_TOKEN  = window.CONFIG && window.CONFIG.TMDB_V4_TOKEN;
  const TMDB_V4_ACCOUNT_ID = window.CONFIG && window.CONFIG.TMDB_V4_ACCOUNT_ID;

  if (!TMDB_V4_TOKEN) {
    console.warn("[IPTV] TMDB_V4_TOKEN non configurato in config.js");
  }

  async function tmdbFetch(path, params = {}) {
    if (!TMDB_V4_TOKEN) {
      throw new Error("TMDB_V4_TOKEN mancante in window.CONFIG");
    }

  const url = new URL(TMDB_BASE + path);

  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") {
      url.searchParams.set(k, v);
    }
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${TMDB_V4_TOKEN}`,
      "Content-Type": "application/json;charset=utf-8"
    }
  });

  if (!res.ok) {
    throw new Error("TMDB HTTP " + res.status);
  }
  return res.json();
}

// 👇 nuova: fetch v4 per endpoint tipo /4/account/...
async function tmdbFetchV4(path, params = {}) {
  if (!TMDB_V4_TOKEN) {
    throw new Error("TMDB_V4_TOKEN mancante in window.CONFIG");
  }

  const url = new URL(TMDB_BASE_V4 + path);

  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") {
      url.searchParams.set(k, v);
    }
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${TMDB_V4_TOKEN}`,
      "Content-Type": "application/json;charset=utf-8"
    }
  });

  if (!res.ok) {
    throw new Error("TMDB V4 HTTP " + res.status);
  }
  return res.json();
}

  // Dettaglio singolo film per ID
async function loadMovieById(id) {
  const data = await tmdbFetch(`/movie/${id}`, {
    language: "it-IT"
  });

  // riuso mapMovie così mantieni la stessa struttura (url vixsrc, poster, ecc.)
  return mapMovie(data);
}

  // --- Normalizzatori ---

  function mapMovie(m) {
  const title =
    m.title ||
    m.original_title ||
    "Senza titolo";

  const year = (m.release_date || "").slice(0, 4) || "";
  const poster = m.poster_path
    ? `https://image.tmdb.org/t/p/w342${m.poster_path}`
    : "";
  const backdrop = m.backdrop_path
    ? `https://image.tmdb.org/t/p/w780${m.backdrop_path}`
    : "";

  const url = `https://vixsrc.to/movie/${m.id}?autoplay=true&primaryColor=B20710&lang=it`;

  return {
    id: m.id,
    title,
    group: year || "Film",
    url,
    poster,
    backdrop,
    overview: m.overview || "",
    year,
    rating: m.vote_average || 0
  };
}

  function mapSeries(tv) {
  const title =
    tv.name ||
    tv.original_name ||
    "Senza titolo";

  const year = (tv.first_air_date || "").slice(0, 4) || "";
  const poster = tv.poster_path
    ? `https://image.tmdb.org/t/p/w342${tv.poster_path}`
    : "";
  const backdrop = tv.backdrop_path
    ? `https://image.tmdb.org/t/p/w780${tv.backdrop_path}`
    : "";

  const genres = Array.isArray(tv.genres) && tv.genres.length
    ? tv.genres.map(g => g.name).filter(Boolean)
    : (Array.isArray(tv.genre_names) ? tv.genre_names : []);

  const runtimeRaw = Array.isArray(tv.episode_run_time) && tv.episode_run_time.length
    ? tv.episode_run_time[0]
    : tv.episode_run_time;

  const seasons = Array.isArray(tv.seasons)
    ? tv.seasons
        .map(season => ({
          season_number: typeof season.season_number === "number"
            ? season.season_number
            : Number(season.season_number),
          name: season.name || "",
          episode_count: typeof season.episode_count === "number"
            ? season.episode_count
            : typeof season.episodes === "number"
              ? season.episodes
              : 0,
          air_date: season.air_date || ""
        }))
        .filter(season => Number.isFinite(season.season_number))
    : [];

  // default: stagione 1 episodio 1
  const url = `https://vixsrc.to/tv/${tv.id}/1/1?autoplay=true&primaryColor=B20710&lang=it`;

  return {
    id: tv.id,
    title,
    group: year || "Serie TV",
    url,
    poster,
    backdrop,
    overview: tv.overview || "",
    year,
    rating: tv.vote_average || 0,
    genres,
    runtime: runtimeRaw || null,
    seasons
  };
}

async function loadSerieById(id) {
  const data = await tmdbFetch(`/tv/${id}`, {
    language: "it-IT"
  });

  return mapSeries(data);
}


// Lista "Recommended Movies" per il tuo account TMDb
async function loadRecommendedMovies(maxPages = 3) {
  if (!TMDB_V4_ACCOUNT_ID) {
    throw new Error("TMDB_V4_ACCOUNT_ID mancante in window.CONFIG");
  }

  const allResults = [];

  for (let page = 1; page <= maxPages; page++) {
    const data = await tmdbFetchV4(
      `/account/${TMDB_V4_ACCOUNT_ID}/movie/recommendations`,
      {
        page,
        language: "it-IT"
      }
    );

    if (!data.results || !data.results.length) break;
    allResults.push(...data.results);
  }

  return allResults.map(mapMovie);
}



  async function loadItalianMovies() {
  const allResults = [];
  const MAX_PAGES = 100; // 👈 QUI decidi quante pagine vuoi

  for (let page = 1; page <= MAX_PAGES; page++) {
    const data = await tmdbFetch("/discover/movie", {
      language: "it-IT",
      sort_by: "popularity.desc",
      include_adult: "false",
      page
    });

    if (!data.results || !data.results.length) break; // se TMDb non ha più roba, fermati
    allResults.push(...data.results);
  }

  return allResults.map(mapMovie);
}

// async function loadManyMoviesItalianiPerAnno(year, maxPages = 50) {
//   const all = [];

//   for (let page = 1; page <= maxPages; page++) {
//     const data = await tmdbFetch("/discover/movie", {
//       language: "it-IT",
//       sort_by: "popularity.desc",
//       include_adult: "false",
//       with_original_language: "it",
//       primary_release_year: year,
//       page
//     });

//     if (!data.results || !data.results.length) break;
//     all.push(...data.results);
//   }

//   return all.map(mapMovie);
// }

async function searchMovies(query, page = 1) {
  if (!query || !query.trim()) return [];

  const data = await tmdbFetch("/search/movie", {
    query,
    language: "it-IT",
    include_adult: "false",
    page
  });

  return (data.results || []).map(mapMovie);
}

async function loadHugeItalianCatalog() {
  const years = [2024, 2023, 2022, 2021, 2020]; // esempio
  const all = [];

  for (const year of years) {
    const data = await tmdbFetch("/discover/movie", {
      language: "it-IT",
      sort_by: "popularity.desc",
      include_adult: "false",
      with_original_language: "it",
      primary_release_year: year,
      page: 1
    });

    if (!data.results || !data.results.length) continue;
    all.push(...data.results);
  }

  return all.map(mapMovie); // 👈 importante: che ritorni oggetti "movie" come gli altri loader
}


  async function loadItalianSeries() {
  const allResults = [];
  const MAX_PAGES = 3; // o quello che vuoi

  for (let page = 1; page <= MAX_PAGES; page++) {
    const data = await tmdbFetch("/discover/tv", {
      language: "it-IT",
      sort_by: "popularity.desc",
      include_adult: "false",
      page
    });

    if (!data.results || !data.results.length) break;
    allResults.push(...data.results);
  }

  return allResults.map(mapSeries);
}


// Recommended TV shows per il tuo account TMDb (v4)
async function loadRecommendedSeries(maxPages = 2) {
  if (!TMDB_V4_ACCOUNT_ID) {
    throw new Error("TMDB_V4_ACCOUNT_ID mancante in window.CONFIG");
  }

  const allResults = [];

  for (let page = 1; page <= maxPages; page++) {
    const data = await tmdbFetchV4(
      `/account/${TMDB_V4_ACCOUNT_ID}/tv/recommendations`,
      {
        page,
        language: "it-IT"
      }
    );

    if (!data.results || !data.results.length) break;
    allResults.push(...data.results);
  }

  return allResults.map(mapSeries);
}

// Ricerca serie diretta su TMDb
async function searchSeries(query, page = 1) {
  if (!query || !query.trim()) return [];

  const data = await tmdbFetch("/search/tv", {
    query,
    language: "it-IT",
    include_adult: "false",
    page
  });

  return (data.results || []).map(mapSeries);
}

// Episodi di una stagione di una serie
async function loadSerieSeasonEpisodes(serieId, seasonNumber = 1) {
  const data = await tmdbFetch(`/tv/${serieId}/season/${seasonNumber}`, {
    language: "it-IT"
  });

  return (data.episodes || []).map(ep => {
    const still = ep.still_path
      ? `https://image.tmdb.org/t/p/w342${ep.still_path}`
      : "";

    return {
      episode_number: ep.episode_number,
      title: ep.name || `Episodio ${ep.episode_number}`,
      overview: ep.overview || "",
      still
    };
  });
}

  // --- API pubblica esposta a routes-iptv.js ---

  window.IPTV = {
  async getItalianCatalog() {
    const [movies, series] = await Promise.all([
      loadItalianMovies(),
      loadItalianSeries().catch(() => [])
    ]);

    console.log("[IPTV] Catalogo TMDB", {
      movies: movies.length,
      series: series.length
    });

    return { movies, series };
  },

  loadRecommendedMovies, loadHugeItalianCatalog, searchMovies,
  // 👇 NUOVO: dettaglio singolo film
  getMovieById: loadMovieById,

    // serie
  loadRecommendedSeries,
  searchSeries,
  getSerieById: loadSerieById,
  getSerieSeasonEpisodes: loadSerieSeasonEpisodes,
};
})();
