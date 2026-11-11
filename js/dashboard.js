/*
 * dashboard.js — the home screen: streak, minutes spoken, words learned,
 * level progress per skill, weak points and recent activity.
 */
window.SU = window.SU || {};

(function () {
  const { esc, $ } = SU.ui;
  const store = SU.store;
  const LEVELS = store.LEVELS;
  const SKILL_ICON = { grammar: '📐', vocabulary: '📚', listening: '🎧', speaking: '🎙️' };
  const cap = s => s[0].toUpperCase() + s.slice(1);

  function weakLink(w) {
    if (w.key.startsWith('pron:')) return '#/speak/pairs';
    if (w.key.startsWith('fluency:')) return '#/speak/fast';
    if (w.skill === 'listening') return '#/speak/shadow';
    return '#/daily';
  }

  function render(container) {
    const st = store.state;
    const streak = store.currentStreak();
    const minutes = Math.round(st.stats.secondsSpoken / 60);
    const todayMin = Math.round(((st.days[store.today()] || {}).seconds || 0) / 60);
    const daily = SU.daily.summary();
    const weak = store.topWeakPoints(5);
    const overall = store.overallLevel();
    const dueN = SU.srs.due().length;

    // Last 7 days of speaking (minutes).
    const week = [];
    for (let i = 6; i >= 0; i--) {
      const k = store.addDays(store.today(), -i);
      week.push({ k, label: new Date(k + 'T12:00').toLocaleDateString('en-GB', { weekday: 'narrow' }), min: ((st.days[k] || {}).seconds || 0) / 60, active: !!st.days[k] && st.days[k].exercises > 0 });
    }
    const maxMin = Math.max(5, ...week.map(d => d.min));

    container.innerHTML = `
      ${st.placement ? '' : `
      <section class="card hero">
        <h1>Welcome to SpeakUp 👋</h1>
        <p>Your goal: go from freezing to speaking confidently at <b>C1</b>. Start with a 15-minute placement test so SpeakUp can find your level and weak points.</p>
        <div class="row"><a class="btn btn-primary btn-lg" href="#/placement">Take the placement test</a>
        <a class="btn btn-ghost" href="#/speak/fast">Or try “Answer fast” now</a></div>
      </section>`}

      <div class="stats-row">
        <div class="stat"><b>🔥 ${streak}</b><span>day streak${st.streak.best > streak ? ` · best ${st.streak.best}` : ''}</span></div>
        <div class="stat"><b>🎙️ ${minutes}</b><span>minutes spoken${todayMin ? ` · ${todayMin} today` : ''}</span></div>
        <div class="stat"><b>📚 ${SU.srs.wordsLearned()}</b><span>words learned</span></div>
        <div class="stat"><b>🃏 ${dueN}</b><span>cards due</span></div>
      </div>

      <section class="card today ${daily.completed ? 'complete' : ''}">
        <div class="row space wrap">
          <div>
            <h2>${daily.completed ? '✅ Today\'s session is done!' : '📅 Today\'s 15-minute session'}</h2>
            <p class="muted small">${daily.done}/${daily.total} steps · built from your weak points</p>
          </div>
          <a class="btn ${daily.completed ? 'btn-ghost' : 'btn-primary btn-lg'}" href="#/daily">${daily.completed ? 'Review' : daily.done ? 'Continue' : 'Start'}</a>
        </div>
        <div class="progress"><div style="width:${(daily.done / daily.total) * 100}%"></div></div>
      </section>

      <div class="grid-2">
        <section class="card">
          <div class="row space"><h2>Level per skill</h2>${overall ? `<span>Overall ${SU.ui.levelBadge(overall)}</span>` : ''}</div>
          <ul class="skill-progress">
            ${store.SKILLS.map(s => {
              const sk = st.skills[s];
              const idx = LEVELS.indexOf(sk.level);
              const pct = sk.level ? Math.min(100, Math.round(sk.xp)) : 0;
              return `<li>
                <div class="row space"><span>${SKILL_ICON[s]} ${cap(s)}</span>
                  <span>${SU.ui.levelBadge(sk.level)} ${idx >= 0 && idx < 5 ? `<span class="muted small">→ ${LEVELS[idx + 1]}</span>` : ''}</span></div>
                <div class="progress thin" title="${pct}% to next level"><div style="width:${pct}%"></div></div>
                <div class="level-track">${LEVELS.map((l, i) => `<span class="${i <= idx ? 'on' : ''} ${l === 'C1' ? 'goal' : ''}">${l}</span>`).join('')}</div>
              </li>`;
            }).join('')}
          </ul>
          <p class="muted small">Practice earns XP. 100 XP = next level. 🎯 Goal: C1 in every skill.</p>
        </section>

        <section class="card">
          <h2>Top weak points</h2>
          ${weak.length ? `<ol class="weak-list">${weak.map(w => `
            <li><div><b>${esc(w.label)}</b><br><span class="muted small">${w.misses} miss${w.misses === 1 ? '' : 'es'} · ${w.hits} correct</span></div>
            <a class="btn btn-small" href="${weakLink(w)}">Practise</a></li>`).join('')}</ol>`
            : '<p class="muted">No weak points yet — they appear as you practise.</p>'}
        </section>
      </div>

      <div class="grid-2">
        <section class="card">
          <h2>Speaking this week</h2>
          <div class="week-chart">
            ${week.map(d => `<div class="wk-col" title="${d.k}: ${d.min.toFixed(1)} min">
              <div class="wk-bar ${d.active ? 'active' : ''}" style="height:${Math.max(3, (d.min / maxMin) * 100)}%"></div>
              <span>${d.label}</span></div>`).join('')}
          </div>
          <p class="muted small">Minutes of speech recorded per day.</p>
        </section>
        <section class="card">
          <h2>Recent activity</h2>
          ${st.history.length ? `<ul class="history">${st.history.slice(0, 6).map(h => `
            <li><span>${esc(h.title)}</span>
            <span class="muted small">${h.score != null ? h.score + '% · ' : ''}${timeAgo(h.t)}</span></li>`).join('')}</ul>`
            : '<p class="muted">Nothing yet. Your first exercise will appear here.</p>'}
        </section>
      </div>

      <section class="card quick">
        <h2>Quick practice</h2>
        <div class="grid-4">
          <a class="mini-card" href="#/speak/fast"><div class="emoji">⚡</div><b>Answer fast</b><span class="muted small">Beat the freeze</span></a>
          <a class="mini-card" href="#/speak/read"><div class="emoji">📖</div><b>Read aloud</b><span class="muted small">Word-by-word accuracy</span></a>
          <a class="mini-card" href="#/speak/shadow"><div class="emoji">🗣️</div><b>Shadowing</b><span class="muted small">Copy the rhythm</span></a>
          <a class="mini-card" href="#/speak/pairs"><div class="emoji">👄</div><b>Minimal pairs</b><span class="muted small">th, h, v, i/ee…</span></a>
        </div>
      </section>
      <div class="mic-status"></div>`;

    showMicStatus($(container, '.mic-status'));
  }

  async function showMicStatus(el) {
    if (!SU.speech.recognitionSupported) { el.innerHTML = SU.ui.noRecognitionHTML(); return; }
    const p = await SU.speech.micPermission();
    if (p === 'denied') {
      el.innerHTML = `<div class="notice warn">🎙️ Your microphone is blocked for this site. <button class="link-btn fix">How to fix it</button></div>`;
      $(el, '.fix').onclick = () => SU.ui.micHelp('not-allowed');
    } else if (p === 'prompt') {
      el.innerHTML = `<div class="notice">🎙️ SpeakUp will ask for microphone access. <button class="link-btn allow">Allow now</button></div>`;
      $(el, '.allow').onclick = async () => {
        const ok = await SU.speech.requestMic();
        el.innerHTML = ok ? '<div class="notice good">🎙️ Microphone ready!</div>' : '';
        if (!ok) SU.ui.micHelp('not-allowed');
      };
    }
  }

  function timeAgo(t) {
    const s = (Date.now() - t) / 1000;
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + ' min ago';
    if (s < 86400) return Math.floor(s / 3600) + ' h ago';
    return Math.floor(s / 86400) + ' d ago';
  }

  SU.dashboard = { render };
})();
