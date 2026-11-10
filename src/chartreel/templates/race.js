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

  const FX = CR.fx;
  const yearRow = S.yearStyle === 'row' || S.yearStyle === 'badge';
  const showTimeline = S.progress === 'timeline' || S.progress === 'both' || !S.progress;
  const CROWN = '\u{1F451}';

  let G = null; // layout, computed once fonts are ready
  function layout(ctx) {
    const L = CR.L;
    const top = CR.header();
    const noteSize = (L.shape === 'portrait' ? 32 : 26) * u;
    let noteH = S.notes && S.notes.length ? noteSize * 1.9 + 22 * u : 0;
    // big year row (style presets): the year on the left, event notes beside it
    let yearH = 0, yearSize = 0, yearW = 0;
    if (yearRow) {
      yearH = (L.shape === 'portrait' ? 160 : L.shape === 'landscape' ? 96 : 120) * u;
      yearSize = yearH * (S.yearStyle === 'badge' ? 0.62 : 0.86);
      ctx.font = CR.font(yearSize, T.weight || 800, T.family === 'serif' ? 'serif' : 'sans');
      for (const x of D.times) yearW = Math.max(yearW, CR.numberWidth(String(x)));
      noteH = 0;
    }
    const footTop = CR.footer();
    const progH = (showTimeline ? (L.shape === 'portrait' ? 70 : 46) : 24) * u;
    const axisH = 40 * u;
    const chartTop = top + noteH + yearH;
    const barsTop = chartTop + axisH;
    const chartBottom = footTop - progH;
    const slot = (chartBottom - barsTop) / N;
    const barH = Math.min(slot * 0.76, 120 * u);
    const nameSize = CR.clamp(slot * (L.shape === 'landscape' ? 0.4 : 0.34), 18 * u, (L.shape === 'portrait' ? 40 : 38) * u);
    ctx.font = CR.font(nameSize, 600, 'sans');
    let labelW = 0;
    for (const nm of names) labelW = Math.max(labelW, ctx.measureText(nm).width);
    labelW = Math.min(labelW, L.W * (L.shape === 'portrait' ? 0.34 : 0.26));
    const rankW = S.ranks ? Math.min(slot * 0.62, (L.shape === 'portrait' ? 54 : 46) * u) : 0;
    const x0 = L.m + (rankW ? rankW + 14 * u : 0) + labelW + 18 * u;
    ctx.font = CR.font(nameSize * 0.98, 700, 'sans');
    let reserve = CR.numberWidth(CR.fmt(globalMax)) + 26 * u;
    if (S.leader) reserve += nameSize * 1.25;
    if (FX.arrows) reserve += nameSize * 0.9;
    const xR = L.W - L.m - reserve;
    G = { top, noteH, footTop, progH, axisH, chartTop, barsTop, chartBottom, slot, barH, nameSize, labelW, x0, xR,
          barMaxW: xR - x0, rankW, yearH, yearSize, yearW };
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

  // rank changes (raw ranks, sampled at 60 Hz): every gain is an event; gains into the
  // top 3 drive the punch-in and the confetti
  let EV = null;
  function events() {
    if (EV) return EV;
    EV = [];
    const last = {};
    let prev = ranksAt(TL.I);
    for (let t = TL.I + 1 / 60; t <= TL.I + TL.M + 1e-9; t += 1 / 60) {
      const r = ranksAt(t);
      for (let i = 0; i < n; i++) {
        if (r[i] < prev[i] && r[i] < N) {
          const key = i + ':' + r[i];
          if (last[key] == null || t - last[key] > 1.0) EV.push({ t, i, r: r[i], from: prev[i] });
          last[key] = t;
        }
      }
      prev = r;
    }
    // keep only gains that stick for half a second (no flicker when two values are neck and neck)
    const kept = EV.filter((e) => ranksAt(Math.min(e.t + 0.5, TL.I + TL.M))[e.i] <= e.r);
    EV.length = 0; EV.push(...kept);
    EV.podium = EV.filter((e) => e.r <= 2);
    return EV;
  }
  function punch(t) {
    let a = 0;
    for (const e of events().podium) {
      const age = t - e.t;
      if (age < 0 || age > 0.6) continue;
      const amp = (e.r === 0 ? 0.05 : 0.03);
      a = Math.max(a, amp * (age < 0.08 ? CR.easeOutCubic(age / 0.08) : 1 - CR.easeInOutCubic((age - 0.08) / 0.52)));
    }
    return a;
  }
  const bursts = [];
  function burstsAt(t) {
    // origin = tip of the climbing bar at the moment it takes the new rank
    for (const e of events().podium) {
      if (e.origin || t < e.t) continue;
      const { bars } = barsAt(e.t, frameGeom(e.t).cb);
      const b = bars.find((x) => x.i === e.i);
      e.origin = b ? { x: b.x + b.w, y: b.cy } : { x: CR.L.W / 2, y: CR.L.H / 2 };
      bursts.push({ t: e.t, x: e.origin.x, y: e.origin.y, seed: e.i * 7 + e.r * 13 + 1 });
    }
    return bursts;
  }
  const hlSet = Array.isArray(S.highlight) ? new Set(S.highlight) : null;
  function highlightOf(b) {
    if (!S.highlight) return 1;
    if (hlSet) return hlSet.has(ser[b.i].name) ? 1 : 0;
    return 1 - CR.smoothstep(0.2, 0.8, b.pos); // 'leader'
  }
  const DIM = T.family === 'serif' ? '#C9C1B4' : '#5A6170';

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

    const pIdx = CR.periodIndex(p);
    const roll = S.yearStyle && S.yearStyle !== 'watermark' ? CR.periodRoll(D.times, p, perKey) : { from: D.times[pIdx], to: D.times[pIdx], f: 0 };
    if (FX.glass) {
      ctx.save();
      const y0 = barsTop - 54 * u, y1 = cb + G.progH * (showTimeline ? 1 : 0.6);
      CR.roundRect(L.m * 0.45, y0, L.W - L.m * 0.9, y1 - y0, 28 * u);
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1.5 * u; ctx.stroke();
      ctx.restore();
    }
    if (!yearRow) {
      // period watermark behind the bars (optionally rolling)
      const psize = (L.shape === 'portrait' ? 200 : L.shape === 'landscape' ? 170 : 150) * u * (cb - barsTop) / (G.chartBottom - barsTop);
      ctx.save();
      ctx.font = CR.font(psize, 800, 'sans');
      ctx.fillStyle = S.yearStyle === 'roll' ? T.accent : T.text;
      ctx.globalAlpha = S.yearStyle === 'roll' ? Math.max(T.periodAlpha, 0.22) : T.periodAlpha;
      CR.drawRoll(roll.from, roll.to, roll.f, L.W - L.m, cb - 18 * u, 'right');
      ctx.restore();
    } else {
      // big year row under the header
      const yb = G.top + G.yearH * 0.86;
      ctx.save();
      ctx.font = CR.font(G.yearSize, T.weight || 800, T.family === 'serif' ? 'serif' : 'sans');
      if (S.yearStyle === 'badge') {
        const bh = G.yearSize * 1.18, by = yb - G.yearSize * 0.98;
        ctx.fillStyle = T.accent; ctx.fillRect(L.m, by, G.yearW + G.yearSize * 0.6, bh);
        ctx.fillStyle = '#FFFFFF';
        CR.drawRoll(roll.from, roll.to, roll.f, L.m + G.yearSize * 0.3, yb - G.yearSize * 0.07, 'left');
      } else {
        ctx.fillStyle = T.family === 'serif' ? T.accent : T.text;
        if (T.barGlow) { ctx.shadowColor = T.accent; ctx.shadowBlur = 24 * u; }
        CR.drawRoll(roll.from, roll.to, roll.f, L.m, yb, 'left');
      }
      ctx.restore();
      const nx = L.m + G.yearW + G.yearSize * (S.yearStyle === 'badge' ? 0.6 : 0) + 30 * u;
      const nsz = (L.shape === 'portrait' ? 32 : 26) * u;
      CR.drawNote(CR.noteAt(t, keyTimeOf), nx, yb - G.yearSize * 0.42 - nsz * 0.95, L.W - L.m - nx);
    }

    // rank numbers (news / bold): fixed slots, not attached to bars
    if (S.ranks) {
      ctx.save();
      const slot = (cb - barsTop) / N;
      const rw = G.rankW;
      ctx.font = CR.font(rw * 0.5, 800, 'sans'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (let k = 0; k < N; k++) {
        const cy = barsTop + k * slot + slot / 2;
        ctx.fillStyle = k === 0 ? T.accent : T.family === 'serif' ? 'rgba(30,26,22,0.1)' : 'rgba(255,255,255,0.12)';
        ctx.globalAlpha = grow;
        CR.roundRect(L.m, cy - rw / 2, rw, rw, T.rankBox ? 4 * u : rw / 2); ctx.fill();
        ctx.fillStyle = k === 0 ? (T.cardText || '#FFFFFF') : T.text;
        ctx.fillText(String(k + 1), L.m + rw / 2, cy + 1 * u);
      }
      ctx.restore();
    }

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
    const labels = [];
    const leadW = (b) => (S.leader ? 1 - CR.smoothstep(0.2, 0.8, b.pos) : 0);
    for (const b of bars) {
      if (b.alpha <= 0.01) continue;
      const hl = highlightOf(b);
      const c = hl >= 1 ? colors[b.i] : CR.mix(DIM, colors[b.i], hl);
      const lw = leadW(b);
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
        if (lw > 0.01 && (T.barGlow || T.glass || T.family === 'mono')) { ctx.shadowColor = CR.hexA(c, 0.9); ctx.shadowBlur = (T.barGlow || 16) * 1.6 * u * lw; }
        CR.barPath(x0, y, b.w, b.h, b.h * 0.22);
        ctx.fill();
        ctx.shadowBlur = 0;
        if (T.barGradient) { ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(x0, y, Math.max(0, b.w - b.h * 0.22), Math.max(1, b.h * 0.08)); }
        if (T.glass) { ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(x0, y, Math.max(0, b.w - b.h * 0.22), Math.max(1, b.h * 0.42)); }
        if (lw > 0.01) {
          // #1 gets an outline
          ctx.globalAlpha = b.alpha * lw * 0.9;
          ctx.strokeStyle = T.cardText && T.family !== 'serif' ? '#FFFFFF' : T.text; ctx.lineWidth = 3 * u;
          CR.barPath(x0, y, b.w, b.h, b.h * 0.22); ctx.stroke();
          ctx.globalAlpha = b.alpha;
        }
        if (FX.trails) {
          // speed streaks inside the bar, proportional to how fast it is growing
          const v0 = CR.valueAt(ser[b.i].values, TL.pos(t - 0.15));
          const dv = v0 == null ? 0 : ((b.v - v0) / xmax) * barMaxW;
          if (dv > 3 * u && b.h > 6 * u) {
            ctx.save();
            CR.barPath(x0, y, b.w, b.h, b.h * 0.22); ctx.clip();
            const len = Math.min(dv * 3, b.w * 0.6);
            ctx.globalAlpha = b.alpha * Math.min(0.5, dv / (30 * u));
            for (const [k, off] of [[0, 0.28], [1, 0.52], [2, 0.74]]) {
              const sx0 = x0 + b.w - 10 * u - len * (0.6 + 0.4 * CR.rnd(b.i, k));
              const g = ctx.createLinearGradient(sx0, 0, x0 + b.w - 8 * u, 0);
              g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,0.9)');
              ctx.fillStyle = g; ctx.fillRect(sx0, y + b.h * off, x0 + b.w - 8 * u - sx0, Math.max(1, 2.5 * u));
            }
            ctx.restore();
          }
        }
      }
      labels.push(() => {
      ctx.textBaseline = 'middle';
      ctx.fillStyle = hl >= 1 ? T.text : CR.mix(T.family === 'serif' ? '#8A8178' : '#8C97AB', T.text.length === 7 ? T.text : '#FFFFFF', hl);
      ctx.globalAlpha = b.alpha * b.labelAlpha;
      ctx.font = CR.font(nameSize, hl >= 0.5 ? 700 : 500, T.bodyFamily || 'sans');
      ctx.textAlign = 'right';
      ctx.fillText(CR.ellipsize(names[b.i], G.labelW), x0 - 16 * u, b.cy + 1 * u);
      ctx.textAlign = 'left';
      ctx.font = CR.font(nameSize * 0.98, 700, T.bodyFamily || 'sans');
      ctx.globalAlpha = b.alpha * b.labelAlpha * CR.smoothstep(0.55, 1, grow);
      let vx = x0 + b.w + 14 * u;
      vx += CR.drawNumber(CR.fmt(b.v), vx, b.cy + 1 * u, 'left');
      if (lw > 0.01) {
        ctx.globalAlpha *= lw;
        ctx.font = CR.font(nameSize * 0.95, 400, 'sans');
        ctx.fillText(CROWN, vx + 10 * u, b.cy + 1 * u);
        vx += nameSize * 1.25;
        ctx.globalAlpha = b.alpha * b.labelAlpha;
      }
      if (FX.arrows) {
        let age = 9;
        for (const e of events()) if (e.i === b.i && t >= e.t) age = Math.min(age, t - e.t);
        if (age < 1.0) {
          ctx.globalAlpha = b.alpha * b.labelAlpha * (1 - CR.smoothstep(0.6, 1.0, age));
          ctx.fillStyle = '#39E58C';
          ctx.font = CR.font(nameSize * 0.8, 800, 'sans');
          ctx.fillText('▲', vx + 10 * u, b.cy + 1 * u - CR.easeOutCubic(age / 0.3) * 4 * u);
        }
      }
      });
    }
    ctx.restore();
    // confetti flies over the bars but under the names and values, so numbers stay readable
    if (FX.confetti) CR.drawConfetti(burstsAt(t), t);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, barsTop - 4 * u, L.W, cb - barsTop + 4 * u);
    ctx.clip();
    for (const f of labels) { ctx.globalAlpha = 1; f(); }
    ctx.restore();
    ctx.textBaseline = 'alphabetic';
    // axis baseline
    ctx.fillStyle = T.muted; ctx.globalAlpha = 0.5;
    ctx.fillRect(x0 - 1 * u, barsTop - 8 * u, 2 * u, cb - barsTop + 8 * u);
    ctx.globalAlpha = 1;

    // timeline progress
    if (showTimeline) {
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
    }

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

  CR.register({ draw, state, punch: (t) => { if (!G) return 0; return punch(t); }, events: () => events().map((e) => ({ t: e.t, name: ser[e.i].name, rank: e.r + 1, from: e.from + 1 })), geometry: (t) => { if (!G) layout(CR.ctx); return geometry(t); }, keyTimes: () => D.times.map((_, k) => TL.keyTime(k)) });
})();
