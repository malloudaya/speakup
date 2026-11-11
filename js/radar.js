/*
 * radar.js — draws a "spider" (radar) chart on a <canvas>.
 *
 * SU.radar.draw(canvas, {
 *   labels: ['Grammar', 'Vocabulary', ...],
 *   values: [3, 2, ...],        // 1 = A1 … 6 = C2
 *   compare: [2, 2, ...]        // optional: e.g. your previous result (dashed)
 *   target: 5                   // optional: dashed ring for your goal (C1)
 * })
 */
window.SU = window.SU || {};

(function () {
  const RINGS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  /* Read a colour from the CSS variables, so the chart follows dark mode. */
  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#888';
  }

  function draw(canvas, data) {
    const size = canvas.clientWidth || 300;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.height = size + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const n = data.labels.length;
    const cx = size / 2, cy = size / 2;
    const radius = size / 2 - 70; // leave room for the labels on the sides
    const max = RINGS.length;
    // Angle of axis i (start at the top, go clockwise).
    const angle = i => -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const point = (i, v) => [cx + Math.cos(angle(i)) * radius * (v / max), cy + Math.sin(angle(i)) * radius * (v / max)];

    const grid = cssVar('--border'), text = cssVar('--muted'), accent = cssVar('--accent');
    ctx.font = '11px system-ui, sans-serif';

    // 1) Rings (one per level) + ring labels.
    for (let r = 1; r <= max; r++) {
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const [x, y] = point(i % n, r);
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.strokeStyle = grid;
      ctx.lineWidth = 1;
      ctx.setLineDash(data.target === r ? [4, 4] : []);
      if (data.target === r) { ctx.strokeStyle = cssVar('--good'); ctx.lineWidth = 1.5; }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = text;
      ctx.textAlign = 'left';
      ctx.fillText(RINGS[r - 1], cx + 3, cy - radius * (r / max) + 11);
    }
    // 2) Axes.
    for (let i = 0; i < n; i++) {
      const [x, y] = point(i, max);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y);
      ctx.strokeStyle = grid; ctx.stroke();
    }
    // 3) A shape for a list of values.
    function shape(values, color, fill, dashed) {
      ctx.beginPath();
      values.forEach((v, i) => {
        const [x, y] = point(i, Math.max(v, 0.3));
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      });
      ctx.closePath();
      if (fill) { ctx.globalAlpha = 0.22; ctx.fillStyle = color; ctx.fill(); ctx.globalAlpha = 1; }
      ctx.setLineDash(dashed ? [5, 4] : []);
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
      ctx.setLineDash([]);
      if (!dashed) values.forEach((v, i) => {
        const [x, y] = point(i, Math.max(v, 0.3));
        ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
      });
    }
    if (data.compare) shape(data.compare, text, false, true);
    shape(data.values, accent, true, false);

    // 4) Axis labels with the level.
    ctx.font = '600 12px system-ui, sans-serif';
    data.labels.forEach((label, i) => {
      let [x, y] = point(i, max);
      // Push the label a little outside the outer ring.
      x += Math.cos(angle(i)) * 10;
      y += Math.sin(angle(i)) * 10 + (Math.sin(angle(i)) > 0.5 ? 10 : Math.sin(angle(i)) < -0.5 ? -16 : -4);
      ctx.fillStyle = cssVar('--text');
      ctx.textAlign = Math.abs(x - cx) < 5 ? 'center' : x > cx ? 'left' : 'right';
      // Keep long labels (e.g. "Vocabulary") inside the canvas.
      const w = ctx.measureText(label).width;
      if (ctx.textAlign === 'left') x = Math.min(x, size - w - 2);
      if (ctx.textAlign === 'right') x = Math.max(x, w + 2);
      const lvl = RINGS[Math.round(data.values[i]) - 1] || '—';
      ctx.fillText(label, x, y);
      ctx.fillStyle = accent;
      ctx.fillText(lvl, x, y + 14);
    });
  }

  SU.radar = { draw };
})();
