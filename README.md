# 🎙️ SpeakUp — your personal English speaking coach

A free, private web app to go from "I understand but I freeze" to **confident C1 speaking**.
Built for French/Arabic speakers, it uses plain HTML, CSS and JavaScript. It needs no server, no API key and no account.

## What's inside

| Area | What it does |
|---|---|
| 🧭 **Placement test** | 26 adaptive questions drawn from a bank of 78 (Grammar, Vocabulary, Listening, Speaking). Gives your CEFR level per skill, a radar chart and your top 5 weak points. |
| 📖 **Read aloud** | Say a sentence; each word turns **green** (recognised) or **red** (missed), with an accuracy %. |
| 🗣️ **Shadowing** | The app speaks, then listens to you straight away. The speed slider goes down to 0.6×, and you can hide the text. |
| ⚡ **Answer fast** | Hear a question, start talking within **5 seconds**, keep going for 30–60 s. Live timer, word count and long-pause detection, plus "stuck? say…" hints. |
| 👄 **Minimal pairs** | th/s, th/z, i/ee, v/f, p/b, h, and word stress, in two modes: "listen & choose" and "say it". |
| 💬 **Phrases bank** | Fillers and connectors so you never freeze. Listen, practise or add them to flashcards. |
| 📘 **Lessons** | A1 → C2 units. Each unit has vocabulary, a grammar point (with notes on French/Arabic traps), listening and a speaking task. |
| 📅 **Daily session** | 15 minutes, generated each day from **your** weak points, missed words and due flashcards. |
| 🃏 **Flashcards** | SM-2 spaced repetition. Your quiz mistakes are added automatically. |
| 🏠 **Dashboard** | Streak, minutes spoken, words learned, level and XP per skill, weak points, weekly chart. |
| 🤖 **Copy for Claude** | After every free-speaking exercise, copies your transcript plus a ready-made coaching prompt (grammar corrections, natural rephrasing, CEFR estimate). Paste it into your Claude chat. |

## ✅ Requirements

- **Google Chrome** (desktop or Android) or **Microsoft Edge**. Speech recognition does **not** work in Firefox, and Brave disables it.
- A microphone, and an **internet connection** for speech recognition.

> 🔒 **Privacy note:** your progress stays in your browser (localStorage). However, Chrome's free speech recognition sends the *audio* to Google's speech service to turn it into text. That is how the Web Speech API works in Chrome.

## ▶️ Run it on your computer

**Option A: double-click (simplest).** Open `index.html` in Chrome. Everything works, but Chrome may ask for microphone permission every time.

**Option B: local server (recommended).** In this folder, run:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000> in Chrome and click **Allow** when asked for the microphone. Chrome remembers your choice on `localhost`.

## 🌍 Publish it free on GitHub Pages

1. Create a new repository on GitHub, for example `speakup`.
2. Upload the **contents** of this folder (`index.html` must be at the root of the repo), or push it with git:

```bash
git init
```

```bash
git add . && git commit -m "SpeakUp"
```

```bash
git branch -M main
```

```bash
git remote add origin https://github.com/YOUR-USERNAME/speakup.git
```

```bash
git push -u origin main
```

3. On GitHub, open **Settings → Pages → Build and deployment**. Set Source to **Deploy from a branch**, then Branch to `main` and folder `/ (root)`. Click **Save**.
4. After about a minute your app is live at `https://YOUR-USERNAME.github.io/speakup/`. It's HTTPS, so the microphone works, including on your Android phone.

## 🎙️ If the microphone doesn't work

SpeakUp detects this and shows a help dialog, but here is the checklist:

1. Click the **🔒 / tune icon** left of the address bar, set **Microphone → Allow**, then reload.
2. Check that the OS lets Chrome use the mic: Windows *Settings → Privacy → Microphone*, or macOS *System Settings → Privacy & Security → Microphone*.
3. Make sure the page is on `https://` or `localhost`. Browsers block the mic on plain `http://` sites.
4. Go to **Settings → Test microphone** in the app to check that everything works.
5. A "network" error means speech recognition can't reach Google. Check your connection or VPN.

## 🗂️ File structure

```
speakup/
├── index.html            App shell + navigation; loads all scripts in order
├── css/style.css         All styles (colour tokens at the top, dark mode included)
├── data/
│   ├── questions.json    Placement question bank (edit this!)
│   ├── questions.js      Auto-generated copy of questions.json (for file:// mode)
│   └── content.js        Lessons, sentences, minimal pairs, phrases, speaking questions
├── js/
│   ├── storage.js        Saves progress in localStorage (streak, XP, weak points…)
│   ├── speech.js         Text-to-speech, speech recognition, word comparison
│   ├── ui.js             Helpers: toasts, dialogs, quiz component, mic help
│   ├── radar.js          Radar chart drawn on a <canvas>
│   ├── claude.js         Builds the "Copy for Claude" prompt
│   ├── srs.js            SM-2 flashcards
│   ├── recorder.js       Free-speaking recorder (timer, pauses, feedback)
│   ├── placement.js      Adaptive placement test
│   ├── speaking.js       Speaking trainer (5 tabs) + pronunciation tracking
│   ├── lessons.js        Levels and units
│   ├── daily.js          Daily 15-minute session generator
│   ├── dashboard.js      Home screen
│   ├── settings.js       Voice, mic test, backup/restore
│   └── app.js            Router: shows the right page for the URL (#/speak/read…)
└── tools/build-questions.js   Regenerates questions.js from questions.json
```

## ✏️ How to extend it

- **Add placement questions:** edit `data/questions.json`. Put the correct answer **first** in `options` and keep `"answer": 0`, because options are shuffled on screen. Sections are `grammar`, `vocabulary`, `listening` (needs `"audio"`) and `speaking` (needs `"text"`). Then run `node tools/build-questions.js` so that double-click mode picks up the change. (On a server or GitHub Pages the JSON is read directly.)
- **Add sentences, questions, minimal pairs or phrases:** add items to the lists in `data/content.js`.
- **Add a lesson unit:** copy one object in `SU_CONTENT.units` and change the `id`, `level` and content.
- **Change the colours:** edit the variables at the top of `css/style.css`.

## 🧠 How some parts work

- **Adaptive test:** each section starts at B1. A right answer moves you up a level and a wrong one moves you down. Your level is where you hover between right and wrong.
- **Word colouring:** your transcript is lined up with the target sentence using the *longest common subsequence* algorithm. Contractions (*I'm = I am*), numbers (*25 = twenty-five*), UK/US spelling and homophones (*two/to*) are normalised first, so you aren't marked wrong for them.
- **Pause detection:** the browser fires an event each time it hears speech. Over 3 seconds without one counts as a "long pause".
- **Weak points:** every answer updates a topic score (mistakes × 2 − correct answers). Pronunciation weak points are guessed from the spelling of the words you miss (*th*, initial *h*, *v*, *-s/-ed* endings).
- **Honest limitation:** browser speech recognition guesses words from context. It catches many pronunciation problems (red words), but it is not a phonetic analyser, so 100% doesn't guarantee perfect pronunciation.

## 💾 Backups

Your data lives in one browser. Use **Settings → Export backup** to save a `.json` file and **Import** to restore it, for example to move between your laptop and your phone.
