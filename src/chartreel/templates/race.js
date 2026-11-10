/* chartreel template: bar chart race */
(function () {
  'use strict';
  const S = window.CHARTREEL_SPEC, CR = window.CR, T = CR.theme, D = S.data;
  const ser = D.series, K = D.times.length, n = ser.length;
  const TL = CR.timeline(K);
  CR.noteHold = CR.clamp(TL.M * 0.14, 0.9, 2.4);
  const N = Math.max(1, Math.min(S.top || 10, n));
  const colors = ser.map((s, i) => CR.colorOf(i, s));
  const names = ser.map((s) => (s.label || s.name) + (s.emoji ? ' ' + s.emoji : ''));
  const u = CR.L.u;
  const perKey = TL.M / Math.max(1, K - 1);
  const W_RANK = CR.clamp(perKey * 0.6, 0.12, 0.3);
  const W_MAX = CR.clamp(perKey * 1.6, 0.3, 0.9);

  const valuesAt = (t) => { const p = TL.pos(t); return ser.map((s) => CR.valueAt(s.values, p)); };
  function ranksAt(t) {
    const v = valuesAt(t);
    const idx = [];
    for (let i = 0; i < n; i++) if (v[i] != null) idx.push(i);
    idx.sort((a, b) => v[b] - v[a] || a - b);
    const r = new Array(n).fill(n + 1);
    idx.forEach((i, k) => (r[i] = k));
    return r;
  }
  // triangle-filtered rank: smooth, deterministic overtakes
  const SAMPLES = 15;
  function smoothRanks(t) {
    const acc = new Array(n).fill(0);
    let wsum = 0;
    for (let j = 0; j < SAMPLES; j++) {
      const d = -1 + (2 * j) / (SAMPLES - 1);
      const w = 1 - Math.abs(d) + 1e-3;
      const r = ranksAt(CR.clamp(t + d * W_RANK, 0, S.duration));
      for (let i = 0; i < n; i++) acc[i] += w * Math.min(r[i], N + 1);
      wsum += w;
    }
    return acc.map((x) => x / wsum);
  }
  function maxAt(t) { let m = 0; for (const v of valuesAt(t)) if (v != null && v > m) m = v; return m; }
  function smoothMax(t) {
    let acc = 0, wsum = 0;
    for (let j = 0; j < 9; j++) {
      const d = -1 + (2 * j) / 8, w = 1 - Math.abs(d) + 1e-3;
      acc += w * maxAt(CR.clamp(t + d * W_MAX, 0, S.duration)); wsum += w;
    }
    return Math.max(acc / wsum, maxAt(t));
  }
  let globalMax = 0;
  for (const s of ser) for (const v of s.values) if (v != null && v > globalMax) globalMax = v;
  const keyIndex = {};
  D.times.forEach((x, k) => (keyIndex[String(x)] = k));
  const keyTimeOf = (at) => (keyIndex[String(at)] == null ? null : TL.keyTime(keyIndex[String(at)]));

  let G = null; // layout, computed once fonts are ready
  function layout(ctx) {
    const L = CR.L;
    const top = CR.header();
    const noteSize = (L.shape === 'portrait' ? 32 : 26) * u;
    const noteH = S.notes && S.notes.length ? noteSize * 1.9 + 22 * u : 0;
    const footTop = CR.footer();
    const progH = (L.shape === 'portrait' ? 70 : 46) * u;
    const axisH = 40 * u;
    const chartTop = top + noteH;
    const barsTop = chartTop + axisH;
    const chartBottom = footTop - progH;
    const slot = (chartBottom - barsTop) / N;
    const barH = Math.min(slot * 0.76, 120 * u);
    const nameSize = CR.clamp(slot * (L.shape === 'landscape' ? 0.4 : 0.34), 18 * u, (L.shape === 'portrait' ? 40 : 38) * u);
    ctx.font = CR.font(nameSize, 600, 'sans');
    let labelW = 0;
    for (const nm of names) labelW = Math.max(labelW, ctx.measureText(nm).width);
    labelW = Math.min(labelW, L.W * (L.shape === 'portrait' ? 0.34 : 0.26));
    const x0 = L.m + labelW + 18 * u;
    ctx.font = CR.font(nameSize * 0.98, 700, 'sans');
    const reserve = CR.numberWidth(CR.fmt(globalMax)) + 26 * u;
    const xR = L.W - L.m - reserve;
    G = { top, noteH, footTop, progH, axisH, chartTop, barsTop, chartBottom, slot, barH, nameSize, labelW, x0, xR, barMaxW: xR - x0 };
  }

  // Bar rectangles for frame t. Bars never intersect: while two bars pass each other they
  // get thinner, so there is always a clear gap between any two bars (see tests/test_overlap.py).
  const GAP = () => Math.max(2, 6 * u);
  function barsAt(t, cb) {
    const { barsTop, x0, barMaxW } = G;
    const slot = (cb - barsTop) / N;
    const barH = Math.min(slot * 0.76, 120 * u);
    const vals = valuesAt(t);
    // sharpen each one-rank step (easeInOutCubic is symmetric, so two bars trading places
    // stay mirror images): passing bars spend less time pinched thin
    const pos = smoothRanks(t).map((q) => { const f = Math.floor(q); return f + CR.easeInOutCubic(q - f); });
    const xmax = smoothMax(t) || 1;
    const grow = CR.easeOutCubic(TL.intro(t) * 1.15);
    const vis = [];
    for (let i = 0; i < n; i++) if (vals[i] != null && pos[i] < N + 0.6) vis.push(i);
    const gap = GAP();
    const out = [];
    for (const i of vis) {
      // largest thickness that keeps a gap to every other bar
      let h = barH;
      for (const j of vis) {
        if (j === i) continue;
        const d = Math.abs(pos[i] - pos[j]) * slot;
        if (d < barH + gap) h = Math.min(h, d - gap);
      }
      // passing bars: the larger one keeps its labels, the other fades them
      let fade = 0;
      for (const j of vis) {
        if (j === i || vals[j] <= vals[i]) continue;
        const d = Math.abs(pos[i] - pos[j]);
        if (d < 0.85) fade = Math.max(fade, 1 - d / 0.85);
      }
      const cy = barsTop + pos[i] * slot + slot / 2;
      out.push({
        i, pos: pos[i], v: vals[i], cy, h: Math.max(0, h), barH,
        x: x0, w: Math.max(3 * u, (vals[i] / xmax) * barMaxW * grow),
        alpha: CR.clamp(N + 0.15 - pos[i], 0, 1),
        labelAlpha: 1 - CR.smoothstep(0.15, 0.85, fade),
      });
    }
    return { bars: out, xmax, grow, slot };
  }

  // during the outro the chart makes room for the takeaway card in its own band
  function frameGeom(t) {
    const ph = CR.outroPhase(t, TL);
    const band = CR.takeawayBand();
    const cb = G.chartBottom - band * ph.e;
    const cardCy = cb + G.progH + band / 2;
    return { ph, band, cb, cardCy };
  }

  function draw(ctx, t) {
    const L = CR.L;
    if (!G) layout(ctx);
    CR.background();
    CR.header();
    CR.footer();
    const p = TL.pos(t);
    const { ph, cb, cardCy } = frameGeom(t);
    const { barsTop, x0, xR, barMaxW, nameSize } = G;
    const { bars, xmax, grow } = barsAt(t, cb);
    const sx = (v) => x0 + (v / xmax) * barMaxW;

    // period watermark behind the bars
    const pIdx = CR.periodIndex(p);
    const psize = (L.shape === 'portrait' ? 200 : L.shape === 'landscape' ? 170 : 150) * u * (cb - barsTop) / (G.chartBottom - barsTop);
    CR.drawPeriod(D.times[pIdx], L.W - L.m, cb - 18 * u, psize, 'right');

    // value axis with cross-fading ticks
    ctx.save();
    ctx.font = CR.font((L.shape === 'portrait' ? 24 : 22) * u, 500, 'sans');
    ctx.textAlign = 'center';
    for (const tk of CR.ticks(xmax, L.shape === 'portrait' ? 3 : 4)) {
      const x = sx(tk.v);
      if (tk.v === 0 || x > xR + 30 * u) continue;
      const edge = 1 - CR.smoothstep(xR - 10 * u, xR + 30 * u, x);
      const a = tk.a * edge * grow;
      if (a <= 0.01) continue;
      ctx.globalAlpha = a;
      ctx.fillStyle = T.grid;
      ctx.fillRect(x - 0.75 * u, barsTop - 8 * u, 1.5 * u, cb - barsTop);
      ctx.fillStyle = T.muted;
      ctx.fillText(CR.fmtAxis(tk.v), x, barsTop - 16 * u);
    }
    ctx.restore();

    // bars, bottom-up
    bars.sort((a, b) => b.pos - a.pos);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, barsTop - 4 * u, L.W, cb - barsTop + 4 * u);
    ctx.clip();
    for (const b of bars) {
      if (b.alpha <= 0.01) continue;
      const c = colors[b.i];
      if (b.h >= 0.5) {
        const y = b.cy - b.h / 2;
        ctx.globalAlpha = b.alpha;
        if (T.barGradient) {
          const g = ctx.createLinearGradient(x0, 0, x0 + b.w, 0);
          g.addColorStop(0, CR.hexA(c, 0.5));
          g.addColorStop(1, c);
          ctx.fillStyle = g;
        } else ctx.fillStyle = c;
        if (T.barGlow) { ctx.shadowColor = CR.hexA(c, 0.75); ctx.shadowBlur = T.barGlow * u * (b.h / b.barH); }
        CR.barPath(x0, y, b.w, b.h, b.h * 0.22);
        ctx.fill();
        ctx.shadowBlur = 0;
        if (T.barGradient) { ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(x0, y, Math.max(0, b.w - b.h * 0.22), Math.max(1, b.h * 0.08)); }
      }
      ctx.textBaseline = 'middle';
      ctx.fillStyle = T.text;
      ctx.globalAlpha = b.alpha * b.labelAlpha;
      ctx.font = CR.font(nameSize, 600, 'sans');
      ctx.textAlign = 'right';
      ctx.fillText(CR.ellipsize(names[b.i], G.labelW), x0 - 16 * u, b.cy + 1 * u);
      ctx.textAlign = 'left';
      ctx.font = CR.font(nameSize * 0.98, 700, 'sans');
      ctx.globalAlpha = b.alpha * b.labelAlpha * CR.smoothstep(0.55, 1, grow);
      CR.drawNumber(CR.fmt(b.v), x0 + b.w + 14 * u, b.cy + 1 * u, 'left');
    }
    ctx.restore();
    ctx.textBaseline = 'alphabetic';
    // axis baseline
    ctx.fillStyle = T.muted; ctx.globalAlpha = 0.5;
    ctx.fillRect(x0 - 1 * u, barsTop - 8 * u, 2 * u, cb - barsTop + 8 * u);
    ctx.globalAlpha = 1;

    // timeline progress
    const py = cb + G.progH * 0.55;
    const frac = K > 1 ? p / (K - 1) : 1;
    ctx.fillStyle = T.grid;
    CR.roundRect(x0, py - 3 * u, xR - x0, 6 * u, 3 * u); ctx.fill();
    ctx.fillStyle = T.accent;
    CR.roundRect(x0, py - 3 * u, Math.max(6 * u, (xR - x0) * frac), 6 * u, 3 * u); ctx.fill();
    ctx.beginPath(); ctx.arc(x0 + (xR - x0) * frac, py, 9 * u, 0, Math.PI * 2); ctx.fill();
    ctx.font = CR.font(22 * u, 600, 'sans'); ctx.fillStyle = T.muted; ctx.textBaseline = 'middle';
    ctx.textAlign = 'right'; ctx.fillText(String(D.times[0]), x0 - 16 * u, py + 1 * u);
    ctx.textAlign = 'left'; ctx.fillText(String(D.times[K - 1]), xR + 16 * u, py + 1 * u);
    ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';

    if (G.noteH) CR.drawNote(CR.noteAt(t, keyTimeOf), L.m, G.top - 6 * u, L.W - 2 * L.m);
    CR.drawTakeaway(ph.a, cardCy);
  }

  // geometry for tests: bar rectangles (clipped to the chart), the chart box and the card
  function geometry(t) {
    const { ph, cb, cardCy } = frameGeom(t);
    const { bars } = barsAt(t, cb);
    const top = G.barsTop - 4 * u;
    const rects = [];
    for (const b of bars) {
      if (b.alpha <= 0.01 || b.h < 0.5) continue;
      const y0 = Math.max(top, b.cy - b.h / 2), y1 = Math.min(cb, b.cy + b.h / 2);
      if (y1 > y0) rects.push({ name: ser[b.i].name, x: b.x, y: y0, w: b.w, h: y1 - y0 });
    }
    const content = [{ name: 'chart', x: 0, y: G.barsTop - 30 * u, w: CR.L.W, h: cb + G.progH * 0.55 + 10 * u - (G.barsTop - 30 * u) }];
    return { bars: rects, content, card: ph.a > 0.001 ? CR.takeawayRect(cardCy) : null, footTop: G.footTop };
  }

  function state(t) {
    const p = TL.pos(t);
    const v = valuesAt(t);
    const r = ranksAt(t);
    const values = {}, texts = {};
    ser.forEach((s, i) => { values[s.name] = v[i]; texts[s.name] = v[i] == null ? null : CR.fmt(v[i]); });
    const top = ser.map((s, i) => i).filter((i) => r[i] < N).sort((a, b) => r[a] - r[b]).map((i) => ser[i].name);
    return { period: D.times[CR.periodIndex(p)], pos: p, values, texts, top };
  }

  CR.register({ draw, state, geometry: (t) => { if (!G) layout(CR.ctx); return geometry(t); }, keyTimes: () => D.times.map((_, k) => TL.keyTime(k)) });
})();
