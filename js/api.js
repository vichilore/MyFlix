// js/api.js
// Wrapper per tutte le chiamate al backend (signup, login, progress, ecc.)

const API = (() => {

    const FALLBACK_URL = "https://itanime.onrender.com";
    
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
    setPublicActivity,
    saveProgress,
    getProgress
  };
})();
