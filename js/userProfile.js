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

    btn.addEventListener('click', () => {
      if (!Auth.isLoggedIn()) {
        if (typeof AuthModal !== 'undefined' && AuthModal.show) {
          AuthModal.show();
        }
        return;
      }
      toggleMenu();
    });
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
        if (/Not authenticated/i.test(e?.message || '')) {
          if (typeof AuthModal !== 'undefined' && AuthModal.show) AuthModal.show();
        }
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
    if (!Array.isArray(list) || list.length === 0) return null;

    const {
      profileSwitcher,
      profileSwitchList,
      profileSwitchClose,
      profileSwitchCancel
    } = UIManager.elements;

    if (!profileSwitcher || !profileSwitchList) {
      return null;
    }

    profileSwitchList.innerHTML = '';

    const previousActive = document.activeElement;

    const cleanup = () => {
      profileSwitcher.setAttribute('aria-hidden', 'true');
      document.removeEventListener('keydown', onKeyDown, true);
      profileSwitcher.querySelectorAll('[data-close]')
        .forEach((el) => el.removeEventListener('click', handleDismiss));
      profileSwitchClose?.removeEventListener('click', handleDismiss);
      profileSwitchCancel?.removeEventListener('click', handleDismiss);
      if (previousActive && typeof previousActive.focus === 'function') {
        previousActive.focus();
      }
    };

    const handleDismiss = () => {
      cleanup();
      resolvePromise(null);
    };

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleDismiss();
      }
    };

    let resolvePromise;

    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    list.forEach((profile) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'profile-switcher__item';
      btn.setAttribute('data-id', profile.id);
      btn.setAttribute('role', 'option');

      const avatar = document.createElement('img');
      avatar.className = 'profile-switcher__avatar';
      if (profile.avatarUrl) {
        avatar.src = profile.avatarUrl;
      } else {
        const initial = (profile.displayName || profile.username || '?').trim().charAt(0) || '?';
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" rx="60" fill="#252537"/><text x="50%" y="56%" text-anchor="middle" font-size="56" fill="#fff" font-family="Inter, sans-serif">${initial.toUpperCase()}</text></svg>`;
        avatar.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
      }
      avatar.alt = profile.displayName || 'Avatar profilo';

      const name = document.createElement('span');
      name.className = 'profile-switcher__name';
      name.textContent = profile.displayName || profile.username || 'Profilo';

      btn.appendChild(avatar);
      btn.appendChild(name);

      btn.addEventListener('click', () => {
        cleanup();
        resolvePromise(profile);
      });

      profileSwitchList.appendChild(btn);
    });

    profileSwitcher.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => {
      const first = profileSwitchList.querySelector('button');
      first?.focus();
    });

    profileSwitcher.querySelectorAll('[data-close]')
      .forEach((el) => el.addEventListener('click', handleDismiss));
    profileSwitchClose?.addEventListener('click', handleDismiss);
    profileSwitchCancel?.addEventListener('click', handleDismiss);
    document.addEventListener('keydown', onKeyDown, true);

    return promise.finally(() => {
      cleanup();
    });
  }

  return { init };
})();

