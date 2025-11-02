// js/userProfile.js
const UserProfile = (() => {
  let menuOpen = false;

  function init() {
    const btn = document.getElementById('profileBtn');
    const menu = document.getElementById('profileMenu');
    const avatarEl = document.getElementById('profileAvatar');
    const nameEl = document.getElementById('profileName');
    const switchBtn = document.getElementById('profileSwitch');
    const logoutBtn = document.getElementById('profileLogout');

    if (!btn || !menu) return;

    // populate profile if logged in
    if (Auth.isLoggedIn()) {
      refreshProfileUI().catch(() => {/* silent */});
    } else {
      // fallback
      if (avatarEl) avatarEl.src = '';
      if (nameEl) nameEl.textContent = 'Profilo';
    }

    btn.addEventListener('click', () => toggleMenu());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menuOpen) closeMenu();
    });
    document.addEventListener('click', (e) => {
      if (!menuOpen) return;
      const path = e.composedPath ? e.composedPath() : [];
      if (!path.includes(menu) && !path.includes(btn)) closeMenu();
    }, true);

    switchBtn?.addEventListener('click', async () => {
      // If there is an existing modal to pick profiles, reuse it; otherwise simple prompt
      try {
        const list = await API.listMyProfiles();
        const choice = await chooseProfile(list);
        if (choice) {
          await API.switchCurrentProfile(choice.id);
          await refreshProfileUI();
          closeMenu();
          HomePage.render?.();
        }
      } catch (e) {
        console.warn('Profile switch failed', e);
      }
    });

    logoutBtn?.addEventListener('click', async () => {
      try {
        const base = (window.CONFIG && window.CONFIG.API_BASE_URL) || '';
        if (base) {
          try {
            await fetch(base + "/auth/logout", {
              method: 'POST',
              headers: { 'Authorization': 'Bearer ' + (Auth.getToken() || '') }
            });
          } catch {}
        }
      } finally {
        Auth.logout();
      }
    });
  }

  async function refreshProfileUI() {
    const data = await API.getCurrentProfile();
    const avatarEl = document.getElementById('profileAvatar');
    const nameEl = document.getElementById('profileName');
    if (avatarEl) {
      avatarEl.src = data.avatarUrl || '';
      avatarEl.alt = data.displayName || 'Avatar';
    }
    if (nameEl) nameEl.textContent = data.displayName || 'Profilo';
  }

  function toggleMenu() { menuOpen ? closeMenu() : openMenu(); }
  function openMenu() {
    const btn = document.getElementById('profileBtn');
    const menu = document.getElementById('profileMenu');
    if (!btn || !menu) return;
    menu.classList.add('show');
    menu.setAttribute('aria-hidden', 'false');
    btn.setAttribute('aria-expanded', 'true');
    menuOpen = true;
    // focus first item
    const first = menu.querySelector('.profile-menu-item');
    first && first.focus();
  }
  function closeMenu() {
    const btn = document.getElementById('profileBtn');
    const menu = document.getElementById('profileMenu');
    if (!btn || !menu) return;
    menu.classList.remove('show');
    menu.setAttribute('aria-hidden', 'true');
    btn.setAttribute('aria-expanded', 'false');
    menuOpen = false;
    btn.focus();
  }

  async function chooseProfile(list) {
    // Simple fallback selector; can be replaced by a proper modal
    if (!Array.isArray(list) || list.length === 0) return null;
    const names = list.map((p, i) => `${i+1}) ${p.displayName}`).join('\n');
    const input = prompt(`Scegli profilo:\n${names}\nInserisci numero:`);
    const idx = Number(input) - 1;
    if (Number.isFinite(idx) && idx >= 0 && idx < list.length) return list[idx];
    return null;
  }

  return { init };
})();

