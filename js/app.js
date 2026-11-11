/*
 * app.js — the "router": decides which page to show based on the URL hash.
 *
 *   #/dashboard          home
 *   #/placement          placement test        #/placement/result
 *   #/speak/<tab>        speaking trainer (read, shadow, fast, pairs, phrases)
 *   #/lessons            lesson list           #/lesson/<unitId>/<step>
 *   #/daily              today's session
 *   #/cards              flashcards
 *   #/settings           settings
 *
 * Using the hash (#) means it works on GitHub Pages and from a local file
 * without any server configuration.
 */
window.SU = window.SU || {};

(function () {
  const main = document.getElementById('app');
  let leaveHandlers = [];

  SU.app = {
    /* Pages register clean-up code (stop the mic, timers…) here. */
    onLeave(fn) { leaveHandlers.push(fn); }
  };

  function cleanup() {
    leaveHandlers.forEach(fn => { try { fn(); } catch (e) { console.error(e); } });
    leaveHandlers = [];
    SU.speech.stopAll();
    document.querySelectorAll('.modal-backdrop').forEach(m => m.remove()); // close open dialogs
  }

  const routes = {
    dashboard: () => SU.dashboard.render(main),
    placement: parts => (parts[1] === 'result' ? SU.placement.renderResultPage(main) : SU.placement.render(main)),
    speak: parts => SU.speaking.render(main, parts[1]),
    lessons: () => SU.lessons.renderList(main),
    lesson: parts => SU.lessons.renderUnit(main, parts[1], parts[2]),
    daily: () => SU.daily.render(main),
    cards: () => SU.srs.renderPage(main),
    settings: () => SU.settings.render(main)
  };

  function route() {
    cleanup();
    const parts = (location.hash.replace(/^#\/?/, '') || 'dashboard').split('/');
    const page = routes[parts[0]] ? parts[0] : 'dashboard';

    // Highlight the current menu item.
    const navKey = page === 'lesson' ? 'lessons' : page;
    document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === navKey));

    try {
      routes[page](parts);
    } catch (e) {
      console.error(e);
      main.innerHTML = `<div class="notice warn">Something went wrong on this page: ${SU.ui.esc(e.message)}</div>`;
    }
    window.scrollTo(0, 0);
    main.focus({ preventScroll: true });
  }

  window.addEventListener('hashchange', route);

  /* Global banners shown once at start-up. */
  function banners() {
    const box = document.getElementById('banners');
    const msgs = [];
    if (!SU.speech.recognitionSupported) {
      msgs.push('⚠️ Speech recognition is not available in this browser. Speaking exercises need <b>Google Chrome</b> (or Edge).');
    }
    if (!window.isSecureContext && location.protocol !== 'file:') {
      msgs.push('⚠️ This page is not on HTTPS, so the microphone will be blocked. Use GitHub Pages or <code>localhost</code>.');
    }
    if (!navigator.onLine) {
      msgs.push('📡 You seem to be offline. Chrome\'s speech recognition needs an internet connection.');
    }
    box.innerHTML = msgs.map(m => `<div class="banner">${m}<button class="banner-x" aria-label="Close">×</button></div>`).join('');
    box.querySelectorAll('.banner-x').forEach(b => b.onclick = () => b.parentElement.remove());
  }

  banners();
  route();
})();
