/*
 * placement.js — the adaptive CEFR placement test (A1 → C2).
 *
 * HOW THE ADAPTIVE PART WORKS (a "staircase"):
 *   - Each section starts at B1.
 *   - Correct answer → the next question is one level harder.
 *   - Wrong answer   → the next question is one level easier.
 *   - Your level for a section = the level where you "hover" between right
 *     and wrong. For each answer we add +0.5 (right) or -0.5 (wrong) to the
 *     question's level, average those numbers, and round down.
 *     Example: right at B2 and wrong at C1 again and again → B2.
 */
window.SU = window.SU || {};

(function () {
  const { esc, $, $$ } = SU.ui;
  const LEVELS = SU.store.LEVELS;

  const SECTIONS = [
    { id: 'grammar', label: 'Grammar', icon: '📐', count: 8, intro: 'Choose the word or phrase that best completes each sentence.' },
    { id: 'vocabulary', label: 'Vocabulary', icon: '📚', count: 8, intro: 'Choose the best word or meaning.' },
    { id: 'listening', label: 'Listening', icon: '🎧', count: 6, intro: 'Press ▶ to hear a sentence (you can play it twice), then answer the question. Use headphones if you can.' },
    { id: 'speaking', label: 'Speaking', icon: '🎙️', count: 4, intro: 'Read each sentence OUT LOUD. The app compares what it hears with the text. Find a quiet place. You get 2 attempts per sentence.' }
  ];
  const TOTAL = SECTIONS.reduce((a, s) => a + s.count, 0);
  const SPEAK_PASS = 75; // % of words recognised to count a speaking item as correct

  /* ---------- Load the question bank ----------
     Online (http/https) we read questions.json so your edits show up.
     Offline (file://) we use the copy in data/questions.js.              */
  let bankCache = null;
  SU.loadQuestions = async function () {
    if (bankCache) return bankCache;
    if (location.protocol.startsWith('http')) {
      try {
        const r = await fetch('data/questions.json', { cache: 'no-cache' });
        if (r.ok) { bankCache = await r.json(); return bankCache; }
      } catch (e) { /* fall back below */ }
    }
    bankCache = window.SU_QUESTIONS || [];
    return bankCache;
  };

  /* The test in progress (kept in memory, so you can leave and come back). */
  let T = null;

  function newTest(bank) {
    return {
      bank,
      secIdx: 0,
      cur: 2,                 // current difficulty: index in LEVELS (2 = B1)
      asked: new Set(),
      answers: { grammar: [], vocabulary: [], listening: [], speaking: [] },
      skipped: {},
      showIntro: true,        // show the section intro screen first
      number: 0               // questions answered so far
    };
  }

  /* Pick an unasked question from this section, as close as possible to `cur`. */
  function pickQuestion(section, cur) {
    const pool = T.bank.filter(q => q.section === section && !T.asked.has(q.id));
    if (!pool.length) return null;
    const dist = q => Math.abs(LEVELS.indexOf(q.level) - cur);
    const best = Math.min(...pool.map(dist));
    return SU.ui.pick(pool.filter(q => dist(q) === best));
  }

  /* The staircase estimate described at the top of this file. */
  function estimate(answers) {
    if (!answers.length) return null;
    const vals = answers.map(a => LEVELS.indexOf(a.level) + (a.correct ? 0.5 : -0.5));
    const used = vals.length > 4 ? vals.slice(2) : vals; // first answers are just "warming up"
    const mean = used.reduce((x, y) => x + y, 0) / used.length;
    return LEVELS[Math.max(0, Math.min(5, Math.floor(mean)))];
  }

  /* ===================================================================== */
  function render(container) {
    if (!T) return renderStart(container);
    if (T.secIdx >= SECTIONS.length) return renderResults(container);
    const sec = SECTIONS[T.secIdx];
    if (T.showIntro) return renderSectionIntro(container, sec);
    const q = T.current || (T.current = pickQuestion(sec.id, T.cur));
    if (!q) { nextSection(); return render(container); }
    renderQuestion(container, sec, q);
  }

  /* ---------- Start screen ---------- */
  function renderStart(container) {
    const prev = SU.store.state.placement;
    container.innerHTML = `
      <section class="card hero">
        <h1>Placement test</h1>
        <p>Find your CEFR level (A1 → C2) in <b>${TOTAL} questions</b> (about 15 minutes). The test is <b>adaptive</b>: it gets harder when you're right and easier when you're wrong, so don't worry if some questions feel very hard.</p>
        <div class="grid-4 sections-preview">
          ${SECTIONS.map(s => `<div class="mini-card"><div class="emoji">${s.icon}</div><b>${s.label}</b><span class="muted small">${s.count} questions</span></div>`).join('')}
        </div>
        ${SU.speech.recognitionSupported ? '' : SU.ui.noRecognitionHTML() + '<p class="muted small">The speaking section will be skipped.</p>'}
        ${prev ? `<p class="muted">Your last result (${new Date(prev.date).toLocaleDateString()}): ${SU.ui.levelBadge(prev.overall)} overall.</p>` : ''}
        <div class="row">
          <button class="btn btn-primary btn-lg start">Start the test</button>
          ${prev ? '<a class="btn btn-ghost" href="#/placement/result">See last result</a>' : ''}
        </div>
      </section>`;
    $(container, '.start').onclick = async () => {
      const bank = await SU.loadQuestions();
      if (!bank.length) { SU.ui.toast('Could not load the questions file.', 'error'); return; }
      T = newTest(bank);
      render(container);
    };
  }

  /* ---------- Section intro ---------- */
  function renderSectionIntro(container, sec) {
    const noMic = sec.id === 'speaking' && !SU.speech.recognitionSupported;
    container.innerHTML = `
      ${progressBar(sec)}
      <section class="card center">
        <div class="emoji-xl">${sec.icon}</div>
        <h2>Section ${T.secIdx + 1}: ${sec.label}</h2>
        <p>${sec.intro}</p>
        ${noMic ? SU.ui.noRecognitionHTML() : ''}
        <div class="row center">
          ${noMic ? '<button class="btn btn-primary skip">Skip to results</button>'
                  : '<button class="btn btn-primary go">Begin</button>'}
          ${sec.id === 'speaking' && !noMic ? '<button class="btn btn-ghost skip">Skip speaking</button>' : ''}
        </div>
        ${sec.id === 'speaking' && !noMic ? '<p class="muted small">Chrome will ask for microphone permission the first time — click <b>Allow</b>.</p>' : ''}
      </section>`;
    const go = $(container, '.go');
    if (go) go.onclick = () => { T.showIntro = false; render(container); };
    const skip = $(container, '.skip');
    if (skip) skip.onclick = () => { T.skipped[sec.id] = true; nextSection(); render(container); };
  }

  function progressBar(sec) {
    const pct = Math.round((T.number / TOTAL) * 100);
    return `
      <div class="test-top">
        <span class="chip">${sec.icon} ${sec.label}</span>
        <span class="muted small">Question ${Math.min(T.number + 1, TOTAL)} / ${TOTAL}</span>
        <button class="link-btn quit" onclick="location.hash='#/dashboard'">Exit</button>
      </div>
      <div class="progress"><div style="width:${pct}%"></div></div>`;
  }

  /* ---------- One question ---------- */
  function renderQuestion(container, sec, q) {
    if (q.section === 'speaking') return renderSpeaking(container, sec, q);

    const isListening = q.section === 'listening';
    const order = SU.ui.shuffle(q.options.map((_, i) => i));
    // Alternate US/UK accents in the listening section.
    const accent = (T.answers.listening.length % 2) ? 'en-GB' : 'en-US';
    container.innerHTML = `
      ${progressBar(sec)}
      <section class="card">
        ${isListening ? `
          <div class="listen-box">
            <button class="btn btn-primary btn-lg play">▶ Play</button>
            <span class="muted small plays">2 plays left · ${accent === 'en-GB' ? 'British' : 'American'} accent</span>
          </div>` : ''}
        <p class="quiz-q">${esc(q.q)}</p>
        <div class="options">
          ${order.map(i => `<button class="option" data-i="${i}" ${isListening ? 'disabled' : ''}>${esc(q.options[i])}</button>`).join('')}
        </div>
        <div class="quiz-feedback" aria-live="polite"></div>
      </section>`;

    if (isListening) {
      let plays = 2;
      const play = $(container, '.play');
      play.onclick = () => {
        if (plays <= 0) return;
        plays--;
        $(container, '.plays').textContent = `${plays} play${plays === 1 ? '' : 's'} left`;
        if (plays === 0) play.disabled = true;
        play.textContent = '▶ Play again';
        $$(container, '.option').forEach(b => { b.disabled = false; });
        SU.speech.speak(q.audio, { accent, rate: 0.95 });
      };
    }

    $$(container, '.option').forEach(btn => {
      btn.onclick = () => {
        const correct = Number(btn.dataset.i) === q.answer;
        $$(container, '.option').forEach(b => {
          b.disabled = true;
          if (Number(b.dataset.i) === q.answer) b.classList.add('correct');
        });
        if (!correct) btn.classList.add('wrong');
        if (isListening) $(container, '.quiz-feedback').innerHTML = `<p class="muted small">Transcript: “${esc(q.audio)}”</p>`;
        recordAnswer(q, correct);
        // Wait a moment so you can see the right answer, then continue
        // (unless you left the test page in the meantime).
        setTimeout(() => {
          if (location.hash.startsWith('#/placement')) render(container);
        }, isListening ? 2200 : 1100);
      };
    });
  }

  /* ---------- Speaking question ---------- */
  function renderSpeaking(container, sec, q) {
    let attempts = 0, best = null, ctrl = null;
    container.innerHTML = `
      ${progressBar(sec)}
      <section class="card">
        <p class="muted">Read this sentence out loud:</p>
        <p class="read-target">${esc(q.text)}</p>
        <div class="live muted" aria-live="polite"></div>
        <div class="result"></div>
        <div class="row">
          <button class="btn btn-primary btn-lg mic">🎤 Start reading</button>
          <button class="btn btn-ghost next" hidden>Next ›</button>
        </div>
        <button class="link-btn skip-sec">My microphone doesn't work — skip speaking</button>
      </section>`;
    const mic = $(container, '.mic'), live = $(container, '.live'), out = $(container, '.result'), next = $(container, '.next');

    mic.onclick = async () => {
      if (ctrl) { ctrl.stop(); return; } // second click = stop
      mic.textContent = '⏹ Stop'; mic.classList.add('recording');
      live.textContent = 'Listening… start reading now.';
      const res = await SU.speech.listenOnce({
        onController: c => { ctrl = c; },
        onInterim: (fin, interim) => { live.textContent = (fin + ' ' + interim).trim() || 'Listening…'; }
      });
      ctrl = null;
      mic.classList.remove('recording');
      live.textContent = '';
      if (!res.transcript) {
        out.innerHTML = `<p class="bad">${esc(SU.speech.errorMessage(res.error || 'no-speech'))}</p>`;
        mic.textContent = '🎤 Try again';
        return;
      }
      attempts++;
      const cmp = SU.speech.compare(q.text, res.transcript);
      SU.store.addSpeaking(res.seconds, SU.speech.countWords(res.transcript));
      if (!best || cmp.accuracy > best.accuracy) best = cmp;
      out.innerHTML = `
        ${SU.ui.wordDiffHTML(cmp.tokens)}
        <p><span class="pill ${SU.ui.accuracyClass(cmp.accuracy)}">${cmp.accuracy}% accuracy</span>
        <span class="muted small">We heard: “${esc(res.transcript)}”</span></p>`;
      next.hidden = false;
      if (attempts < 2 && cmp.accuracy < 100) mic.textContent = '🎤 Try again';
      else mic.hidden = true;
    };
    next.onclick = () => {
      if (ctrl) ctrl.abort();
      if (SU.pron && best) SU.pron.record(best);
      recordAnswer(q, best ? best.accuracy >= SPEAK_PASS : false);
      render(container);
    };
    $(container, '.skip-sec').onclick = () => {
      if (ctrl) ctrl.abort();
      T.skipped.speaking = true;
      T.number += SECTIONS[T.secIdx].count - T.answers.speaking.length;
      nextSection();
      render(container);
    };
  }

  /* ---------- After each answer ---------- */
  function recordAnswer(q, correct) {
    T.asked.add(q.id);
    T.current = null;
    T.answers[q.section].push({ id: q.id, level: q.level, topic: q.topic, correct, q });
    T.number++;
    T.cur = Math.max(0, Math.min(5, T.cur + (correct ? 1 : -1)));

    // Wrong grammar/vocabulary answers become flashcards to review later.
    if (!correct && (q.section === 'grammar' || q.section === 'vocabulary') && SU.srs) {
      const ans = q.options[q.answer];
      SU.srs.addCard({ front: q.q, back: ans, example: SU.ui.fillGap(q.q, ans), type: 'mistake', source: 'Placement test' });
    }
    const sec = SECTIONS[T.secIdx];
    if (T.answers[sec.id].length >= sec.count) nextSection();
  }

  function nextSection() {
    T.secIdx++;
    T.cur = 2;
    T.current = null;
    T.showIntro = true;
    if (T.secIdx >= SECTIONS.length) finishTest();
  }

  /* Map a speaking topic to a pronunciation weak-point key. */
  function weakKeyFor(a) {
    const t = a.topic.toLowerCase();
    if (a.q.section === 'speaking') {
      if (t.includes("'th'")) return 'pron:th';
      if (t.includes("'h'")) return 'pron:h';
      if (t.includes('short')) return 'pron:i-ee';
      if (t.includes("'v'")) return 'pron:v';
      if (t.includes('stress')) return 'pron:stress';
    }
    return 'topic:' + a.topic;
  }

  /* ---------- Save the result ---------- */
  function finishTest() {
    const st = SU.store.state;
    const levels = {};
    SU.store.SKILLS.forEach(s => { levels[s] = T.skipped[s] ? null : estimate(T.answers[s]); });

    // Update the weak-point tracker with every answer.
    const all = [].concat(...Object.values(T.answers));
    all.forEach(a => SU.store.recordResult(weakKeyFor(a), a.topic, a.q.section, a.correct));

    // Top 5 weak points of THIS test: most mistakes first, easier levels first.
    const byTopic = {};
    all.filter(a => !a.correct).forEach(a => {
      const k = a.topic;
      byTopic[k] = byTopic[k] || { label: k, section: a.q.section, level: a.level, count: 0, key: weakKeyFor(a) };
      byTopic[k].count++;
      if (LEVELS.indexOf(a.level) < LEVELS.indexOf(byTopic[k].level)) byTopic[k].level = a.level;
    });
    const weak = Object.values(byTopic)
      .sort((a, b) => b.count - a.count || LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level))
      .slice(0, 5);

    const prevLevels = st.placement ? st.placement.levels : null;
    SU.store.SKILLS.forEach(s => {
      if (levels[s]) { st.skills[s].level = levels[s]; st.skills[s].xp = 0; }
    });
    const correctCount = all.filter(a => a.correct).length;
    st.placement = { date: Date.now(), levels, overall: SU.store.overallLevel(), weak, prevLevels, score: correctCount, total: all.length };
    SU.store.logExercise('placement', 'Placement test', all.length ? (correctCount / all.length) * 100 : 0, 'Overall ' + st.placement.overall);
  }

  /* ---------- Results screen ---------- */
  function renderResults(container) {
    T = null; // the test is over; next visit starts fresh
    location.hash = '#/placement/result';
  }

  function renderResultPage(container) {
    const p = SU.store.state.placement;
    if (!p) { location.hash = '#/placement'; return; }
    const skills = SU.store.SKILLS;
    const label = s => s[0].toUpperCase() + s.slice(1);
    const link = w => ({
      speaking: '#/speak/pairs', listening: '#/speak/shadow', grammar: '#/lessons', vocabulary: '#/cards'
    })[w.section] || '#/daily';

    container.innerHTML = `
      <section class="card hero center">
        <p class="muted">Your overall level</p>
        <div class="big-level">${SU.ui.levelBadge(p.overall, 'xl')}</div>
        <p>${describe(p.overall)}</p>
        <p class="muted small">${p.score}/${p.total} correct · ${new Date(p.date).toLocaleDateString()}</p>
      </section>
      <div class="grid-2">
        <section class="card">
          <h2>Level per skill</h2>
          <canvas class="radar" aria-label="Radar chart of your levels"></canvas>
          <ul class="skill-list">
            ${skills.map(s => `<li><span>${label(s)}</span>${p.levels[s] ? SU.ui.levelBadge(p.levels[s]) : '<span class="muted small">not tested</span>'}
              ${p.prevLevels && p.prevLevels[s] ? `<span class="muted small">(before: ${p.prevLevels[s]})</span>` : ''}</li>`).join('')}
          </ul>
          <p class="muted small">Dashed green ring = your goal (C1).${p.prevLevels ? ' Dashed grey = previous test.' : ''}</p>
        </section>
        <section class="card">
          <h2>Your top ${p.weak.length || ''} weak points</h2>
          ${p.weak.length ? `<ol class="weak-list">
            ${p.weak.map(w => `<li><div><b>${esc(w.label)}</b><br><span class="muted small">${label(w.section)} · from ${w.level}</span></div>
              <a class="btn btn-small" href="${link(w)}">Practise</a></li>`).join('')}
          </ol>` : '<p>No mistakes — impressive! Try the speaking trainer at a higher level.</p>'}
          <p class="muted small">Grammar and vocabulary mistakes were added to your flashcards. Your daily session will focus on these points.</p>
        </section>
      </div>
      <div class="row center">
        <a class="btn btn-primary btn-lg" href="#/daily">Start today's session</a>
        <a class="btn btn-ghost" href="#/speak/read">Speaking trainer</a>
        <a class="btn btn-ghost" href="#/placement">Retake test</a>
      </div>`;

    const toNum = l => (l ? LEVELS.indexOf(l) + 1 : 0);
    const canvas = $(container, '.radar');
    const drawIt = () => SU.radar.draw(canvas, {
      labels: skills.map(label),
      values: skills.map(s => toNum(p.levels[s])),
      compare: p.prevLevels ? skills.map(s => toNum(p.prevLevels[s])) : null,
      target: 5
    });
    requestAnimationFrame(drawIt);
  }

  function describe(level) {
    return ({
      A1: 'Beginner: you can use simple everyday phrases.',
      A2: 'Elementary: you can talk about familiar, routine things.',
      B1: 'Intermediate: you can deal with most everyday situations and describe experiences.',
      B2: 'Upper-intermediate: you can talk fluently and spontaneously with native speakers on many topics.',
      C1: 'Advanced: you express yourself fluently and flexibly, without much obvious searching for words.',
      C2: 'Proficient: you understand virtually everything and express yourself with precision.'
    })[level] || '';
  }

  SU.placement = { render, renderResultPage, estimate };
})();
