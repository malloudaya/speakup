/*
 * speech.js — everything about the browser's free Web Speech API.
 *
 *  - SU.speech.speak(text)      → text-to-speech (the app talks)
 *  - SU.speech.listen(options)  → speech-to-text (the app listens to you)
 *  - SU.speech.compare(target, transcript) → which words you said correctly
 *
 * IMPORTANT: Speech recognition works best in Google Chrome (desktop or
 * Android). Chrome sends the audio to Google's speech service, so it needs
 * an internet connection. Firefox does not support it at all.
 */
window.SU = window.SU || {};

(function () {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const S = {};

  S.recognitionSupported = !!Recognition;
  S.ttsSupported = 'speechSynthesis' in window;

  /* =====================================================================
   * 1. TEXT-TO-SPEECH
   * ===================================================================== */
  let voices = [];
  function loadVoices() { voices = S.ttsSupported ? speechSynthesis.getVoices() : []; }
  if (S.ttsSupported) {
    loadVoices();
    // Chrome loads voices asynchronously, so listen for the update.
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
  }

  /* All English voices, e.g. for the Settings dropdown. */
  S.englishVoices = function () {
    return voices.filter(v => /^en[-_]/i.test(v.lang));
  };

  /* Choose the best voice for "en-US" or "en-GB". */
  function pickVoice(accent) {
    const settings = SU.store.state.settings;
    const norm = v => v.lang.replace('_', '-');
    // 1) The voice you picked in Settings (only if it matches the accent).
    const chosen = voices.find(v => v.voiceURI === settings.voiceURI && norm(v) === accent);
    if (chosen) return chosen;
    const exact = voices.filter(v => norm(v) === accent);
    // 2) Prefer Google's voices in Chrome — they sound more natural.
    return exact.find(v => /google/i.test(v.name)) || exact[0] ||
      voices.find(v => /^en/i.test(v.lang)) || null;
  }

  /* Split long text into sentences: Chrome sometimes stops speaking
     after ~15 seconds of one long utterance. */
  function chunkText(text) {
    const parts = text.match(/[^.!?]+[.!?]*["')\]]*\s*/g) || [text];
    return parts.map(p => p.trim()).filter(Boolean);
  }

  let speakToken = 0; // increases every time we start/stop, to cancel old speech

  /*
   * speak(text, { rate, accent }) → Promise that resolves when speaking ends.
   * rate: 0.5 (slow) … 1 (normal) … 1.5 (fast)
   */
  S.speak = function (text, opts) {
    opts = opts || {};
    if (!S.ttsSupported || !text) return Promise.resolve();
    const settings = SU.store.state.settings;
    const accent = opts.accent || settings.accent || 'en-US';
    const rate = opts.rate || settings.rate || 1;
    const myToken = ++speakToken;
    speechSynthesis.cancel();

    const chunks = chunkText(String(text));
    return chunks.reduce((prev, chunk) => prev.then(() => new Promise(resolve => {
      if (myToken !== speakToken) return resolve(); // cancelled meanwhile
      const u = new SpeechSynthesisUtterance(chunk);
      const voice = pickVoice(accent);
      if (voice) u.voice = voice;
      u.lang = accent;
      u.rate = rate;
      // Safety net: some browsers never fire "end". Resolve after a generous time.
      const words = chunk.split(/\s+/).length;
      const timer = setTimeout(resolve, (words * 700) / rate + 4000);
      u.onend = u.onerror = () => { clearTimeout(timer); resolve(); };
      speechSynthesis.speak(u);
      speechSynthesis.resume(); // fixes a Chrome bug where speech stays "paused"
    })), Promise.resolve());
  };

  S.stopSpeaking = function () {
    speakToken++;
    if (S.ttsSupported) speechSynthesis.cancel();
  };

  /* =====================================================================
   * 2. SPEECH RECOGNITION (speech-to-text)
   * ===================================================================== */

  /* Friendly messages for each error code the browser can give us. */
  S.errorMessage = function (code) {
    return ({
      'not-allowed': 'Microphone access is blocked. Allow the microphone for this site and try again.',
      'service-not-allowed': 'Speech recognition is blocked in this browser. Use Google Chrome and allow the microphone.',
      'audio-capture': 'No microphone was found. Plug one in (or check your system sound settings) and try again.',
      'network': 'Speech recognition needs an internet connection (Chrome sends audio to Google\'s speech service).',
      'no-speech': 'I didn\'t hear anything. Speak a little louder or move closer to the microphone.',
      'language-not-supported': 'This language is not supported by your browser\'s speech recognition.',
      'unsupported': 'Speech recognition is not available in this browser. Please use Google Chrome.'
    })[code] || ('Speech recognition error: ' + code);
  };

  /* Errors that mean "stop trying, the user must fix something". */
  const FATAL = ['not-allowed', 'service-not-allowed', 'audio-capture', 'network', 'language-not-supported'];

  let activeController = null; // only one recognition at a time

  /*
   * listen(options) starts the microphone and returns a controller { stop() }.
   *
   * options:
   *   continuous   keep listening through short pauses (default false)
   *   keepAlive    restart automatically if the browser stops by itself
   *   maxAlternatives  how many guesses to return (useful for single words)
   *   onInterim(finalText, interimText)  live text while you speak
   *   onActivity()  called every time the browser hears speech
   *   onError(code, message)
   *   onEnd({ transcript, alternatives, error, seconds })
   */
  S.listen = function (opts) {
    opts = opts || {};
    if (activeController) activeController.abort();
    S.stopSpeaking(); // never listen while the app is talking

    let stopped = false, ended = false, errorCode = null;
    let finalText = '', alternatives = [], rec = null;
    const startedAt = Date.now();

    function finish() {
      if (ended) return;
      ended = true;
      if (activeController === controller) activeController = null;
      if (opts.onEnd) opts.onEnd({
        transcript: finalText.trim(), alternatives, error: errorCode,
        seconds: (Date.now() - startedAt) / 1000
      });
    }

    function start() {
      rec = new Recognition();
      rec.lang = opts.lang || SU.store.state.settings.accent || 'en-US';
      rec.continuous = !!opts.continuous;
      rec.interimResults = opts.interim !== false;
      rec.maxAlternatives = opts.maxAlternatives || 1;

      rec.onresult = (e) => {
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) {
            finalText += ' ' + r[0].transcript.trim();
            alternatives = Array.from(r).map(a => a.transcript.trim());
          } else {
            interim += r[0].transcript;
          }
        }
        if (opts.onActivity) opts.onActivity();
        if (opts.onInterim) opts.onInterim(finalText.trim(), interim.trim());
      };

      rec.onerror = (e) => {
        if (e.error === 'aborted') return;
        if (e.error === 'no-speech' && opts.keepAlive) return; // just silence, keep going
        errorCode = e.error;
        if (FATAL.includes(e.error)) stopped = true;
        if (opts.onError) opts.onError(e.error, S.errorMessage(e.error));
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          if (SU.ui) SU.ui.micHelp(e.error);
        }
      };

      rec.onend = () => {
        // Chrome stops after a few seconds of silence or ~60s of speech.
        // In keepAlive mode we simply start a new session.
        if (!stopped && opts.keepAlive && !errorCode) {
          try { start(); return; } catch (err) { /* fall through */ }
        }
        finish();
      };

      rec.start();
    }

    const controller = {
      /* stop(): finish nicely and keep what was said so far */
      stop() {
        stopped = true;
        try { rec && rec.stop(); } catch (e) { /* ignore */ }
        setTimeout(finish, 1500); // safety net if "end" never fires
      },
      /* abort(): cancel immediately */
      abort() {
        stopped = true;
        try { rec && rec.abort(); } catch (e) { /* ignore */ }
        finish();
      },
      get text() { return finalText.trim(); }
    };

    if (!Recognition) {
      errorCode = 'unsupported';
      setTimeout(() => {
        if (opts.onError) opts.onError('unsupported', S.errorMessage('unsupported'));
        finish();
      }, 0);
      return controller;
    }

    activeController = controller;
    try { start(); }
    catch (e) { errorCode = 'start-failed'; setTimeout(finish, 0); }
    return controller;
  };

  /* listenOnce(): simple Promise version for single sentences. */
  S.listenOnce = function (opts) {
    return new Promise(resolve => {
      const o = Object.assign({}, opts, { onEnd: resolve });
      const ctrl = S.listen(o);
      if (opts && opts.onController) opts.onController(ctrl);
    });
  };

  /* Stop everything (used when you leave a page). */
  S.stopAll = function () {
    S.stopSpeaking();
    if (activeController) activeController.abort();
  };

  /* =====================================================================
   * 3. MICROPHONE PERMISSION CHECKS
   * ===================================================================== */

  /* Returns 'granted' | 'denied' | 'prompt' | 'unknown' without asking. */
  S.micPermission = async function () {
    try {
      const p = await navigator.permissions.query({ name: 'microphone' });
      return p.state;
    } catch (e) { return 'unknown'; }
  };

  /* Ask for the mic (shows the browser popup). Returns true if allowed. */
  S.requestMic = async function () {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop()); // we only wanted the permission
      return true;
    } catch (e) { return false; }
  };

  /* =====================================================================
   * 4. COMPARING WHAT YOU SAID WITH THE TARGET SENTENCE
   * ===================================================================== */

  // Contractions are expanded so "I'm" and "I am" count as the same.
  const CONTRACTIONS = {
    "i'm": "i am", "you're": "you are", "he's": "he is", "she's": "she is", "it's": "it is",
    "we're": "we are", "they're": "they are", "that's": "that is", "there's": "there is",
    "what's": "what is", "here's": "here is", "who's": "who is", "where's": "where is",
    "let's": "let us", "i've": "i have", "you've": "you have", "we've": "we have",
    "they've": "they have", "i'll": "i will", "you'll": "you will", "he'll": "he will",
    "she'll": "she will", "we'll": "we will", "they'll": "they will", "it'll": "it will",
    "i'd": "i would", "you'd": "you would", "he'd": "he would", "she'd": "she would",
    "we'd": "we would", "they'd": "they would", "isn't": "is not", "aren't": "are not",
    "wasn't": "was not", "weren't": "were not", "don't": "do not", "doesn't": "does not",
    "didn't": "did not", "won't": "will not", "can't": "can not", "cannot": "can not",
    "couldn't": "could not", "shouldn't": "should not", "wouldn't": "would not",
    "haven't": "have not", "hasn't": "has not", "hadn't": "had not", "mustn't": "must not"
  };

  // Words that SOUND the same: the recognizer can't hear the difference,
  // so we never mark you wrong for them.
  const SAME_SOUND = {
    two: 'to', too: 'to', four: 'for', fore: 'for', write: 'right', no: 'know',
    here: 'hear', buy: 'by', bye: 'by', weight: 'wait', weather: 'whether',
    threw: 'through', knew: 'new', see: 'sea', won: 'one', eight: 'ate', hour: 'our',
    their: 'there', ok: 'okay', mr: 'mister', mrs: 'missus'
  };

  // British ↔ American spelling (the recognizer uses US spelling in en-US).
  const SPELLING = {
    colour: 'color', favourite: 'favorite', centre: 'center', theatre: 'theater',
    neighbour: 'neighbor', behaviour: 'behavior', honour: 'honor', humour: 'humor',
    flavour: 'flavor', labour: 'labor', organise: 'organize', realise: 'realize',
    recognise: 'recognize', apologise: 'apologize', analyse: 'analyze', travelling: 'traveling',
    programme: 'program', metre: 'meter', litre: 'liter', grey: 'gray', realised: 'realized',
    organised: 'organized', mum: 'mom', vigour: 'vigor'
  };

  const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  /* 25 → "twenty five" (good enough for 0 – 9999). */
  function numberToWords(n) {
    if (n < 20) return ONES[n];
    if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '');
    if (n < 1000) return ONES[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' ' + numberToWords(n % 100) : '');
    if (n < 10000) return numberToWords(Math.floor(n / 1000)) + ' thousand' + (n % 1000 ? ' ' + numberToWords(n % 1000) : '');
    return String(n);
  }

  /* Turn ONE written word into a list of simple lowercase words. */
  function normalizeWord(raw) {
    let w = raw.toLowerCase()
      .replace(/[’‘`]/g, "'")
      .replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, ''); // strip punctuation at both ends
    if (!w) return [];
    if (/^\d+$/.test(w)) return numberToWords(parseInt(w, 10)).split(' ').map(x => SAME_SOUND[x] || x);
    if (CONTRACTIONS[w]) return CONTRACTIONS[w].split(' ');
    w = w.replace(/'s$/, 's').replace(/'/g, ''); // "Tom's" → "toms"
    w = SPELLING[w] || w;
    w = SAME_SOUND[w] || w;
    return [w];
  }

  /* Split a sentence into display tokens, each with its normalised words. */
  function tokenize(text) {
    return String(text)
      .replace(/[—–]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .flatMap(tok => {
        // "twenty-five" → "twenty" "five" (but keep the original look for display)
        const parts = tok.split('-').filter(Boolean);
        return [{ display: tok, words: parts.flatMap(normalizeWord) }];
      })
      .filter(t => t.words.length || /\w/.test(t.display));
  }
  S.normalize = text => tokenize(text).flatMap(t => t.words);

  /*
   * compare(target, transcript)
   * Uses the "longest common subsequence" (LCS) algorithm to line up the
   * words you said with the words of the target, in order.
   *
   * Returns {
   *   tokens:   [{ text, ok }]  ← one per word of the target, for colouring
   *   accuracy: 0-100
   *   missed:   ['word', ...]   ← target words you didn't say correctly
   *   extra:    ['word', ...]   ← words you said that aren't in the target
   * }
   */
  S.compare = function (target, transcript) {
    const tokens = tokenize(target);
    const a = tokens.flatMap((t, ti) => t.words.map(w => ({ w, ti })));
    const b = S.normalize(transcript || '');

    // Classic LCS dynamic-programming table.
    const n = a.length, m = b.length;
    const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        dp[i][j] = a[i].w === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
    // Walk the table to find which target words were matched.
    const matchedA = new Array(n).fill(false), matchedB = new Array(m).fill(false);
    let i = 0, j = 0;
    while (i < n && j < m) {
      if (a[i].w === b[j]) { matchedA[i] = matchedB[j] = true; i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
      else j++;
    }

    // A display token is OK only if ALL its little words were matched.
    const result = tokens.map((t, ti) => {
      const idx = a.map((x, k) => (x.ti === ti ? k : -1)).filter(k => k >= 0);
      return { text: t.display, ok: idx.length > 0 && idx.every(k => matchedA[k]) };
    });
    const matched = matchedA.filter(Boolean).length;
    return {
      tokens: result,
      accuracy: n ? Math.round((matched / n) * 100) : 0,
      missed: result.filter(t => !t.ok).map(t => t.text.toLowerCase().replace(/[^a-z'-]/g, '')).filter(Boolean),
      extra: b.filter((_, k) => !matchedB[k])
    };
  };

  /* Count words in a transcript. */
  S.countWords = text => (String(text || '').trim().match(/\S+/g) || []).length;

  SU.speech = S;
})();
