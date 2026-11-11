/*
 * ui.js — small reusable helpers for building the interface.
 *
 * We build screens with template strings (`<div>${...}</div>`) and
 * innerHTML. ALWAYS pass user/content text through esc() first, so a
 * "<" in a sentence can't break the page.
 */
window.SU = window.SU || {};

(function () {
  const ui = {};

  /* Escape text so it is safe inside HTML. */
  ui.esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };
  const esc = ui.esc;

  /* Shortcut for querySelector inside a container. */
  ui.$ = (root, sel) => root.querySelector(sel);
  ui.$$ = (root, sel) => Array.from(root.querySelectorAll(sel));

  /* ---------- Random helpers ---------- */
  ui.shuffle = function (arr, rand) {
    rand = rand || Math.random;
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  ui.pick = (arr, rand) => arr[Math.floor((rand || Math.random)() * arr.length)];
  /* A random generator that gives the SAME numbers for the same seed
     (used so today's daily session stays the same if you reload). */
  ui.seeded = function (seedText) {
    let h = 2166136261;
    for (const c of String(seedText)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    return function () {
      h += 0x6D2B79F5;
      let t = h;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  /* ---------- Formatting ---------- */
  ui.fmtTime = function (sec) {
    sec = Math.max(0, Math.round(sec));
    return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
  };
  ui.levelBadge = function (level, extraClass) {
    return level
      ? `<span class="badge lvl-${esc(level)} ${extraClass || ''}">${esc(level)}</span>`
      : `<span class="badge lvl-none ${extraClass || ''}">—</span>`;
  };
  /* A 🔊 button: any element with data-say="text" speaks when clicked. */
  ui.sayBtn = function (text, label, extra) {
    return `<button class="btn-icon" type="button" data-say="${esc(text)}" title="Listen" aria-label="Listen: ${esc(text)}" ${extra || ''}>${label || '🔊'}</button>`;
  };

  /* Coloured words after a speaking attempt. */
  ui.wordDiffHTML = function (tokens) {
    return `<p class="word-diff">${tokens.map(t =>
      `<span class="w ${t.ok ? 'w-ok' : 'w-miss'}">${esc(t.text)}</span>`).join(' ')}</p>`;
  };
  ui.accuracyClass = acc => (acc >= 85 ? 'good' : acc >= 60 ? 'ok' : 'bad');

  /* ---------- Toast messages (small pop-ups at the bottom) ---------- */
  ui.toast = function (msg, type) {
    const box = document.getElementById('toasts');
    if (!box) return;
    const t = document.createElement('div');
    t.className = 'toast ' + (type || '');
    t.textContent = msg;
    t.setAttribute('role', 'status');
    box.appendChild(t);
    setTimeout(() => t.classList.add('hide'), 3200);
    setTimeout(() => t.remove(), 3700);
  };

  /* ---------- Modal dialog ----------
     ui.modal({ title, html, actions: [{ label, primary, onClick }] }) */
  ui.modal = function (opts) {
    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-label="${esc(opts.title)}">
        <h2>${esc(opts.title)}</h2>
        <div class="modal-body">${opts.html || ''}</div>
        <div class="modal-actions"></div>
      </div>`;
    const actions = wrap.querySelector('.modal-actions');
    const close = () => wrap.remove();
    (opts.actions || [{ label: 'OK', primary: true }]).forEach(a => {
      const b = document.createElement('button');
      b.className = 'btn ' + (a.primary ? 'btn-primary' : 'btn-ghost');
      b.textContent = a.label;
      b.onclick = () => { if (a.onClick) a.onClick(); close(); };
      actions.appendChild(b);
    });
    wrap.addEventListener('click', e => { if (e.target === wrap) close(); });
    document.body.appendChild(wrap);
    actions.querySelector('button').focus();
    return close;
  };
  ui.confirm = function (title, html, onYes) {
    ui.modal({ title, html, actions: [{ label: 'Cancel' }, { label: 'Yes', primary: true, onClick: onYes }] });
  };

  /* ---------- What to do when the microphone is blocked ---------- */
  let micHelpOpen = false;
  ui.micHelp = function (code) {
    if (micHelpOpen) return;
    micHelpOpen = true;
    const isFile = location.protocol === 'file:';
    const insecure = !window.isSecureContext;
    ui.modal({
      title: '🎙️ Microphone blocked',
      html: `
        <p>SpeakUp needs your microphone for speaking exercises. Your browser is currently blocking it${code === 'service-not-allowed' ? ' (or speech recognition is disabled)' : ''}.</p>
        <ol class="help-list">
          <li>Click the <b>🔒 lock / tune icon</b> on the left of the address bar.</li>
          <li>Set <b>Microphone</b> to <b>Allow</b>.</li>
          <li><b>Reload</b> the page.</li>
        </ol>
        <p class="muted">Still blocked? Check that no other app is using the mic, and on Windows/macOS make sure Chrome is allowed to use the microphone in system privacy settings.</p>
        ${insecure ? '<p class="warn">⚠️ This page is not served over HTTPS or localhost, so the browser refuses the microphone. Use GitHub Pages (https) or run a local server (see README).</p>' : ''}
        ${isFile ? '<p class="muted">Tip: when opened as a file, Chrome may ask for permission every time. Running a local server (<code>python -m http.server</code>) fixes that.</p>' : ''}
        <p class="muted">Brave and some privacy browsers disable speech recognition. Use Google Chrome for the best result.</p>`,
      actions: [{ label: 'Got it', primary: true, onClick: () => { micHelpOpen = false; } }]
    });
    // The modal can also be closed by clicking outside, so reset the flag later anyway.
    setTimeout(() => { micHelpOpen = false; }, 1500);
  };

  /* Warning box to show instead of a speaking exercise when it can't work. */
  ui.noRecognitionHTML = function () {
    return `<div class="notice warn">
      <b>Speech recognition isn't available in this browser.</b><br>
      Please open SpeakUp in <b>Google Chrome</b> (desktop or Android) or Microsoft Edge.
      You can still listen to the sentences with 🔊.</div>`;
  };

  /* ---------- Copy text to the clipboard ---------- */
  ui.copyText = async function (text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      // Fallback for older browsers / file:// pages.
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      ta.remove();
      return ok;
    }
  };

  /* ---------- Generic multiple-choice quiz ----------
   * questions: [{ q, options, answer (index), topic?, explain? }]
   * opts: { onAnswer(question, correct), onDone(score, total), title }
   * Options are shuffled each time, so answer:0 in the data is fine.     */
  ui.mountQuiz = function (container, questions, opts) {
    opts = opts || {};
    let idx = 0, score = 0;

    function render() {
      if (idx >= questions.length) {
        container.innerHTML = `
          <div class="quiz-done">
            <div class="big-score ${ui.accuracyClass(score / questions.length * 100)}">${score}/${questions.length}</div>
            <p>${score === questions.length ? 'Perfect! 🎉' : score >= questions.length / 2 ? 'Good job! Mistakes were added to your flashcards.' : 'Keep going — your mistakes were added to your flashcards so you can review them.'}</p>
          </div>`;
        if (opts.onDone) opts.onDone(score, questions.length);
        return;
      }
      const q = questions[idx];
      const order = ui.shuffle(q.options.map((_, i) => i));
      container.innerHTML = `
        <div class="quiz">
          <div class="quiz-progress muted">Question ${idx + 1} of ${questions.length}</div>
          <p class="quiz-q">${esc(q.q)}</p>
          <div class="options">
            ${order.map(i => `<button class="option" data-i="${i}">${esc(q.options[i])}</button>`).join('')}
          </div>
          <div class="quiz-feedback" aria-live="polite"></div>
        </div>`;
      ui.$$(container, '.option').forEach(btn => {
        btn.onclick = () => {
          const chosen = Number(btn.dataset.i);
          const correct = chosen === q.answer;
          if (correct) score++;
          ui.$$(container, '.option').forEach(b => {
            b.disabled = true;
            if (Number(b.dataset.i) === q.answer) b.classList.add('correct');
          });
          if (!correct) btn.classList.add('wrong');
          const fb = ui.$(container, '.quiz-feedback');
          fb.innerHTML = `<p class="${correct ? 'good' : 'bad'}">${correct ? '✓ Correct!' : '✗ The answer is: <b>' + esc(q.options[q.answer]) + '</b>'}</p>
            ${q.explain ? `<p class="muted">${esc(q.explain)}</p>` : ''}
            <button class="btn btn-primary next">${idx + 1 < questions.length ? 'Next ›' : 'See score'}</button>`;
          if (opts.onAnswer) opts.onAnswer(q, correct);
          const next = ui.$(fb, '.next');
          next.focus();
          next.onclick = () => { idx++; render(); };
        };
      });
    }
    render();
  };

  /* When a question has a "___" gap, build the full correct sentence. */
  ui.fillGap = function (q, answer) {
    return q.includes('___') ? q.replace('___', answer) : answer;
  };

  /* ---------- Global: any [data-say] element speaks its text ---------- */
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-say]');
    if (!el) return;
    e.preventDefault();
    SU.speech.speak(el.dataset.say, {
      rate: el.dataset.rate ? Number(el.dataset.rate) : undefined,
      accent: el.dataset.accent || undefined
    });
  });

  SU.ui = ui;
})();
