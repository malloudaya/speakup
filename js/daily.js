/*
 * daily.js — your 15-minute daily session, generated from your weak points.
 *
 * Five steps of ~3 minutes:
 *   1. Flashcard warm-up (SM-2 reviews due today)
 *   2. Weak-point quiz (questions on the grammar/vocab topics you miss most)
 *   3. Sound training (minimal pairs for your weakest sound)
 *   4. Read-aloud or shadowing (with the words you often mispronounce)
 *   5. Answer fast (beat the freeze)
 *
 * The plan is created once per day and saved, so reloading the page keeps
 * the same session and your progress.
 */
window.SU = window.SU || {};

(function () {
  const { esc, $, $$ } = SU.ui;
  const store = SU.store;
  const C = window.SU_CONTENT;
  const LEVELS = store.LEVELS;

  async function buildPlan() {
    const day = store.today();
    const rand = SU.ui.seeded(day);              // same random choices all day
    const weak = store.topWeakPoints(10);
    const level = store.overallLevel() || 'B1';
    const lvlIdx = LEVELS.indexOf(level);
    const steps = [];

    // 1) Flashcards
    const dueN = SU.srs.due().length;
    steps.push({
      id: 'review', icon: '🃏', title: dueN ? 'Flashcard warm-up' : 'Phrase warm-up', minutes: 3,
      why: dueN ? `${dueN} card${dueN === 1 ? '' : 's'} due today (spaced repetition).` : 'No cards due — warm up with anti-freeze phrases instead.'
    });

    // 2) Weak-point quiz: questions from the bank + lesson quizzes on your weak topics.
    const bank = await SU.loadQuestions();
    const pool = bank.filter(q => q.section === 'grammar' || q.section === 'vocabulary')
      .map(q => ({ q: q.q, options: q.options, answer: q.answer, topic: q.topic, level: q.level }))
      .concat(C.units.flatMap(u => u.grammar.quiz.map(q => Object.assign({ topic: u.grammar.title, level: u.level }, q))));
    const weakTopics = weak.filter(w => w.key.startsWith('topic:')).map(w => w.label);
    let quiz = SU.ui.shuffle(pool.filter(q => weakTopics.includes(q.topic)), rand).slice(0, 5);
    if (quiz.length < 5) {
      const near = pool.filter(q => Math.abs(LEVELS.indexOf(q.level) - lvlIdx) <= 1 && !quiz.includes(q));
      quiz = quiz.concat(SU.ui.shuffle(near, rand).slice(0, 5 - quiz.length));
    }
    steps.push({
      id: 'weak', icon: '🎯', title: 'Weak-point quiz', minutes: 3, quiz,
      why: weakTopics.length ? 'Focus: ' + weakTopics.slice(0, 3).join(', ') : `Mixed ${level}-level grammar & vocabulary.`
    });

    // 3) Sound training: weakest pronunciation category, or rotate daily.
    const cats = C.minimalPairs;
    const weakPron = weak.find(w => cats.some(c => c.weakKey === w.key));
    const cat = weakPron ? cats.find(c => c.weakKey === weakPron.key) : cats[Math.floor(rand() * cats.length)];
    steps.push({
      id: 'pron', icon: '👄', title: 'Sound training: ' + cat.title, minutes: 3, cat: cat.id,
      why: weakPron ? 'This sound is one of your weak points.' : 'Today\'s sound for French/Arabic speakers.'
    });

    // 4) Read aloud with your most-missed words (or shadowing).
    const missed = store.topMissedWords(8);
    const nearLevels = LEVELS.filter((_, i) => Math.abs(i - lvlIdx) <= 1);
    const corpus = nearLevels.flatMap(l => C.sentences[l]);
    let sentences = corpus.filter(s => missed.some(w => SU.speech.normalize(s).includes(w)));
    const mode = sentences.length >= 2 ? 'read' : (rand() < 0.5 ? 'shadow' : 'read');
    sentences = SU.ui.shuffle(sentences, rand).slice(0, 4);
    if (sentences.length < 4) sentences = sentences.concat(SU.ui.shuffle(C.sentences[level].filter(s => !sentences.includes(s)), rand).slice(0, 4 - sentences.length));
    steps.push({
      id: 'drill', icon: mode === 'read' ? '📖' : '🗣️', title: mode === 'read' ? 'Read aloud' : 'Shadowing', minutes: 3, mode, sentences,
      why: missed.length ? 'Includes words you often miss: ' + missed.slice(0, 4).join(', ') : 'Build accuracy and rhythm.'
    });

    // 5) Answer fast
    const band = SU.speaking.bandFor(store.state.skills.speaking.level || level);
    const fq = SU.ui.pick(C.fastQuestions.filter(q => q.band === band), rand).q;
    steps.push({ id: 'fast', icon: '⚡', title: 'Answer fast', minutes: 3, question: fq, why: 'Start talking within 5 seconds — no freezing!' });

    steps.forEach(s => { s.done = false; });
    return { date: day, steps, completed: false };
  }

  async function getPlan() {
    const st = store.state;
    if (!st.daily || st.daily.date !== store.today()) {
      st.daily = await buildPlan();
      store.save();
    }
    return st.daily;
  }

  /* ---------- The Daily page ---------- */
  async function render(container, focusStep) {
    container.innerHTML = '<p class="muted">Preparing your session…</p>';
    const plan = await getPlan();
    const doneN = plan.steps.filter(s => s.done).length;
    container.innerHTML = `
      <h1>Today's session <span class="muted small">· about 15 minutes</span></h1>
      ${store.state.placement ? '' : '<div class="notice">💡 Take the <a href="#/placement">placement test</a> first so the session matches your level and weak points.</div>'}
      <div class="progress"><div style="width:${(doneN / plan.steps.length) * 100}%"></div></div>
      <ol class="daily-steps">
        ${plan.steps.map((s, i) => `<li class="daily-step ${s.done ? 'done' : ''}" data-i="${i}">
          <span class="ds-icon">${s.done ? '✅' : s.icon}</span>
          <div class="ds-text"><b>${esc(s.title)}</b><span class="muted small">${esc(s.why)}</span></div>
          <span class="muted small">${s.minutes} min</span>
          <button class="btn btn-small ${s.done ? 'btn-ghost' : 'btn-primary'} go">${s.done ? 'Redo' : 'Start'}</button>
        </li>`).join('')}
      </ol>
      <section class="card step-panel" hidden></section>
      ${plan.completed ? `<section class="card center celebrate"><div class="emoji-xl">🏆</div><h2>Session complete!</h2><p>See you tomorrow to keep your 🔥 ${store.currentStreak()}-day streak.</p></section>` : ''}`;

    $$(container, '.daily-step .go').forEach(btn => btn.onclick = () => {
      openStep(container, plan, Number(btn.closest('li').dataset.i));
    });
    // Automatically open the first unfinished step.
    const first = focusStep != null ? focusStep : plan.steps.findIndex(s => !s.done);
    if (first >= 0 && !plan.completed) openStep(container, plan, first);
  }

  function openStep(container, plan, i) {
    const s = plan.steps[i];
    const panel = $(container, '.step-panel');
    panel.hidden = false;
    $$(container, '.daily-step').forEach((li, k) => li.classList.toggle('active', k === i));
    panel.innerHTML = `<h2>${s.icon} ${esc(s.title)}</h2><div class="step-slot"></div><div class="row center step-next" hidden></div>`;
    const slot = $(panel, '.step-slot');
    const finish = score => {
      s.done = true;
      s.score = score;
      if (!plan.completed && plan.steps.every(x => x.done)) {
        plan.completed = true;
        store.logExercise('daily', 'Daily session', null, plan.steps.map(x => x.title).join(', '));
        SU.ui.toast('🏆 Daily session complete!', 'success');
      }
      store.save();
      const next = plan.steps.findIndex(x => !x.done);
      const nx = $(panel, '.step-next');
      nx.hidden = false;
      nx.innerHTML = next >= 0
        ? `<button class="btn btn-primary btn-lg">Next: ${esc(plan.steps[next].title)} ›</button>`
        : '<button class="btn btn-primary btn-lg">Finish 🏆</button>';
      $(nx, 'button').onclick = () => render(container, next >= 0 ? next : undefined).then(() => window.scrollTo(0, 0));
      $(container, `.daily-step[data-i="${i}"]`).classList.add('done');
    };

    if (s.id === 'review') {
      if (SU.srs.due().length) SU.srs.mountReview(slot, { limit: 15, onDone: () => finish(null) });
      else {
        // No cards due: practise 4 anti-freeze phrases with the drill component.
        const phrases = SU.ui.shuffle(C.phrases.flatMap(c => c.items)).slice(0, 4).map(p => p.replace(/\.\.\.|,\.\.\./g, '').trim());
        SU.speaking.mountDrill(slot, { mode: 'read', sentences: phrases, onDone: finish });
      }
    } else if (s.id === 'weak') {
      SU.ui.mountQuiz(slot, s.quiz, {
        onAnswer: (q, correct) => {
          store.recordResult('topic:' + q.topic, q.topic, 'grammar', correct);
          if (!correct) {
            const ans = q.options[q.answer];
            SU.srs.addCard({ front: q.q, back: ans, example: SU.ui.fillGap(q.q, ans), type: 'mistake', source: 'Daily session' });
          }
        },
        onDone: (score, total) => { store.addXP('grammar', score * 2); finish((score / total) * 100); }
      });
    } else if (s.id === 'pron') {
      SU.speaking.mountPairs(slot, s.cat, { mode: 'listen', rounds: 8, onDone: finish });
    } else if (s.id === 'drill') {
      SU.speaking.mountDrill(slot, { mode: s.mode, sentences: s.sentences, onDone: finish });
    } else if (s.id === 'fast') {
      SU.recorder.mount(slot, {
        question: s.question, kind: 'Daily answer fast', minSeconds: 30,
        maxSeconds: store.state.settings.fastSeconds || 60, startWindow: 5,
        onDone: r => finish(r.score)
      });
      if (!SU.speech.recognitionSupported) {
        slot.insertAdjacentHTML('beforeend', '<button class="btn btn-ghost skip">Skip this step</button>');
        $(slot, '.skip').onclick = () => finish(null);
      }
    }
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* Small summary used by the dashboard. */
  function summary() {
    const d = store.state.daily;
    if (!d || d.date !== store.today()) return { done: 0, total: 5, completed: false };
    return { done: d.steps.filter(s => s.done).length, total: d.steps.length, completed: d.completed };
  }

  SU.daily = { render, summary };
})();
