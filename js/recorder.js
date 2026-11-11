/*
 * recorder.js — the free-speaking recorder.
 *
 * Used by "Answer fast", the speaking step of each lesson, and the daily
 * session. It:
 *   1. reads the question aloud,
 *   2. gives you START_WINDOW seconds to start talking (beat the freeze!),
 *   3. records 30–60 seconds, counting words and detecting long pauses,
 *   4. shows feedback + the "Copy for Claude" button.
 *
 * Usage:
 *   SU.recorder.mount(container, {
 *     question: 'What did you do last weekend?',
 *     kind: 'Answer fast',       // shown in history + Claude prompt
 *     minSeconds: 30, maxSeconds: 60, startWindow: 5,
 *     onDone: result => {...}
 *   });
 */
window.SU = window.SU || {};

(function () {
  const { esc, $ } = SU.ui;
  const PAUSE_SECONDS = 3;       // silence longer than this = a "long pause"
  const HINT_SECONDS = 2;        // after this much silence, show a filler hint

  const SINGLE_CONNECTORS = ['however', 'although', 'whereas', 'therefore', 'moreover', 'furthermore',
    'despite', 'unless', 'meanwhile', 'nevertheless', 'basically', 'honestly', 'personally', 'actually'];

  /* All multi-word phrases from the phrase bank, cleaned up for matching. */
  function connectorList() {
    const fromBank = (window.SU_CONTENT.phrases || []).flatMap(c => c.items)
      .map(p => p.toLowerCase().replace(/\.\.\.|[.,!?]/g, '').trim())
      .filter(p => p.split(' ').length >= 2 && p.split(' ').length <= 5)
      // keep only the "core" (e.g. "take my brother for example" is too specific)
      .filter(p => !/my brother|for a second/.test(p));
    return Array.from(new Set(fromBank.concat(SINGLE_CONNECTORS)));
  }

  function findConnectors(transcript) {
    const t = ' ' + transcript.toLowerCase().replace(/[.,!?]/g, '') + ' ';
    return connectorList().filter(c => t.includes(' ' + c + ' '));
  }

  /* A few "freeze rescue" phrases to show while you're silent. */
  function rescuePhrases(n) {
    const cat = window.SU_CONTENT.phrases.find(c => c.id === 'time');
    return SU.ui.shuffle(cat.items).slice(0, n || 3);
  }
  function rescueHTML() {
    return `<div class="rescue"><span class="muted small">Stuck? Say:</span> ${rescuePhrases(3).map(p => `<span class="chip">${esc(p)}</span>`).join(' ')}</div>`;
  }

  function mount(container, opts) {
    opts = Object.assign({ kind: 'Answer fast', minSeconds: 30, maxSeconds: 60, startWindow: 5, speakQuestion: true }, opts);
    if (container._suCleanup) container._suCleanup(); // stop a previous recorder in this box
    SU.speech.stopAll();
    if (!SU.speech.recognitionSupported) {
      container.innerHTML = `<div class="card"><p class="rec-q">${esc(opts.question)}</p>${SU.ui.noRecognitionHTML()}</div>`;
      return;
    }

    container.innerHTML = `
      <div class="recorder">
        <div class="rec-q-wrap">
          <p class="rec-q">${esc(opts.question)}</p>
          ${SU.ui.sayBtn(opts.question)}
        </div>
        <div class="rec-stage idle">
          <div class="timer"><span class="timer-big">${opts.startWindow}</span><span class="timer-label">Press Start when you're ready</span></div>
          <div class="timer-bar"><div></div></div>
          <div class="rec-stats">
            <div><b class="st-words">0</b><span>words</span></div>
            <div><b class="st-pauses">0</b><span>long pauses</span></div>
            <div><b class="st-time">0:00</b><span>speaking</span></div>
          </div>
          <div class="rec-hint" aria-live="polite"></div>
          <p class="live-transcript muted"></p>
        </div>
        <div class="row center">
          <button class="btn btn-primary btn-lg start">🎤 Start</button>
          <button class="btn btn-ghost finish" hidden disabled>Finish</button>
        </div>
        <div class="rec-result"></div>
      </div>`;

    const stage = $(container, '.rec-stage');
    const big = $(container, '.timer-big'), label = $(container, '.timer-label');
    const bar = $(container, '.timer-bar div');
    const hint = $(container, '.rec-hint'), live = $(container, '.live-transcript');
    const startBtn = $(container, '.start'), finishBtn = $(container, '.finish');
    const out = $(container, '.rec-result');

    let phase = 'idle';       // idle → asking → waiting → speaking → done
    let ctrl = null, tick = null;
    let phaseStart = 0, speakStart = 0, lastActivity = 0;
    let heardSomething = false, reaction = null, froze = false;
    let pauses = 0, inPause = false, longestPause = 0, liveText = '';

    // Stop everything if you leave the page, or if a new recorder replaces this one.
    const cleanup = () => { phase = 'done'; clearInterval(tick); if (ctrl) ctrl.abort(); };
    container._suCleanup = cleanup;
    SU.app.onLeave(cleanup);

    startBtn.onclick = async () => {
      startBtn.hidden = true;
      out.innerHTML = '';
      if (opts.speakQuestion) {
        phase = 'asking';
        label.textContent = 'Listen to the question…';
        big.textContent = '👂';
        await SU.speech.speak(opts.question);
        if (phase !== 'asking') return; // page was left
      }
      beginListening();
    };

    function beginListening() {
      phase = 'waiting';
      stage.className = 'rec-stage waiting';
      phaseStart = Date.now();
      label.textContent = 'Start talking NOW!';
      hint.innerHTML = rescueHTML();
      finishBtn.hidden = false;

      ctrl = SU.speech.listen({
        continuous: true, keepAlive: true,
        onActivity: () => {
          lastActivity = Date.now();
          if (!heardSomething) {
            heardSomething = true;
            if (phase === 'waiting') {
              reaction = (Date.now() - phaseStart) / 1000;
              startSpeakingPhase();
            }
          }
          if (inPause) { inPause = false; }
        },
        onInterim: (fin, interim) => {
          liveText = (fin + ' ' + interim).trim();
          live.textContent = liveText;
          $(container, '.st-words').textContent = SU.speech.countWords(liveText);
        },
        onError: (code, msg) => {
          if (code === 'no-speech') return;
          hint.innerHTML = `<p class="bad">${esc(msg)}</p>`;
        },
        onEnd: res => finish(res)
      });

      tick = setInterval(update, 100);
    }

    function startSpeakingPhase() {
      phase = 'speaking';
      stage.className = 'rec-stage speaking';
      speakStart = Date.now();
      lastActivity = Date.now();
      label.textContent = `Keep going! Aim for ${opts.minSeconds}–${opts.maxSeconds} seconds`;
      hint.innerHTML = reaction != null ? `<p class="good small">✓ You started in ${reaction.toFixed(1)}s</p>` : '';
    }

    function update() {
      const now = Date.now();
      if (phase === 'waiting') {
        const left = opts.startWindow - (now - phaseStart) / 1000;
        big.textContent = Math.max(0, Math.ceil(left));
        bar.style.width = Math.max(0, (left / opts.startWindow) * 100) + '%';
        if (left <= 0) {
          // You froze. That's OK — the clock starts anyway, use a filler!
          froze = true;
          startSpeakingPhase();
          hint.innerHTML = `<p class="warn small">Time's up — start with a filler, don't wait for the perfect sentence!</p>` + rescueHTML();
        }
        return;
      }
      if (phase !== 'speaking') return;
      const talked = (now - speakStart) / 1000;
      big.textContent = SU.ui.fmtTime(opts.maxSeconds - talked);
      bar.style.width = Math.min(100, (talked / opts.maxSeconds) * 100) + '%';
      $(container, '.st-time').textContent = SU.ui.fmtTime(talked);
      if (talked >= opts.minSeconds) { finishBtn.disabled = false; label.textContent = 'Great! Finish whenever you want.'; }

      // Pause detection (only after you've said something).
      if (heardSomething) {
        const silence = (now - lastActivity) / 1000;
        if (silence >= PAUSE_SECONDS && !inPause) {
          inPause = true;
          pauses++;
          $(container, '.st-pauses').textContent = pauses;
        }
        if (inPause) longestPause = Math.max(longestPause, silence);
        if (silence >= HINT_SECONDS && !hint.dataset.paused) {
          hint.dataset.paused = '1';
          hint.innerHTML = rescueHTML();
          stage.classList.add('silent');
        } else if (silence < HINT_SECONDS && hint.dataset.paused) {
          delete hint.dataset.paused;
          stage.classList.remove('silent');
        }
      }
      if (talked >= opts.maxSeconds) stop();
    }

    function stop() {
      if (phase === 'done' || phase === 'stopping') return;
      phase = 'stopping';
      clearInterval(tick);
      label.textContent = 'Processing…';
      finishBtn.disabled = true;
      if (ctrl) ctrl.stop();
    }
    finishBtn.onclick = stop;

    function finish(res) {
      if (phase === 'done') return;
      const wasError = res.error && res.error !== 'no-speech' && !res.transcript && !liveText;
      phase = 'done';
      clearInterval(tick);
      stage.className = 'rec-stage done';
      finishBtn.hidden = true;

      if (wasError) {
        label.textContent = 'Something went wrong';
        big.textContent = '⚠️';
        startBtn.hidden = false;
        startBtn.textContent = '🎤 Try again';
        startBtn.onclick = () => mount(container, opts);
        return;
      }

      // Use whichever is longer: final transcript or the last live text.
      const transcript = (res.transcript.length >= liveText.length ? res.transcript : liveText).trim();
      const seconds = speakStart ? Math.min(opts.maxSeconds, (Date.now() - speakStart) / 1000) : 0;
      const words = SU.speech.countWords(transcript);
      const wpm = seconds > 5 ? Math.round(words / (seconds / 60)) : 0;
      const connectors = findConnectors(transcript);

      big.textContent = '✓';
      label.textContent = 'Done!';
      live.textContent = '';
      hint.innerHTML = '';

      // A simple fluency score out of 100 (just for tracking progress).
      const score = Math.round(
        (froze ? 5 : 20) +
        30 * Math.min(1, seconds / opts.minSeconds) +
        Math.max(0, 25 - pauses * 8) +
        25 * Math.max(0, Math.min(1, (wpm - 40) / 70)));

      const result = { question: opts.question, transcript, seconds, words, wpm, pauses, longestPause, reaction, froze, connectors, score };
      showResult(result);
      saveResult(result);
      if (opts.onDone) opts.onDone(result);
    }

    function showResult(r) {
      const lines = [];
      lines.push(r.froze
        ? `<li class="warn">🧊 You froze for ${opts.startWindow}+ seconds. Next time, start immediately with a filler like “That's a good question…”.</li>`
        : `<li class="good">⚡ You started talking in ${r.reaction != null ? r.reaction.toFixed(1) : '?'}s — no freeze!</li>`);
      lines.push(r.seconds >= opts.minSeconds
        ? `<li class="good">⏱️ You kept going for ${Math.round(r.seconds)} seconds.</li>`
        : `<li class="warn">⏱️ Only ${Math.round(r.seconds)} seconds. Try to reach ${opts.minSeconds}s: add an example or a reason.</li>`);
      lines.push(`<li>${r.wpm < 80 ? '🐢' : r.wpm <= 160 ? '👍' : '🐇'} ${r.wpm} words per minute — ${
        r.wpm < 80 ? 'slow, and that\'s fine: focus on not stopping.' :
        r.wpm < 110 ? 'a steady pace.' : r.wpm <= 160 ? 'a natural, fluent pace.' : 'very fast — slow down a little for clarity.'}</li>`);
      lines.push(r.pauses === 0
        ? '<li class="good">🌊 No long pauses — excellent flow!</li>'
        : `<li class="warn">⏸️ ${r.pauses} long pause${r.pauses > 1 ? 's' : ''} (longest ${r.longestPause.toFixed(1)}s). Fill silence with “Let me think…” or “What I mean is…”.</li>`);
      lines.push(r.connectors.length
        ? `<li class="good">🔗 Connectors used: ${r.connectors.map(c => `<b>${esc(c)}</b>`).join(', ')}</li>`
        : '<li>🔗 No connectors detected. Try “On the other hand…”, “What\'s more…”, “For instance…”.</li>');

      out.innerHTML = `
        <div class="card inset">
          <div class="result-head">
            <h3>Your answer</h3>
            <span class="pill ${SU.ui.accuracyClass(r.score)}">Fluency ${r.score}/100</span>
          </div>
          <ul class="feedback-list">${lines.join('')}</ul>
          <p class="transcript">${r.transcript ? esc(r.transcript) : '<i class="muted">(nothing was recognised)</i>'}</p>
          <div class="claude-slot"></div>
          <div class="row"><button class="btn btn-ghost again">🔁 Try the same question again</button></div>
        </div>`;
      if (r.transcript) SU.claude.mount($(out, '.claude-slot'), {
        task: r.question, transcript: r.transcript, seconds: r.seconds, words: r.words, wpm: r.wpm, pauses: r.pauses, kind: opts.kind
      });
      $(out, '.again').onclick = () => mount(container, opts);
    }

    function saveResult(r) {
      SU.store.addSpeaking(r.seconds, r.words);
      SU.store.recordResult('fluency:freeze', 'Freezing before you start speaking', 'speaking', !r.froze);
      SU.store.recordResult('fluency:pauses', 'Long pauses while speaking', 'speaking', r.pauses <= 1);
      SU.store.logExercise('speaking', opts.kind, r.score, `${r.words} words, ${Math.round(r.seconds)}s`);
      SU.store.addXP('speaking', Math.round(r.score / 10));
    }
  }

  SU.recorder = { mount, rescueHTML, findConnectors };
})();
