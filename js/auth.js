// js/auth.js

const Auth = (() => {
  const TOKEN_KEY = "vichi_token";
  const USER_KEY  = "vichi_user";

  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || null;
  }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || "null");
    } catch {
      return null;
    }
  }

  function isLoggedIn() {
    return !!getToken();
  }

  function setSession({ token, user }) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (user)  localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  async function doSignup(username, pin, avatarUrl) {
    const data = await API.signup(username, pin, avatarUrl);
    setSession(data);
    return data.user;
  }

  async function doLogin(username, pin) {
    const data = await API.login(username, pin);
    setSession(data);
    return data.user;
  }

  function logout() {
    clearSession();
    location.reload();
  }

  return {
    getToken,
    getUser,
    isLoggedIn,
    setSession,
    doSignup,
    doLogin,
    logout
  };
})();
