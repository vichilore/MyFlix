// js/ui-authmodal.js
const AuthModal = (() => {

  function init() {
    const modal = document.getElementById('authModal');
    if (!modal) return;

    const tabs = modal.querySelectorAll('.auth-tab-btn');
    const panels = modal.querySelectorAll('.auth-panel');

    function showTab(tabName) {
      tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
      panels.forEach(p => {
        p.style.display = (p.dataset.panel === tabName) ? 'block' : 'none';
      });
    }

    tabs.forEach(t => {
      t.addEventListener('click', () => showTab(t.dataset.tab));
    });

    // LOGIN
    const loginBtn = document.getElementById('login_btn');
    loginBtn?.addEventListener('click', async () => {
      const u = document.getElementById('login_username').value.trim();
      const p = document.getElementById('login_pin').value.trim();
      const errBox = document.getElementById('login_error');
      errBox.textContent = '';

      try {
        await Auth.doLogin(u, p);
        afterLogin();
      } catch (e) {
        errBox.textContent = e.message;
      }
    });

    // GUEST
    const guestBtn = document.getElementById('guest_btn');
    guestBtn?.addEventListener('click', () => {
      Auth.loginAsGuest();
      afterLogin();
    });

    // SIGNUP
    const signupBtn = document.getElementById('signup_btn');
    signupBtn?.addEventListener('click', async () => {
      const u = document.getElementById('signup_username').value.trim();
      const p = document.getElementById('signup_pin').value.trim();
      const a = document.getElementById('signup_avatar').value.trim();
      const errBox = document.getElementById('signup_error');
      errBox.textContent = '';

      try {
        await Auth.doSignup(u, p, a || null);
        afterLogin();
      } catch (e) {
        errBox.textContent = e.message;
      }
    });

    function afterLogin() {
      hide();
      // refresh home sections che dipendono dall'utente
      UIHomeRefresh();
    }

    function hide() {
      modal.style.display = 'none';
    }

    function show() {
      modal.style.display = 'flex';
      showTab('login');
    }

    // esponiamo
    AuthModal.show = show;
    AuthModal.hide = hide;

    // se già loggato, non mostrare
    if (Auth.isLoggedIn()) {
      hide();
    } else {
      show();
    }
  }

  // helper chiamato dopo login per aggiornare UI home
  function UIHomeRefresh() {
    // per ora ricarichiamo la home standard
    HomePage.render();
  }

  return { init, show: () => { }, hide: () => { } };
})();
