/*
 * lessons.js — levels (A1 → C2), each with units of 4 steps:
 *   1. Vocabulary   2. Grammar point   3. Listening   4. Speaking task
 *
 * The content lives in data/content.js (SU_CONTENT.units).
 * Progress is saved in SU.store.state.units[unitId].
 */
window.SU = window.SU || {};

(function () {
  const { esc, $, $$ } = SU.ui;
  const store = SU.store;
  const STEPS = [
    { id: 'vocab', label: 'Vocabulary', icon: '📚' },
    { id: 'grammar', label: 'Grammar', icon: '📐' },
    { id: 'listening', label: 'Listening', icon: '🎧' },
    { id: 'speaking', label: 'Speaking', icon: '🎙️' }
  ];
  const units = () => window.SU_CONTENT.units;

  function progress(unitId) {
    const p = store.state.units[unitId] || (store.state.units[unitId] = { steps: {}, scores: {}, done: false });
    return p;
  }
  function stepsDone(unitId) {
    const p = store.state.units[unitId];
    return p ? STEPS.filter(s => p.steps[s.id]).length : 0;
  }

  /* The next unit you haven't finished, starting at your level. */
  function nextUnit() {
    const lvl = store.overallLevel() || 'A2';
    const all = units();
    const startIdx = Math.max(0, all.findIndex(u => u.level === lvl));
    return all.slice(startIdx).find(u => !progress(u.id).done) || all.find(u => !progress(u.id).done) || null;
  }

  function completeStep(unit, stepId, score) {
    const p = progress(unit.id);
    const wasDone = p.done;
    p.steps[stepId] = true;
    if (score != null) p.scores[stepId] = Math.round(score);
    if (!wasDone && STEPS.every(s => p.steps[s.id])) {
      p.done = true;
      const sc = Object.values(p.scores);
      store.logExercise('lesson', 'Unit: ' + unit.title, sc.length ? sc.reduce((a, b) => a + b, 0) / sc.length : null, unit.level);
      SU.ui.toast('🎉 Unit complete: ' + unit.title, 'success');
    }
    store.save();
  }

  /* ---------- Lessons overview page ---------- */
  function renderList(container) {
    const myLevel = store.overallLevel();
    const next = nextUnit();
    container.innerHTML = `
      <h1>Lessons</h1>
      ${next ? `<section class="card highlight row space wrap">
        <div><p class="muted small">Recommended next</p><h2>${SU.ui.levelBadge(next.level)} ${esc(next.title)}</h2></div>
        <a class="btn btn-primary" href="#/lesson/${next.id}">Continue ›</a>
      </section>` : ''}
      ${store.LEVELS.map(level => {
        const list = units().filter(u => u.level === level);
        if (!list.length) return '';
        return `<section class="level-block ${level === myLevel ? 'mine' : ''}">
          <h2>${SU.ui.levelBadge(level)} ${levelName(level)} ${level === myLevel ? '<span class="chip">your level</span>' : ''}</h2>
          <div class="grid-2">
            ${list.map(u => {
              const n = stepsDone(u.id);
              return `<a class="unit-card" href="#/lesson/${u.id}">
                <div><b>${esc(u.title)}</b><p class="muted small">${esc(u.grammar.title)}</p></div>
                <div class="unit-steps">${STEPS.map(s => `<span class="dot ${progress(u.id).steps[s.id] ? 'on' : ''}" title="${s.label}"></span>`).join('')}</div>
                <span class="small ${n === 4 ? 'good' : 'muted'}">${n === 4 ? '✓ Done' : n + '/4'}</span>
              </a>`;
            }).join('')}
          </div>
        </section>`;
      }).join('')}`;
  }

  function levelName(l) {
    return { A1: 'Beginner', A2: 'Elementary', B1: 'Intermediate', B2: 'Upper-intermediate', C1: 'Advanced', C2: 'Proficient' }[l];
  }

  /* ---------- One unit ---------- */
  function renderUnit(container, unitId, stepId) {
    const unit = units().find(u => u.id === unitId);
    if (!unit) { container.innerHTML = '<p>Unit not found. <a href="#/lessons">Back to lessons</a></p>'; return; }
    const p = progress(unit.id);
    stepId = STEPS.some(s => s.id === stepId) ? stepId : (STEPS.find(s => !p.steps[s.id]) || STEPS[0]).id;

    container.innerHTML = `
      <a class="link-btn" href="#/lessons">‹ All lessons</a>
      <h1>${SU.ui.levelBadge(unit.level)} ${esc(unit.title)}</h1>
      <nav class="stepper">
        ${STEPS.map((s, i) => `<a href="#/lesson/${unit.id}/${s.id}" class="step ${s.id === stepId ? 'active' : ''} ${p.steps[s.id] ? 'done' : ''}">
          <span class="step-num">${p.steps[s.id] ? '✓' : i + 1}</span><span class="step-label">${s.icon} ${s.label}</span></a>`).join('')}
      </nav>
      <section class="card step-body"></section>
      <div class="row space step-nav"></div>`;
    const body = $(container, '.step-body');
    const idx = STEPS.findIndex(s => s.id === stepId);
    const nav = $(container, '.step-nav');
    const nextHref = idx < STEPS.length - 1 ? `#/lesson/${unit.id}/${STEPS[idx + 1].id}` : '#/lessons';
    nav.innerHTML = `
      ${idx > 0 ? `<a class="btn btn-ghost" href="#/lesson/${unit.id}/${STEPS[idx - 1].id}">‹ ${STEPS[idx - 1].label}</a>` : '<span></span>'}
      <a class="btn btn-ghost next-step" href="${nextHref}">${idx < STEPS.length - 1 ? STEPS[idx + 1].label + ' ›' : 'Back to lessons'}</a>`;
    const done = score => {
      completeStep(unit, stepId, score);
      $(container, `.step.active`).classList.add('done');
      const nx = $(container, '.next-step');
      nx.classList.replace('btn-ghost', 'btn-primary');
    };
    ({ vocab: stepVocab, grammar: stepGrammar, listening: stepListening, speaking: stepSpeaking })[stepId](body, unit, done);
  }

  function stepVocab(body, unit, done) {
    body.innerHTML = `
      <p>Learn these words. Listen 🔊, then say each example sentence out loud.</p>
      <ul class="vocab-list">
        ${unit.vocab.map(v => `<li>
          <div class="vocab-word"><b>${esc(v.word)}</b> ${SU.ui.sayBtn(v.word)}</div>
          <div class="muted">${esc(v.def)}</div>
          <div class="vocab-ex">“${esc(v.ex)}” ${SU.ui.sayBtn(v.ex)}</div>
        </li>`).join('')}
      </ul>
      <div class="row center"><button class="btn btn-primary learned">✓ I've studied these — add to my flashcards</button></div>`;
    $(body, '.learned').onclick = e => {
      const n = unit.vocab.filter(v => SU.srs.addCard({ front: v.word, back: v.def, example: v.ex, type: 'vocab', source: unit.title })).length;
      store.addXP('vocabulary', 5);
      SU.ui.toast(`${n} new card${n === 1 ? '' : 's'} added`, 'success');
      e.target.disabled = true;
      e.target.textContent = '✓ Added to flashcards';
      done(100);
    };
  }

  function stepGrammar(body, unit, done) {
    const g = unit.grammar;
    body.innerHTML = `
      <h2>${esc(g.title)}</h2>
      <div class="grammar-text">${g.html}</div>
      <ul class="examples">${g.examples.map(ex => `<li>${esc(ex)} ${SU.ui.sayBtn(ex)}</li>`).join('')}</ul>
      <h3>Quick check</h3>
      <div class="quiz-slot"></div>`;
    SU.ui.mountQuiz($(body, '.quiz-slot'), g.quiz, {
      onAnswer: (q, correct) => {
        store.recordResult('topic:' + g.title, g.title, 'grammar', correct);
        if (!correct) {
          const ans = q.options[q.answer];
          SU.srs.addCard({ front: q.q, back: ans, example: SU.ui.fillGap(q.q, ans), type: 'mistake', source: unit.title });
        }
      },
      onDone: (score, total) => {
        store.addXP('grammar', score * 3);
        done((score / total) * 100);
      }
    });
  }

  function stepListening(body, unit, done) {
    const L = unit.listening;
    let rate = 0.9, accent = store.state.settings.accent;
    body.innerHTML = `
      <p>Listen to the recording (as many times as you like), then answer the questions. Try <b>without</b> reading the text first!</p>
      <div class="listen-box">
        <button class="btn btn-primary btn-lg play">▶ Play</button>
        <button class="btn btn-ghost stop">⏹</button>
        <div class="seg">
          <button class="seg-btn rate" data-rate="0.75">Slow</button>
          <button class="seg-btn rate active" data-rate="0.9">Normal</button>
          <button class="seg-btn rate" data-rate="1.05">Fast</button>
        </div>
        <div class="seg">
          <button class="seg-btn acc ${accent === 'en-US' ? 'active' : ''}" data-acc="en-US">🇺🇸</button>
          <button class="seg-btn acc ${accent === 'en-GB' ? 'active' : ''}" data-acc="en-GB">🇬🇧</button>
        </div>
      </div>
      <div class="quiz-slot"></div>
      <details class="transcript-box"><summary>Show transcript</summary><p>${esc(L.text)}</p></details>`;
    $(body, '.play').onclick = () => SU.speech.speak(L.text, { rate, accent });
    $(body, '.stop').onclick = () => SU.speech.stopSpeaking();
    $$(body, '.rate').forEach(b => b.onclick = () => { rate = Number(b.dataset.rate); $$(body, '.rate').forEach(x => x.classList.toggle('active', x === b)); });
    $$(body, '.acc').forEach(b => b.onclick = () => { accent = b.dataset.acc; $$(body, '.acc').forEach(x => x.classList.toggle('active', x === b)); });
    SU.ui.mountQuiz($(body, '.quiz-slot'), L.questions, {
      onAnswer: (q, correct) => store.recordResult('listen:' + unit.level, 'Listening comprehension (' + unit.level + ')', 'listening', correct),
      onDone: (score, total) => {
        store.addXP('listening', score * 4);
        $(body, '.transcript-box').open = true;
        done((score / total) * 100);
      }
    });
  }

  function stepSpeaking(body, unit, done) {
    const S = unit.speaking;
    body.innerHTML = `
      <div class="tips">
        <b>Tips</b>
        <ul>${S.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
      </div>
      <div class="rec-slot"></div>
      ${SU.speech.recognitionSupported ? '' : '<button class="btn btn-ghost manual">I practised out loud without the mic — mark as done</button>'}`;
    SU.recorder.mount($(body, '.rec-slot'), {
      question: S.prompt, kind: 'Lesson speaking task: ' + unit.title,
      minSeconds: 30, maxSeconds: 90, startWindow: 8,
      onDone: r => { if (r.seconds >= 15) done(r.score); else SU.ui.toast('Speak for at least 15 seconds to complete this step.'); }
    });
    const manual = $(body, '.manual');
    if (manual) manual.onclick = () => done(null);
  }

  SU.lessons = { renderList, renderUnit, nextUnit, STEPS };
})();
