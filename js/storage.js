/*
 * storage.js — saves and loads ALL your progress in localStorage.
 *
 * localStorage is a small key/value store inside your browser. It survives
 * page reloads and browser restarts, but it is tied to ONE browser on ONE
 * device. Use Settings → Export to make a backup.
 *
 * Every other file talks to the data through SU.store (never directly
 * through localStorage), so the data format lives in one place.
 */
window.SU = window.SU || {};

(function () {
  const KEY = 'speakup.v1';
  const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const SKILLS = ['grammar', 'vocabulary', 'listening', 'speaking'];
  const XP_PER_LEVEL = 100; // XP needed to move up one level in a skill

  /* ---------- Date helpers (we use local dates like "2026-11-11") ---------- */
  function dateKey(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  function today() { return dateKey(new Date()); }
  function addDays(key, n) {
    const [y, m, d] = key.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + n);
    return dateKey(dt);
  }

  /* ---------- The shape of a brand-new user's data ---------- */
  function defaultState() {
    return {
      version: 1,
      createdAt: Date.now(),
      // Current CEFR level + XP towards the next level, per skill.
      skills: {
        grammar: { level: null, xp: 0 },
        vocabulary: { level: null, xp: 0 },
        listening: { level: null, xp: 0 },
        speaking: { level: null, xp: 0 }
      },
      placement: null,    // last placement test result
      weakPoints: {},     // key -> { label, skill, misses, hits, last }
      missedWords: {},    // word -> how many times recognition missed it
      history: [],        // recent activity log (newest first)
      streak: { count: 0, best: 0, last: null },
      stats: { secondsSpoken: 0, wordsSpoken: 0, exercises: 0 },
      days: {},           // "YYYY-MM-DD" -> { seconds, exercises }
      daily: null,        // today's 15-minute plan
      cards: [],          // spaced-repetition flashcards
      units: {},          // lesson progress: unitId -> { steps: {...}, done }
      settings: { accent: 'en-US', rate: 1, voiceURI: '', fastSeconds: 60 }
    };
  }

  /* Fill in any missing keys (useful when a new version adds new fields). */
  function mergeDefaults(def, saved) {
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return def;
    for (const k of Object.keys(def)) {
      const d = def[k];
      if (saved[k] === undefined) saved[k] = d;
      else if (d && typeof d === 'object' && !Array.isArray(d)) saved[k] = mergeDefaults(d, saved[k]);
    }
    return saved;
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaultState();
      return mergeDefaults(defaultState(), JSON.parse(raw));
    } catch (e) {
      console.warn('Could not read saved progress, starting fresh.', e);
      return defaultState();
    }
  }

  let state = load();

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      console.error(e);
      if (SU.ui) SU.ui.toast('Could not save progress (storage full or blocked).', 'error');
    }
  }

  /* ---------- Streak: +1 for each consecutive day you practise ---------- */
  function markActivity() {
    const t = today();
    const s = state.streak;
    if (s.last === t) return;                    // already counted today
    s.count = (s.last === addDays(t, -1)) ? s.count + 1 : 1;
    s.best = Math.max(s.best, s.count);
    s.last = t;
  }
  /* The streak shown on screen: 0 if you missed yesterday AND today. */
  function currentStreak() {
    const s = state.streak;
    if (!s.last) return 0;
    const t = today();
    return (s.last === t || s.last === addDays(t, -1)) ? s.count : 0;
  }

  function dayEntry(key) {
    key = key || today();
    if (!state.days[key]) state.days[key] = { seconds: 0, exercises: 0 };
    return state.days[key];
  }

  /* ---------- Logging what you do ---------- */
  function logExercise(type, title, score, detail) {
    state.history.unshift({ t: Date.now(), type, title, score: score == null ? null : Math.round(score), detail: detail || '' });
    if (state.history.length > 300) state.history.length = 300;
    state.stats.exercises++;
    dayEntry().exercises++;
    markActivity();
    save();
  }

  /* Call this whenever you spoke: adds to "minutes spoken". */
  function addSpeaking(seconds, words) {
    seconds = Math.max(0, Math.min(seconds || 0, 600)); // ignore crazy values
    state.stats.secondsSpoken += seconds;
    state.stats.wordsSpoken += words || 0;
    dayEntry().seconds += seconds;
    markActivity();
    save();
  }

  /* ---------- Weak points ----------
   * Every answer on a topic is recorded. A topic becomes a "weak point"
   * when you miss it more than you get it right.                       */
  function recordResult(key, label, skill, correct) {
    const w = state.weakPoints[key] || (state.weakPoints[key] = { label, skill, misses: 0, hits: 0, last: 0 });
    w.label = label; w.skill = skill;
    if (correct) w.hits++; else w.misses++;
    w.last = Date.now();
    save();
  }
  function weakScore(w) { return w.misses * 2 - w.hits; }
  function topWeakPoints(n) {
    return Object.entries(state.weakPoints)
      .map(([key, w]) => Object.assign({ key, score: weakScore(w) }, w))
      .filter(w => w.misses > 0 && w.score > 0)
      .sort((a, b) => b.score - a.score || b.last - a.last)
      .slice(0, n || 5);
  }

  function addMissedWord(word) {
    word = (word || '').toLowerCase();
    if (!word || word.length < 2) return;
    state.missedWords[word] = (state.missedWords[word] || 0) + 1;
  }
  function topMissedWords(n) {
    return Object.entries(state.missedWords).sort((a, b) => b[1] - a[1]).slice(0, n || 10).map(e => e[0]);
  }

  /* ---------- Levels & XP ---------- */
  function levelIndex(level) { return LEVELS.indexOf(level); }

  /* Add XP to a skill. Returns the new level if you levelled up. */
  function addXP(skill, amount) {
    const s = state.skills[skill];
    if (!s) return null;
    s.xp += amount;
    let newLevel = null;
    // Only level up once the placement test has set a starting level.
    while (s.level && s.xp >= XP_PER_LEVEL && levelIndex(s.level) < LEVELS.length - 1) {
      s.xp -= XP_PER_LEVEL;
      s.level = LEVELS[levelIndex(s.level) + 1];
      newLevel = s.level;
    }
    if (s.level === 'C2') s.xp = Math.min(s.xp, XP_PER_LEVEL);
    save();
    if (newLevel && SU.ui) SU.ui.toast(`🎉 Level up! Your ${skill} is now ${newLevel}.`, 'success');
    return newLevel;
  }

  /* Overall level = average of the four skills (rounded). */
  function overallLevel() {
    const idx = SKILLS.map(k => levelIndex(state.skills[k].level)).filter(i => i >= 0);
    if (!idx.length) return null;
    return LEVELS[Math.round(idx.reduce((a, b) => a + b, 0) / idx.length)];
  }

  /* ---------- Backup / restore ---------- */
  function exportJSON() { return JSON.stringify(state, null, 2); }
  function importJSON(text) {
    const data = JSON.parse(text);
    if (!data || data.version !== 1) throw new Error('This file is not a SpeakUp backup.');
    state = mergeDefaults(defaultState(), data);
    save();
  }
  function reset() { state = defaultState(); save(); }

  SU.store = {
    LEVELS, SKILLS, XP_PER_LEVEL,
    get state() { return state; },   // always returns the current object
    save, today, addDays, dateKey,
    logExercise, addSpeaking, markActivity, currentStreak,
    recordResult, topWeakPoints, addMissedWord, topMissedWords,
    levelIndex, addXP, overallLevel,
    exportJSON, importJSON, reset
  };
})();
