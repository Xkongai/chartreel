/* chartreel runtime — shared by every template.
 *
 * Contract (used by the Python renderer and by tests):
 *   window.chartreel.ready          Promise that resolves once fonts are loaded
 *   window.chartreel.renderFrame(t) draws the frame at time t (seconds). Pure:
 *                                   the picture depends only on t and the spec.
 *   window.chartreel.state(t)       the numbers that frame t shows, for checks
 *   window.chartreel.keyTimes()     times at which each source row is on screen
 * No wall-clock, no Math.random(), no requestAnimationFrame in renderFrame.
 */
(function () {
  'use strict';
  const SPEC = window.CHARTREEL_SPEC;
  const CR = (window.CR = {});

  // ---------------------------------------------------------------- themes
  CR.THEMES = {
    dark: {
      bg: '#0A0E17', glow: 'rgba(79,140,255,0.16)', glow2: 'rgba(255,90,140,0.08)',
      text: '#F3F6FB', muted: '#8C97AB', faint: 'rgba(255,255,255,0.055)',
      grid: 'rgba(255,255,255,0.075)', accent: '#5B9BFF', card: 'rgba(16,22,36,0.94)',
      cardStroke: 'rgba(255,255,255,0.14)', periodAlpha: 0.16, family: 'sans',
      barGradient: true, barGlow: 0, onBar: '#0A0E17',
      palette: ['#5B9BFF', '#FF6B6B', '#FFC145', '#2ED3A3', '#B48CFF', '#FF8FCB', '#3FD3FF',
        '#FF9F45', '#8EDB6B', '#E8ECF3', '#F05BA8', '#62E6D2', '#C9A26B', '#7F8CFF', '#FFD86B', '#A0A8B8'],
    },
    paper: {
      bg: '#F4EEE2', glow: null, glow2: null,
      text: '#1E1A16', muted: '#6E655A', faint: 'rgba(30,26,22,0.05)',
      grid: 'rgba(30,26,22,0.12)', accent: '#B8322A', card: 'rgba(250,246,238,0.96)',
      cardStroke: 'rgba(30,26,22,0.25)', periodAlpha: 0.12, family: 'serif',
      barGradient: false, barGlow: 0, onBar: '#FAF6EE', rule: true,
      palette: ['#B8322A', '#1F4E79', '#D49A1E', '#2E7D5B', '#6F4A8E', '#D9692C', '#3E8FA8',
        '#8C6D46', '#A23E6B', '#55606E', '#7A9A3A', '#C25B4A', '#2F6F9F', '#B3872E', '#4C7D72', '#8A8178'],
    },
    neon: {
      bg: '#07020F', glow: 'rgba(180,40,255,0.20)', glow2: 'rgba(0,240,255,0.10)',
      text: '#F6EEFF', muted: '#A58FC4', faint: 'rgba(255,255,255,0.05)',
      grid: 'rgba(200,150,255,0.10)', accent: '#00F0FF', card: 'rgba(14,6,28,0.94)',
      cardStroke: 'rgba(0,240,255,0.45)', periodAlpha: 0.20, family: 'sans',
      barGradient: true, barGlow: 22, onBar: '#07020F',
      palette: ['#00F0FF', '#FF2E97', '#FFE600', '#39FF88', '#B026FF', '#FF7A00', '#4D7CFF',
        '#FF4F4F', '#C6FF00', '#FF9DF5', '#00FFC6', '#FFC2A8', '#8F7BFF', '#FFF59D', '#7DF9FF', '#E0B3FF'],
    },
  };
  const THEME = CR.THEMES[SPEC.theme] || CR.THEMES.dark;
  CR.theme = THEME;

  // ----------------------------------------------------------------- fonts
  const SANS = '"Inter", "Helvetica Neue", "Segoe UI", Arial, "Noto Sans CJK SC", "Source Han Sans SC", ' +
    '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK JP", "Noto Sans CJK KR", ' +
    '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
  const SERIF = '"Noto Serif", Georgia, "Times New Roman", "Noto Serif CJK SC", "Source Han Serif SC", ' +
    '"Songti SC", SimSun, "Noto Serif CJK JP", "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", serif';
  CR.font = function (size, weight, family) {
    const fam = (family || 'sans') === 'serif' ? SERIF : SANS;
    return (weight || 400) + ' ' + Math.max(1, Math.round(size * 10) / 10) + 'px ' + fam;
  };
  CR.titleFamily = THEME.family;

  // ------------------------------------------------------------ math utils
  const clamp = (CR.clamp = (x, a, b) => (x < a ? a : x > b ? b : x));
  const lerp = (CR.lerp = (a, b, f) => a + (b - a) * f);
  CR.easeOutCubic = (x) => 1 - Math.pow(1 - clamp(x, 0, 1), 3);
  CR.easeInOutCubic = (x) => { x = clamp(x, 0, 1); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  CR.easeOutExpo = (x) => { x = clamp(x, 0, 1); return x >= 1 ? 1 : 1 - Math.pow(2, -10 * x); };
  CR.smoothstep = (a, b, x) => { const f = clamp((x - a) / (b - a), 0, 1); return f * f * (3 - 2 * f); };

  // ------------------------------------------------------------- timeline
  // intro: title visible, chart grows in.  main: keyframes evenly spaced.
  // outro: last row held, takeaway card fades in.
  CR.timeline = function (nKeys) {
    const D = SPEC.duration;
    const I = SPEC.intro != null ? SPEC.intro : Math.min(1.0, 0.1 * D);
    const O = SPEC.outro != null ? SPEC.outro : Math.min(2.2, 0.2 * D);
    const M = Math.max(0.001, D - I - O);
    return {
      D, I, O, M, n: nKeys,
      keyTime: (k) => (nKeys > 1 ? I + (M * k) / (nKeys - 1) : I),
      pos: (t) => (nKeys > 1 ? clamp(((t - I) / M) * (nKeys - 1), 0, nKeys - 1) : 0),
      intro: (t) => clamp(t / I, 0, 1),
      outro: (t) => clamp((t - (I + M)) / Math.max(0.001, O), 0, 1),
    };
  };

  // value of one series at fractional key position p (linear between rows)
  CR.valueAt = function (values, p) {
    const k = Math.floor(p), f = p - k;
    const a = values[k];
    if (a == null) return null;
    if (f <= 1e-9 || k + 1 >= values.length) return a;
    const b = values[k + 1];
    return b == null ? a : a + (b - a) * f;
  };
  CR.periodIndex = (p) => Math.floor(p + 1e-9);

  // ------------------------------------------------------- number formats
  function group(intStr) { return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function fixed(x, d, noGroup) {
    const s = Math.abs(x).toFixed(d);
    const [i, f] = s.split('.');
    return (x < 0 && Number(s) !== 0 ? '-' : '') + (noGroup ? i : group(i)) + (f ? '.' + f : '');
  }
  function autoDec(x) { const a = Math.abs(x); return a < 10 ? 2 : a < 100 ? 1 : 0; }
  CR.formatNumber = function (v, fmt) {
    fmt = fmt || {};
    if (v == null || !isFinite(v)) return '–';
    const pre = fmt.prefix || '', suf = fmt.suffix || '';
    const style = fmt.style || 'compact';
    const dec = fmt.decimals;
    let body;
    if (style === 'full') {
      body = fixed(v, dec != null ? dec : Math.abs(v) >= 100 || Number.isInteger(v) ? 0 : 2);
    } else if (style === 'percent') {
      body = fixed(v, dec != null ? dec : 1) + '%';
    } else if ((fmt.locale || 'en') === 'zh') {
      const a = Math.abs(v);
      const units = [[1e12, '万亿'], [1e8, '亿'], [1e4, '万']];
      let u = null;
      for (const [k, name] of units) if (a >= k) { u = [k, name]; break; }
      if (!u) body = fixed(v, dec != null ? dec : Number.isInteger(v) ? 0 : 1);
      else { const x = v / u[0]; body = fixed(x, dec != null ? dec : autoDec(x), true) + u[1]; }
    } else {
      const a = Math.abs(v);
      const units = [[1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']];
      let u = null;
      for (const [k, name] of units) if (a >= k) { u = [k, name]; break; }
      if (!u) body = fixed(v, dec != null ? dec : Number.isInteger(v) ? 0 : 1);
      else { const x = v / u[0]; body = fixed(x, dec != null ? dec : autoDec(x)) + u[1]; }
    }
    if (fmt.trim) body = body.replace(/(\.\d*?)0+(?=\D*$)/, '$1').replace(/\.(?=\D*$)/, '');
    return pre + body + suf;
  };
  CR.fmt = (v) => CR.formatNumber(v, SPEC.format);
  // axis labels: same unit system, fewer decimals
  CR.fmtAxis = (v) => CR.formatNumber(v, Object.assign({}, SPEC.format, { decimals: v === 0 ? 0 : null, trim: true }));

  // --------------------------------------------------------------- canvas
  const canvas = document.getElementById('c');
  canvas.width = SPEC.width; canvas.height = SPEC.height;
  const ctx = canvas.getContext('2d');
  CR.ctx = ctx;

  const W = SPEC.width, H = SPEC.height;
  const u = Math.min(W, H) / 1080;
  const shape = H / W > 1.3 ? 'portrait' : W / H > 1.3 ? 'landscape' : 'square';
  CR.L = {
    W, H, u, shape,
    m: (shape === 'landscape' ? 72 : 64) * u,
    // keep clear of the platform UI (Douyin/Shorts captions, status bar)
    top: shape === 'portrait' ? H * 0.075 : 56 * u,
    bottom: shape === 'portrait' ? H * 0.12 : 50 * u,
  };

  // tabular figures: every digit gets the same advance, so counters don't jitter
  CR.numberWidth = function (text) {
    const dw = ctx.measureText('0').width;
    let w = 0;
    for (const ch of text) w += ch >= '0' && ch <= '9' ? dw : ctx.measureText(ch).width;
    return w;
  };
  CR.drawNumber = function (text, x, y, align) {
    const dw = ctx.measureText('0').width;
    const total = CR.numberWidth(text);
    const saved = ctx.textAlign;
    let cx = align === 'right' ? x - total : align === 'center' ? x - total / 2 : x;
    ctx.textAlign = 'left';
    for (const ch of text) {
      if (ch >= '0' && ch <= '9') { const gw = ctx.measureText(ch).width; ctx.fillText(ch, cx + (dw - gw) / 2, y); cx += dw; }
      else { ctx.fillText(ch, cx, y); cx += ctx.measureText(ch).width; }
    }
    ctx.textAlign = saved;
    return total;
  };

  // CJK-aware wrapping: break between words for Latin, between characters for CJK
  const CJK = /[\u1100-\u11ff\u2e80-\u9fff\uac00-\ud7af\uf900-\ufaff\uff00-\uffef]/;
  CR.wrap = function (text, maxW) {
    const tokens = [];
    let buf = '';
    const NO_START = /[，。：；、！？）》」』,.:;!?)\]%]/;
    for (const ch of String(text)) {
      if (NO_START.test(ch) && !buf && tokens.length) { tokens[tokens.length - 1] += ch; continue; }
      if (CJK.test(ch)) { if (buf) tokens.push(buf); buf = ''; tokens.push(ch); }
      else if (ch === ' ') { buf += ch; tokens.push(buf); buf = ''; }
      else buf += ch;
    }
    if (buf) tokens.push(buf);
    const lines = [];
    let line = '';
    for (const tok of tokens) {
      const next = line + tok;
      if (line && ctx.measureText(next.trimEnd()).width > maxW) { lines.push(line.trimEnd()); line = tok.trimStart(); }
      else line = next;
    }
    if (line.trim()) lines.push(line.trimEnd());
    return lines;
  };
  CR.ellipsize = function (text, maxW) {
    if (ctx.measureText(text).width <= maxW) return text;
    const chars = Array.from(text);
    while (chars.length > 1 && ctx.measureText(chars.join('') + '…').width > maxW) chars.pop();
    return chars.join('') + '…';
  };
  // shrink font until the text fits on maxLines lines
  CR.fitLines = function (text, maxW, size, weight, family, maxLines, minScale) {
    let s = size;
    const floor = size * (minScale || 0.6);
    for (;;) {
      ctx.font = CR.font(s, weight, family);
      const lines = CR.wrap(text, maxW);
      if (lines.length <= maxLines || s <= floor) {
        const truncated = lines.length > maxLines;
        if (truncated) { lines.length = maxLines; lines[maxLines - 1] = CR.ellipsize(lines[maxLines - 1] + '…', maxW); }
        return { lines, size: s, truncated };
      }
      s *= 0.94;
    }
  };

  CR.roundRect = function (x, y, w, h, r) {
    r = Math.min(r, h / 2, w / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };
  // bar with square left edge (sits on the axis) and rounded right end
  CR.barPath = function (x, y, w, h, r) {
    r = Math.max(0, Math.min(r, h / 2, w));
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x, y + h);
    ctx.closePath();
  };
  CR.hexA = function (hex, a) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  };
  CR.mix = function (hexA, hexB, f) {
    const p = (h) => { h = h.replace('#', ''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
    const a = p(hexA), b = p(hexB);
    const c = a.map((x, i) => Math.round(x + (b[i] - x) * f));
    return '#' + c.map((x) => x.toString(16).padStart(2, '0')).join('');
  };
  CR.colorOf = function (i, series) {
    return (series && series.color) || THEME.palette[i % THEME.palette.length];
  };

  // nice tick steps with cross-fading density: the "fine" set fades out as the
  // range grows, so ticks never pop.
  CR.ticks = function (maxV, target) {
    const raw = Math.max(maxV, 1e-12) / (target || 4);
    const steps = [];
    const e = Math.floor(Math.log10(raw));
    for (let k = e - 1; k <= e + 1; k++) for (const m of [1, 2, 5]) steps.push(m * Math.pow(10, k));
    let hi = steps.find((s) => s >= raw);
    const lo = steps[steps.indexOf(hi) - 1];
    const f = clamp((Math.log(raw) - Math.log(lo)) / (Math.log(hi) - Math.log(lo)), 0, 1);
    const out = [];
    for (let v = 0; v <= maxV * 1.0001; v += lo) {
      const onHi = Math.abs(v / hi - Math.round(v / hi)) < 1e-6;
      out.push({ v, a: onHi ? 1 : 1 - f });
    }
    return out;
  };

  // ------------------------------------------------------ shared drawing
  CR.background = function () {
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = THEME.bg;
    ctx.fillRect(0, 0, W, H);
    if (THEME.glow) {
      let g = ctx.createRadialGradient(W * 0.85, H * 0.05, 0, W * 0.85, H * 0.05, Math.max(W, H) * 0.6);
      g.addColorStop(0, THEME.glow); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      g = ctx.createRadialGradient(W * 0.05, H * 0.95, 0, W * 0.05, H * 0.95, Math.max(W, H) * 0.5);
      g.addColorStop(0, THEME.glow2); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
  };

  // title + subtitle; returns the y where the chart may start
  let headerCache = null;
  CR.header = function () {
    const L = CR.L;
    const maxW = W - 2 * L.m;
    if (!headerCache) {
      const tsize = (L.shape === 'portrait' ? 78 : L.shape === 'landscape' ? 60 : 62) * u;
      let title = { lines: [], size: tsize };
      if (SPEC.title) {
        title = CR.fitLines(SPEC.title, maxW, tsize, 800, CR.titleFamily, 1, 0.8); // one line if it stays big
        if (title.truncated) title = CR.fitLines(SPEC.title, maxW, tsize, 800, CR.titleFamily, 2, 0.62);
      }
      const ssize = (L.shape === 'portrait' ? 36 : 30) * u;
      ctx.font = CR.font(ssize, 400, 'sans');
      const sub = SPEC.subtitle ? CR.wrap(SPEC.subtitle, maxW).slice(0, 2) : [];
      headerCache = { title, ssize, sub };
    }
    const { title, ssize, sub } = headerCache;
    let y = L.top;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    ctx.fillStyle = THEME.text;
    ctx.font = CR.font(title.size, 800, CR.titleFamily);
    for (const line of title.lines) { y += title.size * 1.08; ctx.fillText(line, L.m, y); }
    if (title.lines.length) y += title.size * 0.18;
    ctx.fillStyle = THEME.muted;
    ctx.font = CR.font(ssize, 400, 'sans');
    for (const line of sub) { y += ssize * 1.3; ctx.fillText(line, L.m, y); }
    if (THEME.rule) {
      y += 22 * u;
      ctx.fillStyle = THEME.text;
      ctx.fillRect(L.m, y, maxW, 3 * u);
      ctx.fillRect(L.m, y + 7 * u, maxW, 1 * u);
      y += 8 * u;
    } else if (title.lines.length) {
      y += 18 * u;
      ctx.fillStyle = THEME.accent;
      ctx.fillRect(L.m, y, 84 * u, 6 * u);
      y += 6 * u;
    }
    return y + (L.shape === 'portrait' ? 44 : 30) * u;
  };

  // footer: source line (left) and a small brand mark (right); returns its top y
  CR.footer = function () {
    const L = CR.L;
    const size = (L.shape === 'portrait' ? 26 : 22) * u;
    const y = H - L.bottom;
    ctx.font = CR.font(size, 400, 'sans');
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = THEME.muted;
    ctx.textAlign = 'left';
    const brandW = SPEC.brand ? (ctx.font = CR.font(size, 700, 'sans'), ctx.measureText('chartreel').width + 24 * u) : 0;
    if (SPEC.source) {
      const label = (SPEC.sourceLabel || 'Source') + ': ' + SPEC.source;
      const room = W - 2 * L.m - brandW;
      let fs = size;
      ctx.font = CR.font(fs, 400, 'sans');
      while (fs > size * 0.72 && ctx.measureText(label).width > room) { fs *= 0.95; ctx.font = CR.font(fs, 400, 'sans'); }
      ctx.fillText(CR.ellipsize(label, room), L.m, y);
    }
    ctx.font = CR.font(size, 400, 'sans');
    if (SPEC.brand) {
      ctx.textAlign = 'right';
      ctx.font = CR.font(size, 700, 'sans');
      ctx.globalAlpha = 0.75;
      ctx.fillText('chartreel', W - L.m, y);
      ctx.globalAlpha = 1;
      ctx.textAlign = 'left';
    }
    return y - size * 1.9;
  };

  // event notes ("2008: Financial crisis") shown as a chip for ~2.4 s
  CR.noteAt = function (t, keyTimeOf) {
    const notes = SPEC.notes || [];
    let best = null;
    for (const n of notes) {
      const t0 = keyTimeOf(n.at);
      if (t0 == null) continue;
      const age = t - t0;
      const span = n.hold || CR.noteHold;
      if (age >= 0 && age <= span) {
        const a = Math.min(CR.smoothstep(0, 0.25, age), 1 - CR.smoothstep(span - 0.35, span, age));
        if (!best || t0 > best.t0) best = { text: (n.showAt === false ? '' : n.at + ' · ') + n.text, at: n.at, a, t0 };
      }
    }
    return best;
  };
  CR.drawNote = function (note, x, y, maxW) {
    if (!note || note.a <= 0.001) return;
    const L = CR.L;
    const size = (L.shape === 'portrait' ? 32 : 26) * u;
    ctx.save();
    ctx.globalAlpha = note.a;
    ctx.font = CR.font(size, 600, 'sans');
    const text = CR.ellipsize(note.text, maxW - size * 2.4);
    const w = ctx.measureText(text).width + size * 2.2;
    const h = size * 1.9;
    const dy = (1 - note.a) * 10 * u;
    CR.roundRect(x, y + dy, w, h, h / 2);
    ctx.fillStyle = THEME.card; ctx.fill();
    ctx.strokeStyle = THEME.cardStroke; ctx.lineWidth = 1.5 * u; ctx.stroke();
    ctx.fillStyle = THEME.accent;
    ctx.beginPath(); ctx.arc(x + size * 0.95, y + dy + h / 2, size * 0.24, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = THEME.text; ctx.textBaseline = 'middle';
    ctx.fillText(text, x + size * 1.55, y + dy + h / 2 + size * 0.04);
    ctx.restore();
    ctx.textBaseline = 'alphabetic';
  };


  CR.noteHold = 2.4; // templates shorten this for fast timelines

  // ------------------------------------------------------------ takeaway
  // The closing card lives in its own band: during the outro each template shrinks its
  // chart by CR.takeawayBand() pixels and draws the card in the freed space, so the card
  // never covers data.
  let takeawayCache = null;
  CR.takeawayFit = function () {
    if (!SPEC.takeaway) return null;
    if (takeawayCache) return takeawayCache;
    const L = CR.L;
    const maxW = W - 2 * L.m;
    const size = (L.shape === 'portrait' ? 50 : 40) * u;
    let fit = CR.fitLines(SPEC.takeaway, maxW - size * 1.6, size, 800, CR.titleFamily, 1, 0.75);
    if (fit.truncated) fit = CR.fitLines(SPEC.takeaway, maxW - size * 1.6, size, 800, CR.titleFamily, 2, 0.6);
    const lh = fit.size * 1.25;
    const h = lh * fit.lines.length + fit.size * 1.1;
    ctx.font = CR.font(fit.size, 800, CR.titleFamily);
    const w = Math.min(maxW, Math.max(...fit.lines.map((l) => ctx.measureText(l).width)) + fit.size * 1.6);
    takeawayCache = { lines: fit.lines, size: fit.size, lh, w, h };
    return takeawayCache;
  };
  CR.takeawayGap = () => (16 + (THEME.barGlow || 0) * 0.6) * u;
  CR.takeawayBand = function () {
    const f = CR.takeawayFit();
    return f ? f.h + 2 * CR.takeawayGap() : 0;
  };
  CR.takeawayRect = function (cy) {
    const f = CR.takeawayFit();
    if (!f) return null;
    return { x: (W - f.w) / 2, y: cy - f.h / 2, w: f.w, h: f.h };
  };
  // e: 0→1 while the chart makes room; a: card opacity, starts once the room is there
  CR.outroPhase = function (t, TL) {
    if (!SPEC.takeaway) return { e: 0, a: 0 };
    const o = t - (TL.I + TL.M);
    const d = Math.max(0.05, Math.min(0.45, 0.3 * TL.O));
    return { e: CR.easeInOutCubic(o / d), a: CR.smoothstep(d, d + Math.min(0.45, 0.3 * TL.O), o) };
  };
  CR.drawTakeaway = function (a, cy) {
    const f = CR.takeawayFit();
    if (!f || a <= 0.001) return null;
    const r = CR.takeawayRect(cy);
    const { x, y, w, h } = r;
    ctx.save();
    ctx.globalAlpha = CR.easeOutCubic(a);
    if (THEME.barGlow) { ctx.shadowColor = THEME.accent; ctx.shadowBlur = THEME.barGlow * 0.6 * u; }
    CR.roundRect(x, y, w, h, 20 * u);
    ctx.fillStyle = THEME.card; ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = THEME.cardStroke; ctx.lineWidth = 2 * u; ctx.stroke();
    ctx.fillStyle = THEME.accent;
    ctx.fillRect(x, y + h * 0.2, 6 * u, h * 0.6);
    ctx.fillStyle = THEME.text;
    ctx.font = CR.font(f.size, 800, CR.titleFamily);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let ly = y + h / 2 - (f.lines.length - 1) * f.lh / 2;
    for (const line of f.lines) { ctx.fillText(line, x + w / 2, ly + f.size * 0.04); ly += f.lh; }
    ctx.restore();
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    return r;
  };
  // scale a block of content toward its top centre so its bottom ends at newBottom
  CR.squeeze = function (top, bottom, newBottom) {
    const s = CR.clamp((newBottom - top) / Math.max(1, bottom - top), 0.3, 1);
    ctx.translate(W / 2, top); ctx.scale(s, s); ctx.translate(-W / 2, -top);
    return s;
  };
  CR.squeezeRect = function (r, top, s) {
    return { x: W / 2 + (r.x - W / 2) * s, y: top + (r.y - top) * s, w: r.w * s, h: r.h * s };
  };

  // big faded period label (e.g. "1998")
  CR.drawPeriod = function (text, x, y, size, align) {
    ctx.save();
    ctx.font = CR.font(size, 800, 'sans');
    ctx.fillStyle = THEME.text;
    ctx.globalAlpha = THEME.periodAlpha;
    ctx.textBaseline = 'alphabetic';
    CR.drawNumber(String(text), x, y, align || 'right');
    ctx.restore();
  };

  // --------------------------------------------------------- registration
  let impl = null;
  CR.register = function (template) { impl = template; };

  const ready = (async () => {
    const samples = 'Aa0123456789中文日本語한국어';
    const loads = [];
    for (const w of [400, 600, 700, 800]) {
      loads.push(document.fonts.load(CR.font(40, w, 'sans'), samples));
      loads.push(document.fonts.load(CR.font(40, w, 'serif'), samples));
    }
    await Promise.all(loads.map((p) => p.catch(() => null)));
    await document.fonts.ready;
    if (impl && impl.init) impl.init();
    return true;
  })();

  window.chartreel = {
    spec: SPEC,
    ready,
    duration: SPEC.duration,
    fps: SPEC.fps,
    formatNumber: CR.formatNumber,
    renderFrame(t) {
      t = clamp(+t || 0, 0, SPEC.duration);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      impl.draw(ctx, t);
      return true;
    },
    state: (t) => impl.state(clamp(+t || 0, 0, SPEC.duration)),
    keyTimes: () => impl.keyTimes(),
    geometry: (t) => (impl.geometry ? impl.geometry(clamp(+t || 0, 0, SPEC.duration)) : null),
  };

  // ------------------------------------------- interactive preview player
  if (!window.__CHARTREEL_RENDER__) {
    window.addEventListener('DOMContentLoaded', () => {
      document.body.classList.add('preview');
      const bar = document.getElementById('player');
      const range = document.getElementById('scrub');
      const btn = document.getElementById('play');
      const label = document.getElementById('time');
      range.max = String(SPEC.duration);
      let playing = true, t0 = null, base = 0;
      const show = (t) => { window.chartreel.renderFrame(t); range.value = String(t); label.textContent = t.toFixed(2) + ' / ' + SPEC.duration.toFixed(2) + ' s'; };
      const loop = (now) => {
        if (playing) {
          if (t0 == null) t0 = now;
          let t = base + (now - t0) / 1000;
          if (t > SPEC.duration) { t0 = now; base = 0; t = 0; }
          show(t);
        }
        requestAnimationFrame(loop);
      };
      btn.onclick = () => { playing = !playing; btn.textContent = playing ? 'Pause' : 'Play'; base = +range.value; t0 = null; };
      range.oninput = () => { playing = false; btn.textContent = 'Play'; show(+range.value); };
      bar.hidden = false;
      ready.then(() => requestAnimationFrame(loop));
    });
  }
})();
