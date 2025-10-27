// js/watchTogether.js
const WatchTogether = (() => {
  let roomId = null;
  let iAmCreator = false;

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
    // genera un codice fittizio
    roomId = "WT-" + Math.random().toString(36).substring(2, 7).toUpperCase();
    iAmCreator = true;
    refreshUI();
  }

  function joinRoom(code) {
    roomId = code;
    iAmCreator = false;
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
    // Qui in futuro manderemo via WS l'evento "play/pausa/seek"
  }

  function notifyEpisodeChange() {
    // Qui in futuro manderemo via WS che episodio stiamo guardando
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
