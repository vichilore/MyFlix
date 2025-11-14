// js/main.js
window.addEventListener("DOMContentLoaded", () => {
  // nav buttons
  const navHomeBtn = document.getElementById("navHomeBtn");
  const navAllBtn  = document.getElementById("navAllBtn");
  const navRouletteBtn = document.getElementById("navRouletteBtn");

  navHomeBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    UIManager.showHome();
    HomePage.render();
  });

  navAllBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    UIManager.showAll();
    AllPage.render();
  });

  navRouletteBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    UIManager.showRoulette();
    if (window.RoulettePage && typeof RoulettePage.render === 'function') {
      RoulettePage.render();
    }
  });

  // init subsystems (con protezioni)
  if (typeof DockMetrics !== "undefined") {
    DockMetrics.init();
  } else {
    console.warn("DockMetrics non caricato (ok per adesso)");
  }

  if (typeof Player !== "undefined") {
    Player.init();
  }

  if (typeof Search !== "undefined") {
    Search.init();
  }

  if (typeof AllPage !== "undefined" && typeof AllPage.init === 'function') {
    AllPage.init();
  }

  if (typeof WatchTogether !== "undefined") {
    WatchTogether.initUI();
  }

  if (typeof AuthModal !== "undefined") {
    AuthModal.init();
  }

  if (typeof UserProfile !== "undefined") {
    UserProfile.init();
  }
  
  // prima vista: Home
  UIManager.showHome();
  HomePage.render().catch(err => {
    console.error('HomePage.render error:', err);
    // Fallback: mostra almeno i caroselli base
    try {
      AllPage.render();
    } catch (e) {
      console.error('AllPage.render fallback error:', e);
    }
  });
  
});
