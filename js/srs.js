/*
 * srs.js — Spaced Repetition flashcards using the SM-2 algorithm.
 *
 * SM-2 in plain English:
 *  - Each card has an "ease factor" (EF, starts at 2.5), an interval (days
 *    until you see it again) and a repetition count.
 *  - After you answer, you grade yourself: Again(1) Hard(3) Good(4) Easy(5).
 *  - Grade < 3  → you forgot: start again, see it tomorrow (and again today).
 *  - Grade >= 3 → interval grows: 1 day, then 6 days, then interval × EF.
 *  - EF goes up when it's easy and down when it's hard (never below 1.3),
 *    so hard cards come back more often.
 */
window.SU = window.SU || {};

(function () {
  const { esc, $, $$ } = SU.ui;
  const store = SU.store;
  const GRADES = [
    { q: 1, label: 'Again', cls: 'bad' },
    { q: 3, label: 'Hard', cls: 'ok' },
    { q: 4, label: 'Good', cls: 'good' },
    { q: 5, label: 'Easy', cls: 'good' }
  ];
  const TYPE_LABEL = { vocab: '📚 Word', mistake: '🛠️ Your mistake', phrase: '💬 Phrase', custom: '✏️ Custom' };

  /* ---------- Data functions ---------- */
  function addCard(c) {
    const cards = store.state.cards;
    const key = (c.front + '|' + c.back).toLowerCase();
    if (cards.some(x => (x.front + '|' + x.back).toLowerCase() === key)) return false; // no duplicates
    cards.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      front: c.front, back: c.back, example: c.example || '',
      type: c.type || 'custom', source: c.source || '',
      ef: 2.5, interval: 0, reps: 0, lapses: 0,
      due: store.today(), created: Date.now()
    });
    store.save();
    return true;
  }

  /* Pure function: what would happen with grade q? (used for previews too) */
  function schedule(card, q) {
    let { ef, interval, reps } = card;
    if (q < 3) {
      reps = 0;
      interval = 1;
    } else {
      interval = reps === 0 ? 1 : reps === 1 ? 6 : Math.round(interval * ef);
      reps += 1;
    }
    ef = Math.max(1.3, ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
    return { ef: Math.round(ef * 100) / 100, interval, reps };
  }

  function grade(card, q) {
    const next = schedule(card, q);
    Object.assign(card, next);
    if (q < 3) card.lapses++;
    card.due = store.addDays(store.today(), next.interval);
    card.lastReview = Date.now();
    // A forgotten "mistake" card means this point is still weak.
    if (card.type === 'mistake' && card.source) store.recordResult('cards:mistakes', 'Reviewing your past mistakes', 'grammar', q >= 3);
    store.addXP(card.type === 'vocab' || card.type === 'phrase' ? 'vocabulary' : 'grammar', q >= 3 ? 1 : 0);
    store.save();
  }

  function due() {
    const t = store.today();
    return store.state.cards.filter(c => c.due <= t).sort((a, b) => (a.due < b.due ? -1 : 1));
  }
  /* "Learned" = reviewed successfully at least twice in a row. */
  function wordsLearned() {
    return store.state.cards.filter(c => (c.type === 'vocab' || c.type === 'phrase') && c.reps >= 2).length;
  }
  const intervalText = d => (d <= 1 ? '1 day' : d < 30 ? d + ' days' : Math.round(d / 30) + ' mo');

  /* ---------- Review session ----------
     mountReview(container, { limit, onDone(count) })                     */
  function mountReview(container, opts) {
    opts = opts || {};
    let queue = due().slice(0, opts.limit || 30);
    let reviewed = 0;
    const startCount = queue.length;

    function render() {
      if (!queue.length) {
        if (reviewed) store.logExercise('cards', 'Flashcard review', null, `${reviewed} reviews`);
        container.innerHTML = `<div class="center">
          <div class="emoji-xl">${startCount ? '✅' : '🌱'}</div>
          <p>${startCount ? `Done! You reviewed ${reviewed} card${reviewed === 1 ? '' : 's'}.` : 'No cards due right now. Come back tomorrow, or add new words from the lessons.'}</p>
        </div>`;
        if (opts.onDone) opts.onDone(reviewed);
        return;
      }
      const c = queue[0];
      container.innerHTML = `
        <div class="flashcard">
          <div class="fc-top"><span class="chip">${TYPE_LABEL[c.type] || c.type}</span><span class="muted small">${queue.length} left</span></div>
          <div class="fc-front">${esc(c.front)} ${c.type !== 'mistake' ? SU.ui.sayBtn(c.front) : ''}</div>
          <p class="muted small">${c.type === 'mistake' ? 'What goes in the gap? Say the full sentence out loud.' : c.type === 'phrase' ? 'Say it out loud — when would you use it?' : 'What does it mean? Use it in a sentence out loud.'}</p>
          <div class="fc-back" hidden>
            <p class="fc-answer">${esc(c.back)}</p>
            ${c.example ? `<p class="fc-example">“${esc(c.example)}” ${SU.ui.sayBtn(c.example)}</p>` : ''}
          </div>
          <div class="row center fc-actions">
            <button class="btn btn-primary btn-lg show">Show answer</button>
          </div>
        </div>`;
      $(container, '.show').onclick = () => {
        $(container, '.fc-back').hidden = false;
        $(container, '.fc-actions').innerHTML = GRADES.map(g =>
          `<button class="btn grade ${g.cls}" data-q="${g.q}">${g.label}<small>${intervalText(schedule(c, g.q).interval)}</small></button>`).join('');
        $$(container, '.grade').forEach(b => b.onclick = () => {
          const q = Number(b.dataset.q);
          grade(c, q);
          reviewed++;
          queue.shift();
          if (q < 3) queue.push(c); // forgotten → see it again at the end of this session
          render();
        });
      };
    }
    render();
  }

  /* ---------- The Flashcards page ---------- */
  function renderPage(container) {
    const cards = store.state.cards;
    const dueCount = due().length;
    container.innerHTML = `
      <h1>Flashcards</h1>
      <div class="stats-row">
        <div class="stat"><b>${dueCount}</b><span>due today</span></div>
        <div class="stat"><b>${cards.length}</b><span>cards</span></div>
        <div class="stat"><b>${wordsLearned()}</b><span>words learned</span></div>
        <div class="stat"><b>${cards.filter(c => c.type === 'mistake').length}</b><span>mistakes saved</span></div>
      </div>
      <section class="card review-slot">
        <div class="center">
          <p>${dueCount ? `You have <b>${dueCount}</b> card${dueCount === 1 ? '' : 's'} to review.` : 'Nothing to review right now. 🎉'}</p>
          ${dueCount ? '<button class="btn btn-primary btn-lg start">Start review</button>' : ''}
        </div>
      </section>
      <section class="card">
        <h2>Add a card</h2>
        <form class="add-form">
          <input name="front" placeholder="Word, phrase or question (front)" required>
          <input name="back" placeholder="Meaning or answer (back)" required>
          <input name="example" placeholder="Example sentence (optional)">
          <button class="btn btn-primary">Add</button>
        </form>
      </section>
      <section class="card">
        <div class="row space"><h2>All cards</h2><input class="search" type="search" placeholder="Search…" aria-label="Search cards"></div>
        <div class="card-list"></div>
      </section>`;

    const start = $(container, '.start');
    if (start) start.onclick = () => mountReview($(container, '.review-slot'), { onDone: () => {} });

    $(container, '.add-form').onsubmit = e => {
      e.preventDefault();
      const f = e.target;
      const ok = addCard({ front: f.front.value.trim(), back: f.back.value.trim(), example: f.example.value.trim(), type: 'custom', source: 'You' });
      SU.ui.toast(ok ? 'Card added' : 'This card already exists', ok ? 'success' : '');
      if (ok) renderPage(container);
    };

    const list = $(container, '.card-list');
    function renderList(filter) {
      const f = (filter || '').toLowerCase();
      const shown = cards.filter(c => !f || (c.front + ' ' + c.back).toLowerCase().includes(f)).slice().reverse();
      list.innerHTML = shown.length ? `<table class="table">
        <thead><tr><th>Front</th><th>Back</th><th>Next</th><th></th></tr></thead>
        <tbody>${shown.slice(0, 200).map(c => `<tr>
          <td>${esc(c.front)}<br><span class="muted small">${TYPE_LABEL[c.type] || ''}</span></td>
          <td>${esc(c.back)}</td>
          <td class="small">${c.due <= store.today() ? '<b>today</b>' : esc(c.due)}</td>
          <td><button class="btn-icon del" data-id="${c.id}" title="Delete">🗑️</button></td></tr>`).join('')}
        </tbody></table>` : '<p class="muted">No cards yet. They are added automatically from your mistakes, lessons and the phrases bank.</p>';
      $$(list, '.del').forEach(b => b.onclick = () => {
        store.state.cards = store.state.cards.filter(c => c.id !== b.dataset.id);
        store.save();
        renderPage(container);
      });
    }
    $(container, '.search').oninput = e => renderList(e.target.value);
    renderList('');
  }

  SU.srs = { addCard, schedule, grade, due, wordsLearned, mountReview, renderPage };
})();
