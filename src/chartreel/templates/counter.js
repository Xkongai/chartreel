/* chartreel template: big-number counter + comparison */
(function () {
  'use strict';
  const S = window.CHARTREEL_SPEC, CR = window.CR, T = CR.theme;
  const items = S.data.items, n = items.length;
  const TL = CR.timeline(n + 1); // scene boundaries: n scenes between n+1 marks
  const u = CR.L.u;
  const colors = items.map((it, i) => CR.colorOf(i, it));
  const maxV = Math.max(...items.map((i) => Math.abs(i.value))) || 1;
  const COUNT = 0.62; // share of each scene spent counting; the rest holds the exact value

  // scene k runs from keyTime(k) to keyTime(k+1)
  function sceneAt(t) {
    if (t < TL.keyTime(0)) return { k: 0, f: 0 };
    for (let k = 0; k < n; k++) if (t < TL.keyTime(k + 1)) return { k, f: (t - TL.keyTime(k)) / (TL.keyTime(k + 1) - TL.keyTime(k)) };
    return { k: n - 1, f: 1 };
  }
  function shownValue(k, f) {
    const from = k === 0 ? 0 : items[k - 1].value;
    const e = CR.easeOutExpo(f / COUNT);
    return f >= COUNT ? items[k].value : from + (items[k].value - from) * e;
  }
  const ratioText = (r) => '×' + (r >= 100 ? r.toFixed(0) : r >= 10 ? r.toFixed(1).replace(/\.0$/, '') : r.toFixed(2).replace(/0$/, ''));

  let G = null;
  function layout(ctx) {
    const L = CR.L;
    const top = CR.header();
    const footTop = CR.footer();
    const h = footTop - top;
    // biggest font where every final value fits the width
    let numSize = Math.min((L.shape === 'portrait' ? 210 : 190) * u, h * (L.shape === 'portrait' ? 0.16 : 0.2));
    const maxW = L.W - 2 * L.m;
    for (;;) {
      ctx.font = CR.font(numSize, 800, 'sans');
      const w = Math.max(...items.map((it) => CR.numberWidth(CR.fmt(it.value))), CR.numberWidth(CR.fmt(maxV)));
      if (w <= maxW || numSize < 40 * u) break;
      numSize *= 0.95;
    }
    const portrait = L.shape === 'portrait';
    // stack: label · number · note · comparison rows, centred vertically
    const labelH = (portrait ? 70 : 56) * u;
    const numH = numSize * 1.22;
    const noteH = (portrait ? 90 : 70) * u;
    const slot = Math.min((portrait ? 150 : 112) * u, (h * 0.42) / n);
    const total = labelH + numH + noteH + 50 * u + slot * n;
    let y = top + Math.max(0, (h - total) / 2) * 0.85;
    const labelY = y; y += labelH;
    const numY = y; y += numH;
    const noteY = y; y += noteH + 50 * u;
    G = { top, footTop, h, numSize, maxW, labelY, numY, noteY, barsTop: y, slot, barsBottom: y + slot * n, contentBottom: y + slot * n + 4 * u };
  }

  // outro: if the free space under the rows is too small for the takeaway band, shrink the
  // content toward the top so the card gets its own band above the source line
  function squeezeAt(t) {
    const ph = CR.outroPhase(t, TL);
    const band = CR.takeawayBand();
    const target = Math.min(G.contentBottom, G.footTop - band);
    const bottom = G.contentBottom - (G.contentBottom - target) * ph.e;
    return { ph, bottom, cardCy: G.footTop - band / 2 };
  }
  function geometry(t) {
    const sq = squeezeAt(t);
    const s = CR.clamp((sq.bottom - G.top) / Math.max(1, G.contentBottom - G.top), 0.3, 1);
    const content = [CR.squeezeRect({ name: 'counter', x: CR.L.m, y: G.labelY, w: CR.L.W - 2 * CR.L.m, h: G.contentBottom - G.labelY }, G.top, s)];
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
    CR.squeeze(G.top, G.contentBottom, sq.bottom);
    const { k, f } = sceneAt(t);
    const it = items[k];
    const intro = CR.easeOutCubic(TL.intro(t));
    const sceneIn = CR.smoothstep(0, 0.18, f) * (k === 0 ? intro : 1);
    const v = shownValue(k, Math.max(0, f));
    const c = colors[k];

    // scene label
    ctx.textAlign = 'center';
    ctx.globalAlpha = sceneIn;
    ctx.font = CR.font((L.shape === 'portrait' ? 54 : 44) * u, 700, CR.titleFamily);
    ctx.fillStyle = T.muted;
    ctx.fillText(CR.ellipsize((it.emoji ? it.emoji + ' ' : '') + it.label, G.maxW), L.W / 2, G.labelY + 50 * u);

    // the big number
    ctx.font = CR.font(G.numSize, 800, 'sans');
    ctx.fillStyle = c;
    if (T.barGlow) { ctx.shadowColor = c; ctx.shadowBlur = T.barGlow * 1.6 * u; }
    ctx.globalAlpha = Math.max(sceneIn, k === 0 ? intro : 1);
    CR.drawNumber(CR.fmt(v), L.W / 2, G.numY + G.numSize * 0.9, 'center');
    ctx.shadowBlur = 0;
    // underline that fills while counting
    const lw = Math.min(G.maxW * 0.5, 360 * u);
    ctx.globalAlpha = sceneIn * 0.35; ctx.fillStyle = T.muted;
    ctx.fillRect(L.W / 2 - lw / 2, G.numY + G.numSize * 1.16, lw, 6 * u);
    ctx.globalAlpha = sceneIn; ctx.fillStyle = c;
    ctx.fillRect(L.W / 2 - lw / 2, G.numY + G.numSize * 1.16, lw * CR.clamp(f / COUNT, 0, 1), 6 * u);

    // note
    if (it.note) {
      ctx.globalAlpha = CR.smoothstep(0.3, 0.6, f) * (k === 0 ? intro : 1);
      ctx.font = CR.font((L.shape === 'portrait' ? 40 : 34) * u, 500, 'sans');
      ctx.fillStyle = T.text;
      ctx.fillText(CR.ellipsize(it.note, G.maxW), L.W / 2, G.noteY + 64 * u);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';

    // comparison rows for every item revealed so far
    const slot = G.slot;
    const barH = slot * 0.42;
    const labSize = CR.clamp(slot * 0.25, 18 * u, 36 * u);
    for (let j = 0; j <= k; j++) {
      const y = G.barsTop + j * slot;
      const isCur = j === k;
      const val = isCur ? v : items[j].value;
      const a = isCur ? sceneIn : 1;
      ctx.globalAlpha = a;
      ctx.font = CR.font(labSize, 600, 'sans');
      ctx.fillStyle = T.text;
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(CR.ellipsize(items[j].label, G.maxW * 0.5), L.m, y + labSize);
      ctx.textAlign = 'right';
      ctx.font = CR.font(labSize, 700, 'sans');
      CR.drawNumber(CR.fmt(val), L.W - L.m, y + labSize, 'right');
      if (j > 0 && items[0].value > 0 && (!isCur || f >= COUNT)) {
        const r = items[j].value / items[0].value;
        const nw = CR.numberWidth(CR.fmt(val));
        ctx.font = CR.font(labSize * 0.9, 800, 'sans');
        ctx.fillStyle = colors[j];
        ctx.globalAlpha = a * (isCur ? CR.smoothstep(COUNT, COUNT + 0.12, f) : 1);
        ctx.fillText(ratioText(r), L.W - L.m - nw - 18 * u, y + labSize);
        ctx.globalAlpha = a;
      }
      ctx.textAlign = 'left';
      const by = y + labSize + 12 * u;
      ctx.fillStyle = T.grid;
      CR.roundRect(L.m, by, G.maxW, barH, barH / 2); ctx.fill();
      ctx.fillStyle = colors[j];
      if (T.barGlow) { ctx.shadowColor = colors[j]; ctx.shadowBlur = T.barGlow * u; }
      const w = Math.max(barH, (Math.abs(val) / maxV) * G.maxW);
      CR.roundRect(L.m, by, w, barH, barH / 2); ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;

    ctx.restore();
    CR.drawTakeaway(sq.ph.a, sq.cardCy);
  }

  function state(t) {
    const { k, f } = sceneAt(t);
    const v = shownValue(k, Math.max(0, f));
    return { scene: k, label: items[k].label, value: v, text: CR.fmt(v), exact: f >= COUNT };
  }
  // the time each item's exact value is first on screen
  function keyTimes() {
    return items.map((_, k) => TL.keyTime(k) + COUNT * (TL.keyTime(k + 1) - TL.keyTime(k)));
  }

  CR.register({ draw, state, keyTimes, geometry: (t) => { if (!G) layout(CR.ctx); return geometry(t); } });
})();
