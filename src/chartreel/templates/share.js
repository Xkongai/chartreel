/* chartreel template: share shift (10x10 waffle) */
(function () {
  'use strict';
  const S = window.CHARTREEL_SPEC, CR = window.CR, T = CR.theme, D = S.data;
  const ser = D.series, K = D.times.length, n = ser.length;
  const TL = CR.timeline(K);
  CR.noteHold = CR.clamp(TL.M * 0.14, 0.9, 2.4);
  const u = CR.L.u;
  const colors = ser.map((s, i) => CR.colorOf(i, s));
  const names = ser.map((s) => (s.emoji ? s.emoji + ' ' : '') + (s.label || s.name));
  const CELLS = 100;
  const keyIndex = {};
  D.times.forEach((x, k) => (keyIndex[String(x)] = k));
  const keyTimeOf = (at) => (keyIndex[String(at)] == null ? null : TL.keyTime(keyIndex[String(at)]));

  function sharesAtPos(p) {
    const v = ser.map((s) => CR.valueAt(s.values, p) || 0);
    const total = v.reduce((a, b) => a + b, 0) || 1;
    return v.map((x) => (100 * x) / total);
  }
  // largest-remainder rounding: always exactly 100 cells
  function allocate(shares) {
    const base = shares.map((s) => Math.floor(s));
    let left = CELLS - base.reduce((a, b) => a + b, 0);
    const order = shares.map((s, i) => [s - Math.floor(s), i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
    for (let j = 0; left > 0 && j < order.length; j++, left--) base[order[j][1]]++;
    const cells = [];
    base.forEach((c, i) => { for (let k = 0; k < c; k++) cells.push(i); });
    return cells;
  }
  const cellsAt = (t) => allocate(sharesAtPos(TL.pos(CR.clamp(t, 0, S.duration))));
  const start = sharesAtPos(0);

  let G = null;
  function layout(ctx) {
    const L = CR.L;
    const top = CR.header();
    const noteSize = (L.shape === 'portrait' ? 32 : 26) * u;
    const noteH = S.notes && S.notes.length ? noteSize * 1.9 + 22 * u : 0;
    const footTop = CR.footer();
    const areaTop = top + noteH;
    const areaH = footTop - areaTop;
    const areaW = L.W - 2 * L.m;
    let grid, legend;
    if (L.shape === 'portrait') {
      const side = Math.min(areaW * 0.86, areaH * 0.5);
      grid = { x: (L.W - side) / 2, y: areaTop + 10 * u, side };
      legend = { x: L.m, y: grid.y + side + 36 * u, w: areaW, h: footTop - (grid.y + side + 36 * u) };
    } else {
      const side = Math.min(areaH - 20 * u, areaW * 0.5);
      grid = { x: L.m, y: areaTop + (areaH - side) / 2, side };
      const lx = grid.x + side + 70 * u;
      legend = { x: lx, y: grid.y, w: L.W - L.m - lx, h: side };
    }
    G = { top, noteH, footTop, grid, legend, areaTop, contentBottom: Math.max(grid.y + grid.side, footTop - 6 * u) };
  }

  function squeezeAt(t) {
    const ph = CR.outroPhase(t, TL);
    const band = CR.takeawayBand();
    const target = Math.min(G.contentBottom, G.footTop - band);
    return { ph, bottom: G.contentBottom - (G.contentBottom - target) * ph.e, cardCy: G.footTop - band / 2 };
  }
  function geometry(t) {
    const sq = squeezeAt(t);
    const s = CR.clamp((sq.bottom - G.areaTop) / Math.max(1, G.contentBottom - G.areaTop), 0.3, 1);
    const g = G.grid;
    const content = [CR.squeezeRect({ name: 'waffle', x: g.x, y: g.y, w: g.side, h: g.side }, G.areaTop, s),
                     CR.squeezeRect({ name: 'legend', x: G.legend.x, y: G.legend.y, w: G.legend.w, h: G.contentBottom - G.legend.y }, G.areaTop, s)];
    return { bars: [], content, card: sq.ph.a > 0.001 ? CR.takeawayRect(sq.cardCy) : null, footTop: G.footTop };
  }

  function draw(ctx, t) {
    const L = CR.L;
    if (!G) layout(ctx);
    CR.background();
    CR.header();
    CR.footer();
    const sq = squeezeAt(t);
    ctx.save();
    CR.squeeze(G.areaTop, G.contentBottom, sq.bottom);
    const p = TL.pos(t);
    const intro = TL.intro(t);
    const { grid, legend } = G;
    const cell = grid.side / 10;
    const gap = cell * 0.14;

    // cross-fade cells that change owner over the last 0.3 s
    const now = cellsAt(t);
    const hist = [0.3, 0.2, 0.1].map((d) => cellsAt(t - d));
    for (let c = 0; c < CELLS; c++) {
      const row = Math.floor(c / 10), col = c % 10;
      const x = grid.x + col * cell + gap / 2, y = grid.y + row * cell + gap / 2;
      const appear = CR.easeOutCubic(intro * 1.6 - (row + col) * 0.045);
      if (appear <= 0) continue;
      let same = 1;
      for (const h of hist) if (h[c] !== now[c]) same++;
      const blend = same / (hist.length + 1);
      const prev = hist[0][c];
      const color = prev === now[c] ? colors[now[c]] : CR.mix(colors[prev], colors[now[c]], CR.smoothstep(0, 1, 1 - blend + 0.25));
      const s = (cell - gap) * (0.6 + 0.4 * appear);
      ctx.globalAlpha = CR.clamp(appear, 0, 1);
      ctx.fillStyle = color;
      if (T.barGlow) { ctx.shadowColor = color; ctx.shadowBlur = T.barGlow * 0.5 * u; }
      CR.roundRect(x + (cell - gap - s) / 2, y + (cell - gap - s) / 2, s, s, s * 0.22);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;

    // legend: period, then one row per series with share and change since start
    const shares = sharesAtPos(p);
    const portrait = L.shape === 'portrait';
    const psize = (portrait ? 104 : 130) * u;
    ctx.save();
    ctx.font = CR.font(psize, 800, 'sans');
    ctx.fillStyle = T.text;
    ctx.globalAlpha = 0.9;
    let y = legend.y + psize * 0.82;
    CR.drawNumber(String(D.times[CR.periodIndex(p)]), legend.x, y, 'left');
    ctx.font = CR.font(22 * u, 500, 'sans');
    ctx.fillStyle = T.muted;
    ctx.textAlign = portrait ? 'right' : 'left';
    ctx.fillText(S.cellLabel || (S.format && S.format.locale === 'zh' ? '每格 = 1%' : '1 square = 1%'),
      portrait ? legend.x + legend.w : legend.x, portrait ? y : y + 40 * u);
    ctx.restore();
    y += portrait ? 24 * u : 70 * u;
    const cols = 1;
    const rowsPer = Math.ceil(n / cols);
    const rowH = Math.min((legend.y + legend.h - y) / rowsPer, 96 * u);
    const colW = legend.w / cols;
    const size = CR.clamp(rowH * (portrait ? 0.46 : 0.36), 18 * u, 34 * u);
    for (let i = 0; i < n; i++) {
      const cx = legend.x + Math.floor(i / rowsPer) * colW;
      const cy = y + (i % rowsPer) * rowH + rowH / 2;
      ctx.globalAlpha = CR.smoothstep(0.2, 0.9, intro);
      ctx.fillStyle = colors[i];
      CR.roundRect(cx, cy - size * 0.5, size, size, size * 0.24); ctx.fill();
      ctx.textBaseline = 'middle';
      const delta = shares[i] - start[i];
      const up = T === CR.THEMES.paper ? '#2E7D5B' : '#3DDC97', down = T === CR.THEMES.paper ? '#B8322A' : '#FF6B6B';
      const dText = (delta >= 0 ? '▲ +' : '▼ ') + delta.toFixed(1) + ' pp';
      ctx.font = CR.font(size, 800, 'sans');
      const valW = CR.numberWidth('100.0%');
      ctx.font = CR.font(size * 0.68, 600, 'sans');
      const dW = CR.numberWidth('▼ -00.0 pp');
      const right = cx + colW - 24 * u;
      const nameX = cx + size * 1.5;
      if (portrait) {
        ctx.font = CR.font(size * 0.8, 600, 'sans');
        const dW2 = CR.numberWidth('▼ -00.0 pp');
        ctx.font = CR.font(size * 0.92, 600, 'sans'); ctx.fillStyle = T.text;
        ctx.fillText(CR.ellipsize(names[i], right - valW - dW2 - 40 * u - nameX), nameX, cy + 1 * u);
        ctx.font = CR.font(size * 0.8, 600, 'sans');
        ctx.fillStyle = Math.abs(delta) < 0.05 ? T.muted : delta > 0 ? up : down;
        CR.drawNumber(dText, right - valW - 24 * u, cy + 1 * u, 'right');
      } else {
        ctx.font = CR.font(size * 0.9, 600, 'sans'); ctx.fillStyle = T.text;
        ctx.fillText(CR.ellipsize(names[i], right - valW - 20 * u - nameX), nameX, cy - size * 0.32);
        ctx.font = CR.font(size * 0.68, 600, 'sans');
        ctx.fillStyle = Math.abs(delta) < 0.05 ? T.muted : delta > 0 ? up : down;
        CR.drawNumber(dText, nameX, cy + size * 0.55, 'left');
      }
      ctx.font = CR.font(size, 800, 'sans');
      ctx.fillStyle = T.text;
      CR.drawNumber(shares[i].toFixed(1) + '%', right, cy, 'right');
    }
    ctx.globalAlpha = 1;
    ctx.textBaseline = 'alphabetic';

    ctx.restore();
    if (G.noteH) CR.drawNote(CR.noteAt(t, keyTimeOf), L.m, G.top - 6 * u, L.W - 2 * L.m);
    CR.drawTakeaway(sq.ph.a, sq.cardCy);
  }

  function state(t) {
    const p = TL.pos(t);
    const shares = sharesAtPos(p);
    const cells = allocate(shares);
    const values = {}, share = {}, count = {};
    ser.forEach((s, i) => { values[s.name] = CR.valueAt(s.values, p); share[s.name] = shares[i]; count[s.name] = cells.filter((c) => c === i).length; });
    return { period: D.times[CR.periodIndex(p)], pos: p, values, share, cells: count };
  }

  CR.register({ draw, state, geometry: (t) => { if (!G) layout(CR.ctx); return geometry(t); }, keyTimes: () => D.times.map((_, k) => TL.keyTime(k)) });
})();
