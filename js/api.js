// js/api.js
// Wrapper per tutte le chiamate al backend (signup, login, progress, ecc.)

const API = (() => {

    const FALLBACK_URL = "https://itanime-api.onrender.com";
    
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
    try {
      const data = await authedRequest("GET", "/profiles/me");
      return normalizeProfile(data);
    } catch(e) {
      // fallback a /me per backend che non espone /profiles/me
      const data = await authedRequest("GET", "/me");
      return normalizeProfile(data);
    }
  }

  async function listMyProfiles() {
    try {
      const data = await authedRequest("GET", "/profiles?owner=me");
      return normalizeProfileList(data);
    } catch(e) {
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

  return {
    signup,
    login,
    getMe,
    getCurrentProfile,
    listMyProfiles,
    switchCurrentProfile,
    setPublicActivity,
    saveProgress,
    getProgress
  };
})();
