// js/api.js
// Tutte le chiamate fetch verso il server Express/Supabase

const API = (() => {
  // fallback: se CONFIG non è definito (perché config.js non è caricato),
  // usiamo localhost di default così il codice non esplode
  const BASE_URL = (window.CONFIG && window.CONFIG.API_BASE_URL) || "http://localhost:8080";

  async function authedRequest(method, path, body) {
    const headers = { "Content-Type": "application/json" };

    const token = Auth.getToken();
    if (token) {
      headers["Authorization"] = "Bearer " + token;
    } else {
      throw new Error("Not authenticated");
    }

    const res = await fetch(BASE_URL + path, {
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
    const res = await fetch(BASE_URL + "/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, pin, avatarUrl })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Signup failed");
    return data;
  }

  async function login(username, pin) {
    const res = await fetch(BASE_URL + "/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, pin })
    });
    const data = await res.json();
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
