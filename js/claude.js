/*
 * claude.js — the free "AI feedback bridge".
 *
 * There's no paid API, so instead we build a ready-made prompt with your
 * transcript. You click "Copy for Claude", paste it into your Claude chat,
 * and get detailed feedback for free.
 */
window.SU = window.SU || {};

(function () {
  const esc = s => SU.ui.esc(s);

  /*
   * buildPrompt({ task, transcript, seconds, words, pauses, wpm, kind })
   * Returns the full text to paste into Claude.
   */
  function buildPrompt(d) {
    const level = SU.store.overallLevel() || 'B1–B2';
    const stats = [
      d.seconds != null ? `- Speaking time: ${Math.round(d.seconds)} seconds` : '',
      d.words != null ? `- Words: ${d.words}` : '',
      d.wpm ? `- Speed: ${d.wpm} words per minute` : '',
      d.pauses != null ? `- Long pauses (3+ seconds): ${d.pauses}` : ''
    ].filter(Boolean).join('\n');

    return `You are my English speaking coach. I'm a native French and Arabic speaker. My current level is around ${level} and my goal is to reach a confident C1, especially in SPEAKING. I tend to freeze when I have to answer out loud.

Below is a transcript of me speaking spontaneously (${d.kind || 'free speaking'}). It comes from automatic speech recognition, so there is no punctuation and a few words may be mis-recognised — please ignore obvious recognition errors and focus on my real language.

Question / task: "${d.task}"
${stats ? '\n' + stats + '\n' : ''}
My transcript:
"""
${d.transcript || '(empty)'}
"""

Please give me feedback in this order, keeping explanations short and simple:
1. **Grammar corrections** — list each mistake as: what I said → correct version → a very short reason. Point out any French/Arabic interference (e.g. "depuis", missing -s, wrong prepositions, false friends).
2. **More natural phrasing** — rewrite my answer the way a confident C1 speaker would say it out loud (natural spoken English, not too formal).
3. **5 useful phrases or collocations** I could have used for this topic.
4. **Fluency** — comment on my speed, pauses and connectors, and give me 2 fillers/connectors to use next time instead of freezing.
5. **Estimated CEFR level** for this answer (A2–C2), with a 1–2 sentence justification, and ONE concrete thing to focus on next.

Finally, ask me one follow-up question on the same topic so I can practise again.`;
  }

  /*
   * Render the "Copy for Claude" block inside a container.
   * data: same object as buildPrompt.
   */
  function mount(container, data) {
    const prompt = buildPrompt(data);
    container.innerHTML = `
      <div class="claude-box">
        <div class="claude-head">
          <div>
            <b>🤖 Get free AI feedback</b>
            <p class="muted small">Copy your transcript + a ready-made prompt, then paste it into your Claude chat.</p>
          </div>
        </div>
        <div class="row wrap">
          <button class="btn btn-primary copy">📋 Copy for Claude</button>
          <a class="btn btn-ghost" href="https://claude.ai/new" target="_blank" rel="noopener">Open Claude ↗</a>
        </div>
        <details>
          <summary class="small">Show the prompt (you can edit it before copying)</summary>
          <textarea class="prompt-text" rows="10">${esc(prompt)}</textarea>
        </details>
      </div>`;
    container.querySelector('.copy').onclick = async () => {
      const text = container.querySelector('.prompt-text').value;
      const ok = await SU.ui.copyText(text);
      SU.ui.toast(ok ? 'Copied! Now paste it into Claude (Ctrl+V / ⌘V).' : 'Copy failed — open "Show the prompt" and copy it manually.', ok ? 'success' : 'error');
    };
  }

  SU.claude = { buildPrompt, mount };
})();
