/*
 * speaking.js — the Speaking trainer (the most important part of SpeakUp).
 *
 * Tabs:
 *   read    Read-aloud drills: each word turns green (said) or red (missed)
 *   shadow  Shadowing: the app speaks, you repeat immediately
 *   fast    Answer fast: beat the freeze (uses recorder.js)
 *   pairs   Minimal pairs: th/s/z, i/ee, v/f, p/b, h, word stress
 *   phrases Useful phrases bank
 *
 * The drill and minimal-pair components can also be "mounted" inside
 * other pages (the daily session uses them).
 */
window.SU = window.SU || {};

(function () {
  const { esc, $, $$ } = SU.ui;
  const C = window.SU_CONTENT;
  const LEVELS = SU.store.LEVELS;

  /* =====================================================================
   * PRONUNCIATION TRACKING
   * When a word is missed, we guess which difficult sound it contains
   * (by spelling) and update that weak point. Not perfect, but useful.
   * ===================================================================== */
  const SOUND_TAGS = [
    { key: 'pron:th', label: "Pronunciation: 'th' sounds", test: w => w.includes('th') },
    { key: 'pron:h', label: "Pronunciation: 'h' at the start of words", test: w => /^h[aeiouy]/.test(w) && !/^(hour|honest|honour|heir)/.test(w) },
    { key: 'pron:v', label: "Pronunciation: 'v' sound", test: w => w.includes('v') },
    { key: 'pron:i-ee', label: "Pronunciation: short 'i' vs long 'ee'", test: w => /ee|ea/.test(w) || /^[^aeiou]*i[^aeiou]+$/.test(w) },
    { key: 'pron:endings', label: 'Word endings (-s, -ed)', test: w => w.length > 3 && /[^s]s$|ed$/.test(w) }
  ];

  SU.pron = {
    /* Update weak points + missed words from a compare() result. */
    record(cmp) {
      cmp.tokens.forEach(t => {
        const w = t.text.toLowerCase().replace(/[^a-z']/g, '');
        if (!w) return;
        if (!t.ok) SU.store.addMissedWord(w);
        SOUND_TAGS.forEach(tag => { if (tag.test(w)) SU.store.recordResult(tag.key, tag.label, 'speaking', t.ok); });
      });
    }
  };

  /* The user's speaking level, or B1 by default. */
  function defaultLevel() {
    return SU.store.state.skills.speaking.level || SU.store.overallLevel() || 'B1';
  }

  /* =====================================================================
   * 1. SENTENCE DRILL (read-aloud or shadowing)
   * SU.speaking.mountDrill(container, { mode: 'read'|'shadow', sentences, onDone })
   * ===================================================================== */
  function mountDrill(container, opts) {
    const mode = opts.mode || 'read';
    const sentences = opts.sentences;
    let idx = 0;
    const results = []; // best accuracy per sentence
    let rate = mode === 'shadow' ? 0.85 : 1;
    let showText = mode === 'read';
    let ctrl = null;

    if (container._suCleanup) container._suCleanup();
    container._suCleanup = () => { if (ctrl) ctrl.abort(); };
    SU.app.onLeave(container._suCleanup);

    function render() {
      if (idx >= sentences.length) return renderSummary();
      const s = sentences[idx];
      container.innerHTML = `
        <div class="drill">
          <div class="drill-top">
            <span class="muted small">Sentence ${idx + 1} of ${sentences.length}</span>
            ${mode === 'shadow' ? `
              <label class="speed">🐢 <input type="range" min="0.6" max="1.1" step="0.05" value="${rate}" aria-label="Voice speed"> <span class="rate-val">${rate.toFixed(2)}×</span></label>` : ''}
          </div>
          <p class="read-target ${showText ? '' : 'blurred'}">${esc(s)}</p>
          ${mode === 'shadow' ? `<button class="link-btn toggle-text">${showText ? 'Hide text' : 'Show text'}</button>` : ''}
          <p class="live muted" aria-live="polite"></p>
          <div class="result"></div>
          <div class="row">
            ${mode === 'read'
              ? `<button class="btn btn-ghost listen">🔊 Listen first</button>
                 <button class="btn btn-primary btn-lg mic">🎤 Speak</button>`
              : `<button class="btn btn-primary btn-lg shadow-go">▶ Play &amp; repeat</button>`}
            <button class="btn btn-ghost next" ${SU.speech.recognitionSupported ? 'hidden' : ''}>Next ›</button>
          </div>
          ${SU.speech.recognitionSupported ? '' : SU.ui.noRecognitionHTML()}
        </div>`;

      const live = $(container, '.live'), out = $(container, '.result'), next = $(container, '.next');
      const slider = $(container, 'input[type=range]');
      if (slider) slider.oninput = () => { rate = Number(slider.value); $(container, '.rate-val').textContent = rate.toFixed(2) + '×'; };
      const toggle = $(container, '.toggle-text');
      if (toggle) toggle.onclick = () => {
        showText = !showText;
        $(container, '.read-target').classList.toggle('blurred', !showText);
        toggle.textContent = showText ? 'Hide text' : 'Show text';
      };
      const listenBtn = $(container, '.listen');
      if (listenBtn) listenBtn.onclick = () => SU.speech.speak(s, { rate });

      // One recording attempt → compare → show coloured words.
      async function attempt(btn) {
        if (ctrl) { ctrl.stop(); return; }
        btn.classList.add('recording');
        btn.textContent = '⏹ Stop';
        live.textContent = mode === 'shadow' ? '🗣️ Your turn — repeat now!' : 'Listening… read the sentence.';
        const res = await SU.speech.listenOnce({
          onController: c => { ctrl = c; },
          onInterim: (f, i) => { live.textContent = (f + ' ' + i).trim() || live.textContent; }
        });
        ctrl = null;
        btn.classList.remove('recording');
        btn.textContent = mode === 'read' ? '🎤 Again' : '▶ Again';
        live.textContent = '';
        if (!res.transcript) {
          out.innerHTML = `<p class="bad">${esc(SU.speech.errorMessage(res.error || 'no-speech'))}</p>`;
          return;
        }
        const cmp = SU.speech.compare(s, res.transcript);
        results[idx] = Math.max(results[idx] || 0, cmp.accuracy);
        SU.store.addSpeaking(res.seconds, SU.speech.countWords(res.transcript));
        SU.pron.record(cmp);
        SU.store.addXP('speaking', cmp.accuracy >= 85 ? 2 : 1);
        const missed = cmp.tokens.filter(t => !t.ok);
        out.innerHTML = `
          <div class="${showText ? '' : 'reveal'}">${SU.ui.wordDiffHTML(cmp.tokens)}</div>
          <p><span class="pill ${SU.ui.accuracyClass(cmp.accuracy)}">${cmp.accuracy}%</span>
            <span class="muted small">We heard: “${esc(res.transcript)}”</span></p>
          ${missed.length ? `<p class="small">Practise: ${missed.slice(0, 6).map(t => SU.ui.sayBtn(t.text.replace(/[^\w'-]/g, ''), '🔊 ' + esc(t.text.replace(/[^\w'-]/g, '')), 'data-rate="0.8"')).join(' ')}</p>` : '<p class="good small">Every word recognised! 🎉</p>'}`;
        next.hidden = false;
      }

      const micBtn = $(container, '.mic');
      if (micBtn) micBtn.onclick = () => attempt(micBtn);
      const shadowBtn = $(container, '.shadow-go');
      if (shadowBtn) shadowBtn.onclick = async () => {
        if (ctrl) { ctrl.stop(); return; }
        shadowBtn.disabled = true;
        live.textContent = '👂 Listen…';
        await SU.speech.speak(s, { rate });
        shadowBtn.disabled = false;
        attempt(shadowBtn); // start listening immediately after the voice ends
      };
      next.onclick = () => { if (ctrl) ctrl.abort(); idx++; render(); };
    }

    function renderSummary() {
      const done = results.filter(x => x != null);
      const avg = done.length ? Math.round(done.reduce((a, b) => a + b, 0) / done.length) : 0;
      SU.store.logExercise('speaking', mode === 'read' ? 'Read-aloud drill' : 'Shadowing', avg, `${done.length} sentences`);
      const missed = SU.store.topMissedWords(8);
      container.innerHTML = `
        <div class="center">
          <div class="big-score ${SU.ui.accuracyClass(avg)}">${avg}%</div>
          <p>Average accuracy over ${done.length} sentence${done.length === 1 ? '' : 's'}.</p>
          ${missed.length ? `<p class="small">Words you often miss: ${missed.map(w => SU.ui.sayBtn(w, '🔊 ' + esc(w), 'data-rate="0.8"')).join(' ')}</p>` : ''}
          ${opts.onDone ? '' : '<button class="btn btn-primary again">Another set</button>'}
        </div>`;
      const again = $(container, '.again');
      if (again) again.onclick = () => { if (opts.onAgain) opts.onAgain(); };
      if (opts.onDone) opts.onDone(avg);
    }

    render();
  }

  /* =====================================================================
   * 2. MINIMAL PAIRS
   * SU.speaking.mountPairs(container, categoryId, { mode, rounds, onDone })
   * mode: 'listen' (hear one word, choose which) or 'say' (say a word)
   * ===================================================================== */
  function mountPairs(container, catId, opts) {
    opts = opts || {};
    const cat = C.minimalPairs.find(c => c.id === catId);
    const rounds = opts.rounds || 8;
    let mode = opts.mode || 'listen';
    let round = 0, score = 0, ctrl = null;
    const isStress = cat.type === 'stress';
    if (container._suCleanup) container._suCleanup();
    container._suCleanup = () => { if (ctrl) ctrl.abort(); };
    SU.app.onLeave(container._suCleanup);

    // Build the list of rounds.
    let items = isStress
      ? SU.ui.shuffle(cat.words).slice(0, rounds)
      : SU.ui.shuffle(cat.pairs).slice(0, rounds).map(p => {
          const t = Math.random() < 0.5 ? 0 : 1;
          return { pair: p, target: p[t], other: p[1 - t] };
        });
    while (items.length < rounds && !isStress) items = items.concat(items).slice(0, rounds);

    function header() {
      return `
        <div class="pairs-head">
          <div><h3>${esc(cat.title)}</h3><p class="muted small">${esc(cat.tip)}</p></div>
          ${opts.lockMode ? '' : `<div class="seg">
            <button class="seg-btn ${mode === 'listen' ? 'active' : ''}" data-mode="listen">👂 Listen &amp; choose</button>
            <button class="seg-btn ${mode === 'say' ? 'active' : ''}" data-mode="say">🎤 Say it</button>
          </div>`}
        </div>
        <div class="progress thin"><div style="width:${(round / items.length) * 100}%"></div></div>`;
    }

    function bindHeader() {
      $$(container, '.seg-btn').forEach(b => b.onclick = () => {
        if (ctrl) ctrl.abort();
        mode = b.dataset.mode; round = 0; score = 0; render();
      });
    }

    function render() {
      if (round >= items.length) return summary();
      const it = items[round];
      if (isStress) return renderStress(it);
      if (mode === 'listen') {
        const order = SU.ui.shuffle(it.pair);
        container.innerHTML = `${header()}
          <div class="pair-round center">
            <p>Which word do you hear?</p>
            <button class="btn btn-primary btn-lg play">🔊 Play</button>
            <div class="pair-options">
              ${order.map(w => `<button class="option big" data-w="${esc(w)}">${esc(w)}</button>`).join('')}
            </div>
            <div class="fb" aria-live="polite"></div>
          </div>`;
        bindHeader();
        const play = () => SU.speech.speak(it.target, { rate: 0.85 });
        $(container, '.play').onclick = play;
        setTimeout(play, 300);
        $$(container, '.option').forEach(btn => btn.onclick = () => {
          const ok = btn.dataset.w === it.target;
          if (ok) score++;
          $$(container, '.option').forEach(b => { b.disabled = true; if (b.dataset.w === it.target) b.classList.add('correct'); });
          if (!ok) btn.classList.add('wrong');
          $(container, '.fb').innerHTML = `<p class="${ok ? 'good' : 'bad'}">${ok ? '✓ Correct' : '✗ It was “' + esc(it.target) + '”'}</p>
            <p class="small">Compare: ${SU.ui.sayBtn(it.pair[0], '🔊 ' + esc(it.pair[0]), 'data-rate="0.8"')} ${SU.ui.sayBtn(it.pair[1], '🔊 ' + esc(it.pair[1]), 'data-rate="0.8"')}</p>
            <button class="btn btn-primary next">Next ›</button>`;
          $(container, '.next').onclick = () => { round++; render(); };
        });
      } else {
        container.innerHTML = `${header()}
          <div class="pair-round center">
            <p>Say this word clearly (not “${esc(it.other)}”):</p>
            <p class="say-word">${esc(it.target)} ${SU.ui.sayBtn(it.target, '🔊', 'data-rate="0.8"')}</p>
            <button class="btn btn-primary btn-lg mic">🎤 Say it</button>
            <div class="fb" aria-live="polite"></div>
            ${SU.speech.recognitionSupported ? '' : SU.ui.noRecognitionHTML()}
          </div>`;
        bindHeader();
        const mic = $(container, '.mic');
        mic.onclick = async () => {
          if (ctrl) { ctrl.stop(); return; }
          mic.textContent = '⏹ Stop'; mic.classList.add('recording');
          const res = await SU.speech.listenOnce({ maxAlternatives: 5, interim: false, onController: c => { ctrl = c; } });
          ctrl = null;
          mic.textContent = '🎤 Try again'; mic.classList.remove('recording');
          const fb = $(container, '.fb');
          if (!res.transcript) { fb.innerHTML = `<p class="bad">${esc(SU.speech.errorMessage(res.error || 'no-speech'))}</p>`; return; }
          SU.store.addSpeaking(res.seconds, 1);
          // The browser gives several guesses. Check the best guess first.
          const words = res.alternatives.map(a => SU.speech.normalize(a));
          const top = words[0] || [];
          const target = SU.speech.normalize(it.target)[0], other = SU.speech.normalize(it.other)[0];
          let ok, msg;
          if (top.includes(target)) { ok = true; msg = '✓ Clear! We heard “' + esc(it.target) + '”.'; }
          else if (top.includes(other)) { ok = false; msg = `✗ That sounded like “${esc(it.other)}”. Listen and try again.`; }
          else if (words.some(w => w.includes(target))) { ok = true; msg = '≈ Almost — it was one of our guesses. Exaggerate the sound a little more.'; }
          else { ok = false; msg = `✗ We heard “${esc(res.alternatives[0])}”. Try again, slowly.`; }
          fb.innerHTML = `<p class="${ok ? 'good' : 'bad'}">${msg}</p><button class="btn btn-primary next">Next ›</button>`;
          // Only your FIRST attempt counts towards the score (retries are practice).
          if (!fb.dataset.tried) { fb.dataset.tried = '1'; if (ok) score++; }
          $(container, '.next').onclick = () => { round++; render(); };
        };
      }
    }

    /* Word stress: hear the word, choose the stressed syllable, then repeat. */
    function renderStress(it) {
      container.innerHTML = `${header()}
        <div class="pair-round center">
          <p>Listen. Which syllable is <b>stressed</b> in “${esc(it.word)}”?</p>
          <button class="btn btn-primary btn-lg play">🔊 Play</button>
          <div class="pair-options">
            ${it.syl.map((_, si) => `<button class="option big" data-i="${si}">${it.syl.map((s, k) => k === si ? `<b>${esc(s.toUpperCase())}</b>` : esc(s)).join('·')}</button>`).join('')}
          </div>
          <div class="fb" aria-live="polite"></div>
        </div>`;
      bindHeader();
      const play = () => SU.speech.speak(it.word, { rate: 0.8 });
      $(container, '.play').onclick = play;
      setTimeout(play, 300);
      $$(container, '.option').forEach(btn => btn.onclick = () => {
        const ok = Number(btn.dataset.i) === it.stress;
        if (ok) score++;
        $$(container, '.option').forEach(b => { b.disabled = true; if (Number(b.dataset.i) === it.stress) b.classList.add('correct'); });
        if (!ok) btn.classList.add('wrong');
        $(container, '.fb').innerHTML = `<p class="${ok ? 'good' : 'bad'}">${ok ? '✓ Correct' : '✗ Not quite'} — ${it.syl.map((s, k) => k === it.stress ? '<b>' + esc(s.toUpperCase()) + '</b>' : esc(s)).join('')}</p>
          <p class="small muted">Now say it 3 times out loud, making the stressed syllable LOUDER and LONGER.</p>
          <button class="btn btn-primary next">Next ›</button>`;
        $(container, '.next').onclick = () => { round++; render(); };
      });
    }

    function summary() {
      const pct = Math.round((score / items.length) * 100);
      // Record the result once per round for the weak-point tracker.
      SU.store.recordResult(cat.weakKey, 'Pronunciation: ' + cat.title, 'speaking', pct >= 75);
      SU.store.logExercise('speaking', 'Minimal pairs: ' + cat.title, pct, mode);
      SU.store.addXP(mode === 'listen' ? 'listening' : 'speaking', Math.round(pct / 20));
      container.innerHTML = `${header()}
        <div class="center">
          <div class="big-score ${SU.ui.accuracyClass(pct)}">${score}/${items.length}</div>
          <p>${pct >= 85 ? 'Excellent ear and mouth! 🎉' : pct >= 60 ? 'Good — keep training this sound.' : 'This sound is hard — that\'s exactly why we practise it. Try again tomorrow.'}</p>
          ${opts.onDone ? '' : '<button class="btn btn-primary again">Again</button>'}
        </div>`;
      bindHeader();
      const again = $(container, '.again');
      if (again) again.onclick = () => mountPairs(container, catId, Object.assign({}, opts, { mode }));
      if (opts.onDone) opts.onDone(pct);
    }

    render();
  }

  /* =====================================================================
   * THE SPEAKING PAGE
   * ===================================================================== */
  const TABS = [
    { id: 'read', label: '📖 Read aloud' },
    { id: 'shadow', label: '🗣️ Shadowing' },
    { id: 'fast', label: '⚡ Answer fast' },
    { id: 'pairs', label: '👄 Minimal pairs' },
    { id: 'phrases', label: '💬 Phrases' }
  ];

  let chosenLevel = null;

  function render(container, tab) {
    tab = TABS.some(t => t.id === tab) ? tab : 'read';
    container.innerHTML = `
      <h1>Speaking trainer</h1>
      <nav class="tabs" role="tablist">
        ${TABS.map(t => `<a role="tab" href="#/speak/${t.id}" class="tab ${t.id === tab ? 'active' : ''}">${t.label}</a>`).join('')}
      </nav>
      <section class="card tab-body"></section>`;
    const body = $(container, '.tab-body');
    ({ read: renderDrillTab, shadow: renderDrillTab, fast: renderFast, pairs: renderPairsTab, phrases: renderPhrases })[tab](body, tab);
  }

  function levelChips(current) {
    return `<div class="chips level-chips">${LEVELS.map(l =>
      `<button class="chip-btn ${l === current ? 'active' : ''}" data-level="${l}">${l}</button>`).join('')}</div>`;
  }

  function renderDrillTab(body, tab) {
    const level = chosenLevel || defaultLevel();
    body.innerHTML = `
      <div class="tab-intro">
        <p>${tab === 'read'
          ? 'Read the sentence out loud. Words turn <span class="w w-ok">green</span> when recognised and <span class="w w-miss">red</span> when missed.'
          : 'Listen, then repeat <b>immediately</b> — copy the rhythm and melody, not just the words. Slow the voice down if you need to.'}</p>
        ${levelChips(level)}
      </div>
      <div class="drill-slot"></div>
      <p class="muted small">Note: speech recognition "guesses" words from context, so 100% doesn't guarantee perfect pronunciation — but red words are a strong signal to practise.</p>`;
    $$(body, '.chip-btn').forEach(b => b.onclick = () => { chosenLevel = b.dataset.level; renderDrillTab(body, tab); });
    const start = () => mountDrill($(body, '.drill-slot'), {
      mode: tab, sentences: SU.ui.shuffle(C.sentences[level]).slice(0, 5), onAgain: start
    });
    start();
  }

  function bandFor(level) {
    const i = LEVELS.indexOf(level);
    return i <= 1 ? 'easy' : i === 2 ? 'medium' : i === 3 ? 'hard' : 'expert';
  }

  function renderFast(body) {
    const level = chosenLevel || defaultLevel();
    const secs = SU.store.state.settings.fastSeconds || 60;
    body.innerHTML = `
      <div class="tab-intro">
        <p>Beat the freeze: you'll hear a question, then you have <b>5 seconds</b> to start talking. Keep going for <b>30–${secs} seconds</b>. Imperfect English is fine — <b>silence is the enemy</b>.</p>
        ${levelChips(level)}
      </div>
      <div class="fast-slot"></div>
      <div class="row center"><button class="btn btn-ghost new-q">🎲 New question</button></div>`;
    $$(body, '.chip-btn').forEach(b => b.onclick = () => { chosenLevel = b.dataset.level; renderFast(body); });
    const pool = C.fastQuestions.filter(q => q.band === bandFor(level));
    const go = () => {
      SU.recorder.mount($(body, '.fast-slot'), {
        question: SU.ui.pick(pool).q, kind: 'Answer fast', minSeconds: 30, maxSeconds: secs, startWindow: 5
      });
    };
    $(body, '.new-q').onclick = go;
    go();
  }

  function renderPairsTab(body) {
    body.innerHTML = `
      <div class="tab-intro"><p>Sounds that are hard for French and Arabic speakers. Train your <b>ear</b> first (listen &amp; choose), then your <b>mouth</b> (say it).</p></div>
      <div class="grid-3 pair-cats">
        ${C.minimalPairs.map(c => {
          const w = SU.store.state.weakPoints[c.weakKey];
          const weak = w && w.misses * 2 - w.hits > 0;
          return `<button class="mini-card cat" data-id="${c.id}">
            <b>${esc(c.title)}</b>
            <span class="muted small">${c.type === 'stress' ? c.words.length + ' words' : c.pairs.slice(0, 2).map(p => p.join('/')).join(', ') + '…'}</span>
            ${weak ? '<span class="tag-weak">weak point</span>' : ''}
          </button>`;
        }).join('')}
      </div>
      <div class="pairs-slot"></div>`;
    $$(body, '.cat').forEach(b => b.onclick = () => {
      $$(body, '.cat').forEach(x => x.classList.toggle('active', x === b));
      const slot = $(body, '.pairs-slot');
      mountPairs(slot, b.dataset.id, {});
      slot.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function renderPhrases(body) {
    body.innerHTML = `
      <div class="tab-intro">
        <p>Learn these by heart so you <b>never freeze</b>. Click 🔊 to hear, 🎤 to practise, ➕ to add to your flashcards.</p>
      </div>
      ${C.phrases.map(cat => `
        <details class="phrase-cat" ${cat.id === 'time' ? 'open' : ''}>
          <summary><span>${cat.icon} ${esc(cat.title)}</span><span class="muted small">${cat.items.length}</span></summary>
          <ul class="phrase-list">
            ${cat.items.map(p => `
              <li data-phrase="${esc(p)}">
                <span class="phrase">${esc(p)}</span>
                <span class="phrase-actions">
                  ${SU.ui.sayBtn(p)}
                  ${SU.speech.recognitionSupported ? '<button class="btn-icon practise" title="Practise saying it">🎤</button>' : ''}
                  <button class="btn-icon add" title="Add to flashcards">➕</button>
                </span>
                <span class="phrase-result"></span>
              </li>`).join('')}
          </ul>
          <button class="btn btn-small add-all" data-cat="${cat.id}">➕ Add all to flashcards</button>
        </details>`).join('')}`;

    let ctrl = null;
    SU.app.onLeave(() => { if (ctrl) ctrl.abort(); });
    $$(body, '.practise').forEach(btn => btn.onclick = async () => {
      const li = btn.closest('li'), phrase = li.dataset.phrase, out = $(li, '.phrase-result');
      if (ctrl) { ctrl.stop(); return; }
      btn.textContent = '⏹'; btn.classList.add('recording');
      const res = await SU.speech.listenOnce({ onController: c => { ctrl = c; } });
      ctrl = null; btn.textContent = '🎤'; btn.classList.remove('recording');
      if (!res.transcript) { out.innerHTML = `<span class="bad small">${esc(SU.speech.errorMessage(res.error || 'no-speech'))}</span>`; return; }
      const cmp = SU.speech.compare(phrase.replace(/\.\.\./g, ''), res.transcript);
      SU.store.addSpeaking(res.seconds, SU.speech.countWords(res.transcript));
      out.innerHTML = `${SU.ui.wordDiffHTML(cmp.tokens)} <span class="pill ${SU.ui.accuracyClass(cmp.accuracy)}">${cmp.accuracy}%</span>`;
    });
    const addPhrase = p => SU.srs.addCard({ front: p, back: 'Useful phrase — say it out loud', example: p, type: 'phrase', source: 'Phrases bank' });
    $$(body, '.add').forEach(btn => btn.onclick = () => {
      const ok = addPhrase(btn.closest('li').dataset.phrase);
      SU.ui.toast(ok ? 'Added to flashcards' : 'Already in your flashcards', ok ? 'success' : '');
    });
    $$(body, '.add-all').forEach(btn => btn.onclick = () => {
      const cat = C.phrases.find(c => c.id === btn.dataset.cat);
      const n = cat.items.filter(addPhrase).length;
      SU.ui.toast(`${n} phrase${n === 1 ? '' : 's'} added to flashcards`, 'success');
    });
  }

  SU.speaking = { render, mountDrill, mountPairs, bandFor, defaultLevel };
})();
