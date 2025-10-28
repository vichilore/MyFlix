// js/watchTogether.js
const WatchTogether = (() => {
  let roomId = null;
  let iAmCreator = false;
  let socket = null;
  let isConnected = false;

  function getWsUrl() {
    // Deriva l'URL WS dall'WATCH_BASE_URL: https -> wss, http -> ws, path /watch
    const base = (window.CONFIG && window.CONFIG.WATCH_BASE_URL) || 'https://itanime.onrender.com';
    try {
      const u = new URL(base);
      u.protocol = (u.protocol === 'https:') ? 'wss:' : 'ws:';
      u.pathname = '/watch';
      u.search = '';
      u.hash = '';
      return u.toString();
    } catch {
      return 'wss://itanime.onrender.com/watch';
    }
  }

  function ensureSocket() {
    if (socket && isConnected) return;
    const url = getWsUrl();
    socket = new WebSocket(url);

    socket.addEventListener('open', () => {
      console.log('[WT] open', url);
      isConnected = true;
      // se avevamo già una stanza scelta, ri-join
      if (roomId) {
        safeSend({ type: 'join-room', roomId });
      }
    });

    socket.addEventListener('close', () => {
      console.log('[WT] close');
      isConnected = false;
      // tentativo semplice di reconnect
      setTimeout(() => { try { ensureSocket(); } catch {} }, 2000);
    });

    socket.addEventListener('message', (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }
      console.log('[WT] msg', msg);
      if (msg.type === 'sync-state' && msg.state) {
        applySyncedState(msg.state);
      }
    });

    socket.addEventListener('error', (e) => {
      console.warn('[WT] error', e);
    });
  }

  function safeSend(obj) {
    try {
      if (socket && isConnected) socket.send(JSON.stringify(obj));
    } catch {}
  }

  function applySyncedState(state) {
    // state: { seriesId, epNumber, time, paused }
    try {
      if (typeof state.seriesId !== 'undefined' && typeof state.epNumber !== 'undefined') {
        // se episodio differente, apri quel contenuto
        const currentVideo = document.getElementById('video');
        const needOpen = !currentVideo || currentVideo.dataset?.seriesId != String(state.seriesId) || currentVideo.dataset?.epNumber != String(state.epNumber);
        if (needOpen && window.UIManager) {
          UIManager.goWatch(state.seriesId, state.epNumber, state.time || 0);
        }
      }
      const video = document.getElementById('video');
      if (video) {
        if (typeof state.time === 'number' && Math.abs((video.currentTime || 0) - state.time) > 0.75) {
          video.currentTime = state.time;
        }
        if (state.paused) {
          video.pause?.();
        } else {
          video.play?.().catch(()=>{});
        }
      }
    } catch {}
  }

  function initUI() {
    const wtSection     = document.getElementById("wt");
    const wtNavBtn      = document.getElementById("wtHomeBar");
    const wtCreateBtn   = document.getElementById("wtCreateBtn");
    const wtJoinBtn     = document.getElementById("wtJoinBtn");
    const wtLeaveBtn    = document.getElementById("wtLeaveBtn");
    const wtGoWatchBtn  = document.getElementById("wtGoWatchBtn");
    const wtCopyBtn     = document.getElementById("wtCopyBtn");

    // nav "Guarda Insieme"
    wtNavBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      showWT();
    });

    wtCreateBtn?.addEventListener("click", () => {
      createRoom();
    });

    wtJoinBtn?.addEventListener("click", () => {
      const codeInput = document.getElementById("wtJoinCode");
      const code = codeInput.value.trim();
      if (!code) return;
      joinRoom(code);
    });

    wtLeaveBtn?.addEventListener("click", () => {
      leaveRoom();
    });

    wtGoWatchBtn?.addEventListener("click", () => {
      // Torna al catalogo
      UIManager.showHome();
    });

    wtCopyBtn?.addEventListener("click", () => {
      if (!roomId) return;
      navigator.clipboard.writeText(roomId).catch(()=>{});
    });

    ensureSocket();
    refreshUI();
  }

  function showWT() {
    // Mostra la sezione "wt", nasconde il resto
    document.getElementById("home").style.display = "none";
    document.getElementById("all").style.display  = "none";
    document.getElementById("watch").style.display= "none";
    document.getElementById("wt").style.display   = "block";
    refreshUI();
  }

  function createRoom() {
    // genera un codice fittizio locale; la stanza è logica lato WS
    roomId = "WT-" + Math.random().toString(36).substring(2, 7).toUpperCase();
    iAmCreator = true;
    ensureSocket();
    console.log('[WT] join-room create', roomId);
    safeSend({ type: 'join-room', roomId });
    refreshUI();
  }

  function joinRoom(code) {
    roomId = code;
    iAmCreator = false;
    ensureSocket();
    console.log('[WT] join-room join', code);
    safeSend({ type: 'join-room', roomId: code });
    refreshUI();
  }

  function leaveRoom() {
    roomId = null;
    iAmCreator = false;
    refreshUI();
  }

  function refreshUI() {
    const stepNot = document.getElementById("wtNotInRoom");
    const stepIn  = document.getElementById("wtInRoom");
    const codeEl  = document.getElementById("wtRoomCode");
    const roleEl  = document.getElementById("wtRoleBadge");
    const usersEl = document.getElementById("wtUsers");

    if (!roomId) {
      // non sono in stanza
      stepNot.style.display = "block";
      stepIn.style.display  = "none";
    } else {
      // sono in stanza
      stepNot.style.display = "none";
      stepIn.style.display  = "block";

      codeEl.textContent = roomId;
      roleEl.textContent = iAmCreator ? "host" : "viewer";

      // mock lista utenti
      usersEl.innerHTML = `
        <li class="wt-user">
          <span class="wt-user-avatar">👑</span>
          <span class="wt-user-name">${iAmCreator ? "Tu (host)" : "Host"}</span>
        </li>
        <li class="wt-user">
          <span class="wt-user-avatar">🙂</span>
          <span class="wt-user-name">${iAmCreator ? "Viewer" : "Tu"}</span>
        </li>
      `;
    }
  }

  // Queste funzioni vengono chiamate dal player durante play/pause/seek
  function broadcastState() {
    // manda lo stato corrente solo se host
    if (!iAmCreator || !roomId) return;
    const video = document.getElementById('video');
    if (!video) return;
    const state = collectPlayerState();
    safeSend({ type: 'update-state', roomId, state });
  }

  function notifyEpisodeChange() {
    // invia stato (incluso episodio)
    broadcastState();
  }

  function collectPlayerState() {
    // prova a raccogliere info episodio corrente dal DOM/Player
    let seriesId = null, epNumber = null;
    try {
      const v = document.getElementById('video');
      seriesId = v?.dataset?.seriesId ? Number(v.dataset.seriesId) : null;
      epNumber = v?.dataset?.epNumber ? Number(v.dataset.epNumber) : null;
    } catch {}
    const video = document.getElementById('video');
    return {
      seriesId,
      epNumber,
      time: video ? (video.currentTime || 0) : 0,
      paused: video ? video.paused : true
    };
  }

  return {
    initUI,
    showWT,
    createRoom,
    joinRoom,
    leaveRoom,
    broadcastState,
    notifyEpisodeChange,

    get roomId() { return roomId; },
    get iAmCreator() { return iAmCreator; }
  };
})();
