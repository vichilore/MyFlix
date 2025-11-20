// js/api.js
// Wrapper per tutte le chiamate al backend (signup, login, progress, ecc.)

const API = (() => {

  const FALLBACK_URL = "https://itanime-api.onrender.com";
  const TMDB_BASE_URL = "https://api.themoviedb.org/3";
  const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

  // Invece di fissare BASE_URL una volta sola, lo calcoliamo ogni volta.
  function getBaseUrl() {
    if (window.CONFIG && window.CONFIG.API_BASE_URL) {
      return window.CONFIG.API_BASE_URL;
    }
    // fallback di emergenza se proprio non c'è CONFIG
    return FALLBACK_URL;
  }

  async function authedRequest(method, path, body) {
    const headers = { "Content-Type": "application/json" };

    const token = Auth.getToken();
    if (token) {
      headers["Authorization"] = "Bearer " + token;
    } else {
      throw new Error("Not authenticated");
    }

    const res = await fetch(getBaseUrl() + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }

  function normalizeProfile(payload) {
    if (!payload) return null;

    if (Array.isArray(payload)) {
      return payload.length ? normalizeProfile(payload[0]) : null;
    }

    if (payload.profile && payload.profile !== payload) {
      return normalizeProfile(payload.profile);
    }

    if (payload.user && payload.user !== payload) {
      return normalizeProfile(payload.user);
    }

    if (payload.current_profile && payload.current_profile !== payload) {
      return normalizeProfile(payload.current_profile);
    }

    if (payload.currentProfile && payload.currentProfile !== payload) {
      return normalizeProfile(payload.currentProfile);
    }

    if (payload.data && payload.data !== payload) {
      return normalizeProfile(payload.data);
    }

    if (Array.isArray(payload.profiles)) {
      const first = payload.profiles[0];
      return first ? normalizeProfile(first) : null;
    }

    const id = payload.id ?? payload.profile_id ?? payload.user_id ?? null;
    const displayName = payload.displayName
      ?? payload.display_name
      ?? payload.username
      ?? payload.name
      ?? null;
    const avatarUrl = payload.avatarUrl
      ?? payload.avatar_url
      ?? payload.avatar
      ?? payload.image_url
      ?? null;
    const publicActivity = payload.publicActivity ?? payload.public_activity;

    const normalized = { id, displayName, avatarUrl };
    if (publicActivity !== undefined) {
      normalized.publicActivity = publicActivity;
    }
    return normalized;
  }

  function normalizeProfileList(payload) {
    if (!payload) return [];

    if (Array.isArray(payload)) {
      return payload.map(normalizeProfile).filter(Boolean);
    }

    const candidates = [
      payload.profiles,
      payload.data && payload.data.profiles
    ];

    for (const list of candidates) {
      if (Array.isArray(list)) {
        return list.map(normalizeProfile).filter(Boolean);
      }
    }

    const single = normalizeProfile(payload);
    return single ? [single] : [];
  }

  // --- PROFILE ---
  async function getCurrentProfile() {
    if (Auth.getToken() === 'guest_token') {
      return { id: 'guest', displayName: 'Ospite', avatarUrl: 'https://via.placeholder.com/150?text=Guest' };
    }
    try {
      const data = await authedRequest("GET", "/profiles/me");
      return normalizeProfile(data);
    } catch (e) {
      // fallback a /me per backend che non espone /profiles/me
      const data = await authedRequest("GET", "/me");
      return normalizeProfile(data);
    }
  }

  async function listMyProfiles() {
    if (Auth.getToken() === 'guest_token') return [];
    try {
      const data = await authedRequest("GET", "/profiles?owner=me");
      return normalizeProfileList(data);
    } catch (e) {
      try {
        const data = await authedRequest("GET", "/profiles");
        return normalizeProfileList(data);
      } catch {
        // se non supportato, ritorna profilo corrente come unica voce
        const me = await getCurrentProfile();
        return me ? [me] : [];
      }
    }
  }

  function switchCurrentProfile(profileId) {
    return authedRequest("PATCH", "/profiles/current", { profileId });
  }

  // --- AUTH ---

  async function signup(username, pin, avatarUrl) {
    const res = await fetch(getBaseUrl() + "/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, pin, avatarUrl })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Signup failed");
    return data;
  }

  async function login(username, pin) {
    const res = await fetch(getBaseUrl() + "/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, pin })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Login failed");
    return data;
  }

  function getMe() {
    return authedRequest("GET", "/me");
  }

  function setPublicActivity(isPublic) {
    return authedRequest("PATCH", "/me/public_activity", {
      public_activity: isPublic
    });
  }

  // --- WATCH PROGRESS SYNC ---

  function saveProgress(series_id, ep_number, seconds) {
    return authedRequest("POST", "/progress/save", {
      series_id, ep_number, seconds
    });
  }

  function getProgress() {
    return authedRequest("GET", "/progress/get");
  }

  // --- IPTV (vixsrc) real-time events/progress ---
  function saveIptvEvent(evt) {
    // Accept either {type:'PLAYER_EVENT', data:{...}} or just {event,currentTime,duration,video_id}
    const payload = evt && evt.type === 'PLAYER_EVENT' ? evt : { type: 'PLAYER_EVENT', data: evt };
    return authedRequest("POST", "/iptv/event", payload);
  }

  function getIptvPosition(video_id) {
    const v = String(video_id);
    return authedRequest("GET", "/iptv/position?video_id=" + encodeURIComponent(v));
  }

  function getIptvResume(limit = 20) {
    return authedRequest("GET", "/iptv/resume?limit=" + encodeURIComponent(limit));
  }

  function getTmdbConfig() {
    const cfg = window.CONFIG || {};
    const providers = cfg.TMDB_PROVIDERS || {};
    const defaults = cfg.TMDB_PROVIDER_DEFAULT_PARAMS || {};
    const token = cfg.TMDB_V4_TOKEN;
    if (!token) {
      throw new Error("TMDB_V4_TOKEN non configurato");
    }
    return { providers, defaults, token };
  }

  async function tmdbFetch(path, params = {}) {
    const { token } = getTmdbConfig();
    const url = new URL(TMDB_BASE_URL + path);

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    }

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json;charset=utf-8"
      }
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`TMDB HTTP ${res.status} ${text}`.trim());
    }

    return res.json();
  }

  function normalizeProviderItem(item, { fallbackLang = "IT" } = {}) {
    if (!item) return null;

    const title = item.title
      || item.name
      || item.original_title
      || item.original_name
      || "Senza titolo";

    const release = item.release_date || item.first_air_date || "";
    const year = release ? release.slice(0, 4) : "";
    const posterPath = item.poster_path || "";
    const backdropPath = item.backdrop_path || "";
    const kind = (item.media_type)
      ? item.media_type.toLowerCase()
      : item.first_air_date ? "tv" : "movie";

    const language = (item.original_language || fallbackLang || "IT").toUpperCase();

    return {
      id: item.id,
      title,
      image: posterPath
        ? `${TMDB_IMAGE_BASE}/w342${posterPath}`
        : backdropPath
          ? `${TMDB_IMAGE_BASE}/w342${backdropPath}`
          : "",
      backdrop: backdropPath
        ? `${TMDB_IMAGE_BASE}/w780${backdropPath}`
        : posterPath
          ? `${TMDB_IMAGE_BASE}/w780${posterPath}`
          : "",
      lang: language,
      overview: item.overview || "",
      rating: item.vote_average || 0,
      year,
      kind
    };
  }

  async function fetchProviderTop(providerId, options = {}) {
    const providerKey = String(providerId);
    const { providers, defaults } = getTmdbConfig();

    const config = providers[providerKey];
    if (!config) {
      throw new Error(`Configurazione TMDB mancante per provider ${providerKey}`);
    }

    const {
      endpoint: configEndpoint,
      params: configParams = {},
      maxPages: configMaxPages
    } = config;

    const endpoint = options.endpoint || configEndpoint || "/discover/tv";
    const maxPages = options.maxPages || configMaxPages || 2;

    const params = {
      ...defaults,
      ...configParams,
      ...options.params,
      with_watch_providers: options.params?.with_watch_providers || config.providerId || providerKey
    };

    if (Array.isArray(params.with_watch_providers)) {
      params.with_watch_providers = params.with_watch_providers.join("|");
    } else if (params.with_watch_providers != null) {
      params.with_watch_providers = String(params.with_watch_providers);
    }

    const fallbackLang = (() => {
      if (params.watch_region && typeof params.watch_region === "string") {
        return params.watch_region.toUpperCase();
      }
      if (defaults && typeof defaults.language === "string") {
        const parts = defaults.language.split("-");
        return (parts.pop() || parts[0] || "IT").toUpperCase();
      }
      return "IT";
    })();

    const allResults = [];
    for (let page = 1; page <= maxPages; page++) {
      const data = await tmdbFetch(endpoint, { ...params, page });
      if (!data || !Array.isArray(data.results) || !data.results.length) {
        break;
      }
      allResults.push(...data.results);
      if (page >= (data.total_pages || 0)) {
        break;
      }
    }

    const deduped = [];
    const seen = new Set();
    for (const result of allResults) {
      if (!result || result.id == null) continue;
      const id = String(result.id);
      if (seen.has(id)) continue;
      seen.add(id);
      const mapped = normalizeProviderItem(result, { fallbackLang });
      if (mapped) {
        deduped.push(mapped);
      }
    }

    return deduped;
  }

  return {
    signup,
    login,
    getMe,
    getCurrentProfile,
    listMyProfiles,
    switchCurrentProfile,
    setPublicActivity,
    saveProgress,
    getProgress,
    saveIptvEvent,
    getIptvPosition,
    getIptvResume,
    fetchProviderTop
  };
})();

if (typeof window !== 'undefined') {
  window.API = API;
}
