/*
 * settings.js — accent, voice, speed, microphone test, backup & reset.
 */
window.SU = window.SU || {};

(function () {
  const { esc, $ } = SU.ui;
  const store = SU.store;

  function render(container) {
    const s = store.state.settings;
    container.innerHTML = `
      <h1>Settings</h1>

      <section class="card">
        <h2>🔊 Voice</h2>
        <label class="field">Accent
          <select class="accent">
            <option value="en-US" ${s.accent === 'en-US' ? 'selected' : ''}>🇺🇸 American (en-US)</option>
            <option value="en-GB" ${s.accent === 'en-GB' ? 'selected' : ''}>🇬🇧 British (en-GB)</option>
          </select>
        </label>
        <label class="field">Voice <select class="voice"></select></label>
        <label class="field">Default speed: <b class="rate-val">${Number(s.rate).toFixed(2)}×</b>
          <input class="rate" type="range" min="0.6" max="1.3" step="0.05" value="${s.rate}">
        </label>
        <button class="btn btn-ghost test-voice">▶ Test voice</button>
        <p class="muted small">The accent is also used for speech recognition. Chrome's “Google” voices usually sound the most natural.</p>
      </section>

      <section class="card">
        <h2>🎙️ Microphone test</h2>
        <p>Click the button and say: <b>“Hello, I'm ready to speak English.”</b></p>
        <button class="btn btn-primary mic-test">🎤 Test microphone</button>
        <div class="mic-result" aria-live="polite"></div>
      </section>

      <section class="card">
        <h2>⚡ Answer fast</h2>
        <label class="field">Maximum speaking time
          <select class="fast">
            ${[30, 45, 60, 90].map(n => `<option value="${n}" ${s.fastSeconds === n ? 'selected' : ''}>${n} seconds</option>`).join('')}
          </select>
        </label>
      </section>

      <section class="card">
        <h2>💾 Your data</h2>
        <p class="muted small">Everything is stored only in this browser (localStorage). Export a backup to move it to another device.</p>
        <div class="row wrap">
          <button class="btn btn-ghost export">⬇ Export backup</button>
          <label class="btn btn-ghost">⬆ Import backup <input class="import" type="file" accept="application/json" hidden></label>
          <button class="btn btn-danger reset">Reset all progress</button>
        </div>
      </section>`;

    const accentSel = $(container, '.accent'), voiceSel = $(container, '.voice');
    function fillVoices() {
      const list = SU.speech.englishVoices().filter(v => v.lang.replace('_', '-') === s.accent);
      voiceSel.innerHTML = '<option value="">Automatic (best available)</option>' +
        list.map(v => `<option value="${esc(v.voiceURI)}" ${v.voiceURI === s.voiceURI ? 'selected' : ''}>${esc(v.name)}</option>`).join('');
    }
    fillVoices();
    if (SU.speech.ttsSupported) speechSynthesis.addEventListener('voiceschanged', fillVoices, { once: true });

    accentSel.onchange = () => { s.accent = accentSel.value; s.voiceURI = ''; store.save(); fillVoices(); };
    voiceSel.onchange = () => { s.voiceURI = voiceSel.value; store.save(); };
    $(container, '.rate').oninput = e => { s.rate = Number(e.target.value); $(container, '.rate-val').textContent = s.rate.toFixed(2) + '×'; store.save(); };
    $(container, '.test-voice').onclick = () => SU.speech.speak('Hello! This is how I sound. Let\'s practise speaking English together.');
    $(container, '.fast').onchange = e => { s.fastSeconds = Number(e.target.value); store.save(); };

    // Microphone test: check support → permission → recognition.
    $(container, '.mic-test').onclick = async e => {
      const out = $(container, '.mic-result');
      const btn = e.target;
      if (!SU.speech.recognitionSupported) { out.innerHTML = SU.ui.noRecognitionHTML(); return; }
      btn.disabled = true;
      out.innerHTML = '<p class="muted">Checking microphone permission…</p>';
      const allowed = await SU.speech.requestMic();
      if (!allowed) {
        btn.disabled = false;
        out.innerHTML = '<p class="bad">✗ The microphone is blocked or missing.</p>';
        SU.ui.micHelp('not-allowed');
        return;
      }
      out.innerHTML = '<p class="good">✓ Microphone allowed. Now speak…</p><p class="live muted"></p>';
      const res = await SU.speech.listenOnce({ onInterim: (f, i) => { const l = $(out, '.live'); if (l) l.textContent = (f + ' ' + i).trim(); } });
      btn.disabled = false;
      if (res.transcript) {
        const cmp = SU.speech.compare("Hello, I'm ready to speak English.", res.transcript);
        out.innerHTML = `<p class="good">✓ Speech recognition works!</p>${SU.ui.wordDiffHTML(cmp.tokens)}<p class="muted small">We heard: “${esc(res.transcript)}”</p>`;
      } else {
        out.innerHTML = `<p class="bad">✗ ${esc(SU.speech.errorMessage(res.error || 'no-speech'))}</p>`;
      }
    };

    $(container, '.export').onclick = () => {
      const blob = new Blob([store.exportJSON()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `speakup-backup-${store.today()}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    };
    $(container, '.import').onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try { store.importJSON(reader.result); SU.ui.toast('Backup restored!', 'success'); render(container); }
        catch (err) { SU.ui.toast(err.message || 'Invalid file', 'error'); }
      };
      reader.readAsText(file);
    };
    $(container, '.reset').onclick = () => SU.ui.confirm('Reset all progress?',
      '<p>This deletes your levels, streak, flashcards and history from this browser. Export a backup first if you want to keep them.</p>',
      () => { store.reset(); SU.ui.toast('Progress reset.'); location.hash = '#/dashboard'; });
  }

  SU.settings = { render };
})();
