/* chartreel template: line race */
(function () {
  'use strict';
  const S = window.CHARTREEL_SPEC, CR = window.CR, T = CR.theme, D = S.data;
  const ser = D.series, K = D.times.length, n = ser.length;
  const TL = CR.timeline(K);
  CR.noteHold = CR.clamp(TL.M * 0.14, 0.9, 2.4);
  const colors = ser.map((s, i) => CR.colorOf(i, s));
  const names = ser.map((s) => (s.emoji ? s.emoji + ' ' : '') + (s.label || s.name));
  const u = CR.L.u;
  const MIN_SPAN = Math.max(1, (K - 1) * 0.28);

  let globalMax = 0, globalMin = Infinity;
  for (const s of ser) for (const v of s.values) if (v != null) { globalMax = Math.max(globalMax, v); globalMin = Math.min(globalMin, v); }
  const yFloor = Math.min(0, globalMin);
  const keyIndex = {};
  D.times.forEach((x, k) => (keyIndex[String(x)] = k));
  const keyTimeOf = (at) => (keyIndex[String(at)] == null ? null : TL.keyTime(keyIndex[String(at)]));

  // running maximum of everything drawn so far (monotonic, so the axis only grows)
  function seenMax(p) {
    let m = 0;
    const k = Math.floor(p);
    for (const s of ser) {
      for (let j = 0; j <= k; j++) if (s.values[j] != null && s.values[j] > m) m = s.values[j];
      const v = CR.valueAt(s.values, p);
      if (v != null && v > m) m = v;
    }
    return m;
  }
  function smoothYMax(t) {
    let acc = 0, wsum = 0;
    for (let j = 0; j < 9; j++) {
      const d = -1 + (2 * j) / 8, w = 1 - Math.abs(d) + 1e-3;
      acc += w * seenMax(TL.pos(CR.clamp(t + d * 0.5, 0, S.duration))); wsum += w;
    }
    return Math.max(acc / wsum, seenMax(TL.pos(t)));
  }

  let G = null;
  function layout(ctx) {
    const L = CR.L;
    const top = CR.header();
    const noteSize = (L.shape === 'portrait' ? 32 : 26) * u;
    const noteH = S.notes && S.notes.length ? noteSize * 1.9 + 22 * u : 0;
    const footTop = CR.footer();
    const labelSize = (L.shape === 'portrait' ? 30 : 26) * u;
    ctx.font = CR.font(labelSize, 700, 'sans');
    let labelW = 0;
    for (const nm of names) labelW = Math.max(labelW, ctx.measureText(nm).width);
    ctx.font = CR.font(labelSize, 600, 'sans');
    const valW = CR.numberWidth(CR.fmt(globalMax));
    const labelCol = Math.min(labelW + valW + 40 * u, L.W * 0.4);
    ctx.font = CR.font((L.shape === 'portrait' ? 26 : 22) * u, 500, 'sans');
    const yLabW = ctx.measureText(CR.fmtAxis(globalMax)).width + 16 * u;
    const plotX0 = L.m + yLabW;
    const plotX1 = L.W - L.m - labelCol;
    const plotTop = top + noteH + 26 * u;
    const plotBottom = footTop - 56 * u;
    G = { top, noteH, footTop, labelSize, labelW, plotX0, plotX1, plotTop, plotBottom };
  }

  function draw(ctx, t) {
    const L = CR.L;
    if (!G) layout(ctx);
    CR.background();
    CR.header();
    CR.footer();
    const { plotX0, plotX1, plotTop, labelSize } = G;
    const ph = CR.outroPhase(t, TL);
    const plotBottom = G.plotBottom - CR.takeawayBand() * ph.e; // make room for the takeaway band
    const p = TL.pos(t);
    const xEnd = Math.max(p, MIN_SPAN);
    const yMax = smoothYMax(t) * 1.08 || 1;
    const xs = (k) => plotX0 + (k / xEnd) * (plotX1 - plotX0);
    const ys = (v) => plotBottom - ((v - yFloor) / (yMax - yFloor)) * (plotBottom - plotTop);
    const intro = CR.easeOutCubic(TL.intro(t));

    // period watermark (top-left of the plot)
    const psize = (L.shape === 'portrait' ? 170 : 150) * u;
    CR.drawPeriod(D.times[CR.periodIndex(p)], plotX0 + 20 * u, plotTop + psize * 0.85, psize, 'left');

    // y grid
    ctx.save();
    ctx.font = CR.font((L.shape === 'portrait' ? 26 : 22) * u, 500, 'sans');
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (const tk of CR.ticks(yMax, 4)) {
      const y = ys(tk.v);
      if (y < plotTop - 2 * u) continue;
      ctx.globalAlpha = tk.a * intro;
      ctx.fillStyle = T.grid;
      ctx.fillRect(plotX0, y - 0.75 * u, plotX1 - plotX0 + 20 * u, 1.5 * u);
      ctx.fillStyle = T.muted;
      ctx.fillText(CR.fmtAxis(tk.v), plotX0 - 12 * u, y);
    }
    // x ticks in row-index space, labelled with the period names
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (const tk of CR.ticks(xEnd, L.shape === 'portrait' ? 4 : 6)) {
      const k = Math.round(tk.v);
      if (Math.abs(tk.v - k) > 1e-6 || k > p + 1e-6 || k >= K) continue;
      ctx.globalAlpha = tk.a * intro;
      ctx.fillStyle = T.muted;
      ctx.fillText(String(D.times[k]), xs(k), plotBottom + 14 * u);
    }
    ctx.restore();

    // lines
    const heads = [];
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const vals = ser[i].values;
      const pts = [];
      const kMax = Math.floor(p);
      for (let k = 0; k <= kMax; k++) if (vals[k] != null) pts.push([xs(k), ys(vals[k])]);
      const vh = CR.valueAt(vals, p);
      if (vh == null) continue;
      if (p > kMax + 1e-9) pts.push([xs(p), ys(vh)]);
      const c = colors[i];
      // soft area under the line
      if (pts.length > 1) {
        const g = ctx.createLinearGradient(0, plotTop, 0, plotBottom);
        g.addColorStop(0, CR.hexA(c, T.barGlow ? 0.14 : 0.10)); g.addColorStop(1, CR.hexA(c, 0));
        ctx.beginPath();
        ctx.moveTo(pts[0][0], plotBottom);
        for (const q of pts) ctx.lineTo(q[0], q[1]);
        ctx.lineTo(pts[pts.length - 1][0], plotBottom);
        ctx.closePath();
        ctx.globalAlpha = intro; ctx.fillStyle = g; ctx.fill();
      }
      ctx.beginPath();
      pts.forEach((q, j) => (j ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])));
      ctx.strokeStyle = c;
      ctx.lineWidth = (L.shape === 'portrait' ? 6 : 5) * u;
      if (T.barGlow) { ctx.shadowColor = c; ctx.shadowBlur = T.barGlow * 0.8 * u; }
      ctx.globalAlpha = intro;
      ctx.stroke();
      ctx.shadowBlur = 0;
      const hx = pts[pts.length - 1][0], hy = pts[pts.length - 1][1];
      heads.push({ i, x: hx, y: hy, v: vh });
    }
    // head dots
    for (const h of heads) {
      ctx.globalAlpha = intro;
      ctx.fillStyle = colors[h.i];
      ctx.beginPath(); ctx.arc(h.x, h.y, 10 * u, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = T.bg;
      ctx.beginPath(); ctx.arc(h.x, h.y, 4.5 * u, 0, Math.PI * 2); ctx.fill();
    }
    // labels with simple vertical relaxation so they never overlap
    const gap = labelSize * 1.2;
    const lab = heads.map((h) => ({ h, y: h.y })).sort((a, b) => a.y - b.y);
    for (let it = 0; it < 40; it++) {
      let moved = false;
      for (let j = 1; j < lab.length; j++) {
        const d = lab[j].y - lab[j - 1].y;
        if (d < gap) { const push = (gap - d) / 2; lab[j].y += push; lab[j - 1].y -= push; moved = true; }
      }
      for (const l of lab) l.y = CR.clamp(l.y, plotTop + gap / 2, plotBottom - gap / 2);
      if (!moved) break;
    }
    ctx.textBaseline = 'middle';
    for (const l of lab) {
      const x = l.h.x + 22 * u;
      ctx.globalAlpha = intro;
      if (Math.abs(l.y - l.h.y) > 3 * u) {
        ctx.strokeStyle = CR.hexA(colors[l.h.i], 0.6); ctx.lineWidth = 1.5 * u;
        ctx.beginPath(); ctx.moveTo(l.h.x + 11 * u, l.h.y); ctx.lineTo(x - 6 * u, l.y); ctx.stroke();
      }
      ctx.font = CR.font(labelSize, 700, 'sans');
      ctx.fillStyle = colors[l.h.i];
      ctx.textAlign = 'left';
      const nm = CR.ellipsize(names[l.h.i], G.labelW);
      ctx.fillText(nm, x, l.y);
      const nw = ctx.measureText(nm).width;
      ctx.font = CR.font(labelSize, 600, 'sans');
      ctx.fillStyle = T.text;
      CR.drawNumber(CR.fmt(l.h.v), x + nw + 12 * u, l.y, 'left');
    }
    ctx.globalAlpha = 1;
    ctx.textBaseline = 'alphabetic';
    // baseline
    ctx.fillStyle = T.muted; ctx.globalAlpha = 0.5;
    ctx.fillRect(plotX0, plotBottom, plotX1 - plotX0 + 20 * u, 2 * u);
    ctx.globalAlpha = 1;

    if (G.noteH) CR.drawNote(CR.noteAt(t, keyTimeOf), L.m, G.top - 6 * u, L.W - 2 * L.m);
    CR.drawTakeaway(ph.a, plotBottom + 50 * u + CR.takeawayBand() / 2);
  }

  function geometry(t) {
    const ph = CR.outroPhase(t, TL);
    const pb = G.plotBottom - CR.takeawayBand() * ph.e;
    const content = [{ name: 'plot', x: 0, y: G.plotTop - 10 * u, w: CR.L.W, h: pb + 44 * u - (G.plotTop - 10 * u) }];
    return { bars: [], content, card: ph.a > 0.001 ? CR.takeawayRect(pb + 50 * u + CR.takeawayBand() / 2) : null, footTop: G.footTop };
  }

  function state(t) {
    const p = TL.pos(t);
    const values = {}, texts = {};
    ser.forEach((s) => { const v = CR.valueAt(s.values, p); values[s.name] = v; texts[s.name] = v == null ? null : CR.fmt(v); });
    return { period: D.times[CR.periodIndex(p)], pos: p, values, texts };
  }

  CR.register({ draw, state, geometry: (t) => { if (!G) layout(CR.ctx); return geometry(t); }, keyTimes: () => D.times.map((_, k) => TL.keyTime(k)) });
})();
