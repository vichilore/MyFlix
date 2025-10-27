// js/dockMetrics.js
class DockMetrics {
  static init() {
    const navBox = $('.nav-center-box');
    const dockNodes = [$('.main-header'), navBox].filter(Boolean);

    const setMetrics = () => {
      let maxBottom = 0;
      for (const el of dockNodes) {
        const r = el.getBoundingClientRect();
        const pos = getComputedStyle(el).position;
        const isDocking = (pos === 'fixed' || pos === 'sticky') && r.top <= 0 && r.bottom > 0;
        if (isDocking) maxBottom = Math.max(maxBottom, r.bottom);
      }
      if (maxBottom === 0 && dockNodes[0]) maxBottom = dockNodes[0].offsetHeight || 0;
      document.documentElement.style.setProperty('--dock-h', Math.ceil(maxBottom) + 'px');

      if (navBox) {
        const r = navBox.getBoundingClientRect();
        const navTop = Math.round(r.top);
        const navH = Math.round(r.height);
        const navRightGap = Math.max(0, Math.round(window.innerWidth - r.right));

        document.documentElement.style.setProperty('--nav-top', navTop + 'px');
        document.documentElement.style.setProperty('--nav-h', navH + 'px');
        document.documentElement.style.setProperty('--nav-right', navRightGap + 'px');
      }
    };

    const raf = () => requestAnimationFrame(setMetrics);
    raf();
    window.addEventListener('resize', raf, { passive: true });
    window.addEventListener('scroll', raf, { passive: true });
    if (document.fonts?.ready) document.fonts.ready.then(setMetrics);
  }
}
