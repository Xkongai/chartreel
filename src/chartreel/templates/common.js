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
    cinema: {
      bg: '#05070B', bgGrad: ['#0C222B', '#05070B'], glow: 'rgba(245,194,107,0.12)', glow2: 'rgba(40,160,170,0.12)',
      text: '#F4EFE6', muted: '#98A2A6', faint: 'rgba(255,255,255,0.05)',
      grid: 'rgba(255,255,255,0.07)', accent: '#F5C26B', card: 'rgba(8,14,18,0.92)',
      cardStroke: 'rgba(245,194,107,0.5)', periodAlpha: 0.14, family: 'sans',
      barGradient: true, barGlow: 10, onBar: '#05070B', blobs: ['#F5C26B', '#1F8A94', '#B5523B'],
      palette: ['#F5C26B', '#E8684A', '#4FB3BF', '#9BC46B', '#C78BD6', '#F28C9E', '#6E9DE0',
        '#E0A458', '#7FD1AE', '#D9D4C7', '#B5838D', '#56C1E8', '#C9B26B', '#8E9AF0', '#F2D49B', '#A0A8B0'],
    },
    broadcast: {
      bg: '#081129', bgGrad: ['#12245A', '#060C1E'], glow: 'rgba(60,120,255,0.12)', glow2: null,
      text: '#FFFFFF', muted: '#A9B6D3', faint: 'rgba(255,255,255,0.05)',
      grid: 'rgba(255,255,255,0.09)', accent: '#E3262F', card: 'rgba(8,17,41,0.96)',
      cardStroke: 'rgba(255,255,255,0.3)', periodAlpha: 0.12, family: 'sans',
      barGradient: false, barGlow: 0, onBar: '#FFFFFF', noteStyle: 'strap', footerStyle: 'strap', rankBox: true,
      palette: ['#2F7BFF', '#E3262F', '#F2B705', '#1FB57A', '#8A6CFF', '#FF7A45', '#22B8D9',
        '#E85D9C', '#9CCB3B', '#D9DEE8', '#C2410C', '#14B8A6', '#A3A3FF', '#FCD34D', '#64748B', '#F472B6'],
    },
    retro: {
      bg: '#140B24', bgGrad: ['#2B1446', '#0E0819'], glow: 'rgba(255,94,135,0.18)', glow2: 'rgba(255,190,90,0.12)',
      text: '#FFE9D6', muted: '#B79BC9', faint: 'rgba(255,255,255,0.05)',
      grid: 'rgba(255,200,230,0.09)', accent: '#FF5E87', card: 'rgba(28,14,46,0.94)',
      cardStroke: 'rgba(255,94,135,0.55)', periodAlpha: 0.16, family: 'mono', bodyFamily: 'mono', chroma: true,
      barGradient: true, barGlow: 8, onBar: '#140B24',
      palette: ['#FF5E87', '#FFB347', '#5EE7FF', '#B388FF', '#7CFFB2', '#FF8A5B', '#FFD86B',
        '#4D9DFF', '#FF6EC7', '#E8D8FF', '#C3FF5E', '#FF9E9E', '#9EB7FF', '#FFE29A', '#69F0C8', '#D1B3FF'],
    },
    glass: {
      bg: '#0B0820', glow: null, glow2: null, blobs: ['#7A5CFF', '#FF5CA8', '#2EC5FF', '#FFB35C'],
      text: '#FFFFFF', muted: 'rgba(255,255,255,0.72)', faint: 'rgba(255,255,255,0.06)',
      grid: 'rgba(255,255,255,0.12)', accent: '#7CF3FF', card: 'rgba(255,255,255,0.14)',
      cardStroke: 'rgba(255,255,255,0.4)', periodAlpha: 0.18, family: 'sans', glass: true,
      barGradient: true, barGlow: 0, onBar: '#0B0820',
      palette: ['#7CF3FF', '#FF8AD8', '#FFD27C', '#9DFFB0', '#B9A2FF', '#FF9E7C', '#7CB8FF',
        '#FFF27C', '#FF7C9E', '#E6E6FF', '#7CFFE4', '#D2FF7C', '#FFB8E6', '#A2D2FF', '#FFC6A2', '#C6C6D2'],
    },
    bold: {
      bg: '#0A0A0A', glow: 'rgba(255,230,0,0.07)', glow2: 'rgba(255,59,59,0.06)',
      text: '#FFFFFF', muted: '#BDBDBD', faint: 'rgba(255,255,255,0.05)',
      grid: 'rgba(255,255,255,0.09)', accent: '#FFE600', card: '#FFE600', cardText: '#0A0A0A',
      cardStroke: '#FFE600', periodAlpha: 0.2, family: 'sans', titleBox: true, weight: 900, rankBox: true,
      barGradient: false, barGlow: 0, onBar: '#0A0A0A',
      palette: ['#FFE600', '#FF3B3B', '#00D1FF', '#00E676', '#FF6D00', '#D500F9', '#2979FF',
        '#FF4081', '#C6FF00', '#FFFFFF', '#18FFFF', '#FFAB00', '#7C4DFF', '#76FF03', '#F50057', '#B0BEC5'],
    },
  };
  const FX = (CR.fx = SPEC.fx || {});
  const THEME = CR.THEMES[SPEC.theme] || CR.THEMES.dark;
  CR.theme = THEME;

  // ----------------------------------------------------------------- fonts
  const SANS = '"Inter", "Helvetica Neue", "Segoe UI", Arial, "Noto Sans CJK SC", "Source Han Sans SC", ' +
    '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK JP", "Noto Sans CJK KR", ' +
    '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
  const SERIF = '"Noto Serif", Georgia, "Times New Roman", "Noto Serif CJK SC", "Source Han Serif SC", ' +
    '"Songti SC", SimSun, "Noto Serif CJK JP", "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", serif';
  const MONO = '"JetBrains Mono", "DejaVu Sans Mono", Menlo, Consolas, "Noto Sans Mono CJK SC", "Noto Sans CJK SC", ' +
    '"PingFang SC", "Microsoft YaHei", "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", monospace';
  CR.font = function (size, weight, family) {
    family = family || 'sans';
    const fam = family === 'serif' ? SERIF : family === 'mono' ? MONO : SANS;
    return (weight || 400) + ' ' + Math.max(1, Math.round(size * 10) / 10) + 'px ' + fam;
  };
  CR.titleFamily = THEME.family;
  CR.titleWeight = THEME.weight || 800;

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
  // a hook card (style presets) holds the first ~1.5 s; data starts moving after it
  CR.hookDur = SPEC.hook ? clamp(0.11 * SPEC.duration, 1.1, 1.8) : 0;
  CR.timeline = function (nKeys) {
    const D = SPEC.duration;
    let I = SPEC.intro != null ? SPEC.intro : Math.min(1.0, 0.1 * D);
    if (CR.hookDur) I = Math.max(I, CR.hookDur + (SPEC.intro != null ? 0.15 : 0.35));
    const O = SPEC.outro != null ? SPEC.outro : Math.min(2.2, 0.2 * D);
    const M = Math.max(0.001, D - I - O);
    return (CR.TL = {
      D, I, O, M, n: nKeys,
      keyTime: (k) => (nKeys > 1 ? I + (M * k) / (nKeys - 1) : I),
      pos: (t) => (nKeys > 1 ? clamp(((t - I) / M) * (nKeys - 1), 0, nKeys - 1) : 0),
      intro: (t) => clamp(t / I, 0, 1),
      outro: (t) => clamp((t - (I + M)) / Math.max(0.001, O), 0, 1),
    });
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
    m: (shape === 'landscape' ? 72 : SPEC.safe && shape === 'portrait' ? 96 : 64) * u,
    // keep clear of the platform UI (Douyin/Shorts captions, side buttons, status bar)
    top: shape === 'portrait' ? H * (SPEC.safe ? 0.085 : 0.075) : 56 * u,
    bottom: shape === 'portrait' ? H * (SPEC.safe ? 0.15 : 0.12) : 50 * u,
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
  CR.t = 0; // time of the frame being drawn (set by renderFrame)
  CR.background = function () {
    const t = CR.t;
    ctx.save();
    ctx.globalAlpha = 1;
    if (THEME.bgGrad) {
      const g = ctx.createLinearGradient(0, 0, W * 0.3, H);
      g.addColorStop(0, THEME.bgGrad[0]); g.addColorStop(1, THEME.bgGrad[1]);
      ctx.fillStyle = g;
    } else ctx.fillStyle = THEME.bg;
    ctx.fillRect(0, 0, W, H);
    if (FX.bg) {
      // slow drifting colour blobs; a pure function of t
      const cols = THEME.blobs || [THEME.accent, THEME.palette[1], THEME.palette[2]];
      const R = Math.max(W, H);
      cols.forEach((c, k) => {
        const ph = k * 2.1;
        const x = W * (0.5 + 0.42 * Math.sin(t * 0.21 + ph));
        const y = H * (0.5 + 0.40 * Math.cos(t * 0.17 + ph * 1.3));
        const g = ctx.createRadialGradient(x, y, 0, x, y, R * (0.42 + 0.06 * Math.sin(t * 0.3 + k)));
        g.addColorStop(0, CR.hexA(c, THEME.glass ? 0.42 : 0.16)); g.addColorStop(1, CR.hexA(c, 0));
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      });
    } else if (THEME.glow) {
      let g = ctx.createRadialGradient(W * 0.85, H * 0.05, 0, W * 0.85, H * 0.05, Math.max(W, H) * 0.6);
      g.addColorStop(0, THEME.glow); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      if (THEME.glow2) {
        g = ctx.createRadialGradient(W * 0.05, H * 0.95, 0, W * 0.05, H * 0.95, Math.max(W, H) * 0.5);
        g.addColorStop(0, THEME.glow2); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
    }
    ctx.restore();
  };

  // text with a red/cyan split (retro theme)
  CR.fillTextFx = function (text, x, y) {
    if (THEME.chroma) {
      const fs = ctx.fillStyle, ga = ctx.globalAlpha;
      ctx.globalAlpha = ga * 0.7;
      ctx.fillStyle = '#FF2A6D'; ctx.fillText(text, x - 2.5 * u, y);
      ctx.fillStyle = '#05D9E8'; ctx.fillText(text, x + 2.5 * u, y);
      ctx.globalAlpha = ga; ctx.fillStyle = fs;
    }
    ctx.fillText(text, x, y);
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
        const tw = THEME.titleBox ? maxW - 40 * u : maxW;
        title = CR.fitLines(SPEC.title, tw, tsize, CR.titleWeight, CR.titleFamily, 1, 0.8); // one line if it stays big
        if (title.truncated) title = CR.fitLines(SPEC.title, tw, tsize, CR.titleWeight, CR.titleFamily, 2, 0.62);
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
    ctx.font = CR.font(title.size, CR.titleWeight, CR.titleFamily);
    for (const line of title.lines) {
      y += title.size * (THEME.titleBox ? 1.22 : 1.08);
      if (THEME.titleBox) {
        // Douyin-style caption boxes: black text on a loud colour block
        const w = ctx.measureText(line).width;
        ctx.fillStyle = THEME.accent;
        ctx.fillRect(L.m - 2 * u, y - title.size * 0.92, w + 28 * u, title.size * 1.14);
        ctx.fillStyle = THEME.cardText || '#000';
        ctx.fillText(line, L.m + 12 * u, y);
        ctx.fillStyle = THEME.text;
      } else CR.fillTextFx(line, L.m, y);
    }
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
    if (SPEC.source && THEME.footerStyle === 'strap') {
      // TV "source bug": accent tag + label on a dark strap
      const tag = (SPEC.sourceLabel || 'Source').toUpperCase();
      ctx.font = CR.font(size * 0.9, 800, 'sans');
      const tw = ctx.measureText(tag).width + size * 1.2;
      const room = W - 2 * L.m - brandW - tw - size;
      ctx.font = CR.font(size, 500, 'sans');
      const text = CR.ellipsize(SPEC.source, room);
      const sw = ctx.measureText(text).width + size * 1.2;
      const h = size * 1.7, yt = y - size * 1.22;
      ctx.fillStyle = THEME.accent; ctx.fillRect(L.m, yt, tw, h);
      ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(L.m + tw, yt, sw, h);
      ctx.fillStyle = '#FFFFFF'; ctx.font = CR.font(size * 0.9, 800, 'sans');
      ctx.fillText(tag, L.m + size * 0.6, y - size * 0.1);
      ctx.font = CR.font(size, 500, 'sans'); ctx.fillStyle = THEME.text;
      ctx.fillText(text, L.m + tw + size * 0.6, y - size * 0.1);
      ctx.fillStyle = THEME.muted;
    } else if (SPEC.source) {
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
        if (!best || t0 > best.t0) best = { text: (n.showAt === false ? '' : n.at + ' · ') + n.text, body: n.text, at: n.at, a, t0 };
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
    if (THEME.noteStyle === 'strap') {
      // lower-third: accent tag with the period, white strap with the event
      const h = size * 1.9, dx = (1 - CR.easeOutCubic(note.a)) * -40 * u;
      ctx.font = CR.font(size, 800, 'sans');
      const tag = String(note.at);
      const tw = ctx.measureText(tag).width + size * 1.2;
      ctx.font = CR.font(size, 700, 'sans');
      const text = CR.ellipsize(note.body, maxW - tw - size * 1.4);
      const bw = ctx.measureText(text).width + size * 1.2;
      ctx.fillStyle = THEME.accent; ctx.fillRect(x + dx, y, tw, h);
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x + dx + tw, y, bw, h);
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FFFFFF'; ctx.font = CR.font(size, 800, 'sans');
      ctx.fillText(tag, x + dx + size * 0.6, y + h / 2 + size * 0.04);
      ctx.fillStyle = '#0B1630'; ctx.font = CR.font(size, 700, 'sans');
      ctx.fillText(text, x + dx + tw + size * 0.6, y + h / 2 + size * 0.04);
      ctx.restore(); ctx.textBaseline = 'alphabetic';
      return;
    }
    ctx.font = CR.font(size, 600, THEME.bodyFamily || 'sans');
    const text = CR.ellipsize(note.text, maxW - size * 2.4);
    const w = ctx.measureText(text).width + size * 2.2;
    const h = size * 1.9;
    const dy = (1 - note.a) * 10 * u;
    CR.roundRect(x, y + dy, w, h, h / 2);
    ctx.fillStyle = THEME.card; ctx.fill();
    ctx.strokeStyle = THEME.cardStroke; ctx.lineWidth = 1.5 * u; ctx.stroke();
    ctx.fillStyle = THEME.cardText || THEME.accent;
    ctx.beginPath(); ctx.arc(x + size * 0.95, y + dy + h / 2, size * 0.24, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = THEME.cardText || THEME.text; ctx.textBaseline = 'middle';
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
    let h = lh * fit.lines.length + fit.size * 1.1;
    ctx.font = CR.font(fit.size, 800, CR.titleFamily);
    let w = Math.max(...fit.lines.map((l) => ctx.measureText(l).width));
    let cta = null;
    if (SPEC.cta) {
      const cs = fit.size * 0.56;
      ctx.font = CR.font(cs, 600, 'sans');
      cta = { text: CR.ellipsize(SPEC.cta, maxW - size * 1.6), size: cs };
      w = Math.max(w, ctx.measureText(cta.text).width);
      h += cs * 1.5;
    }
    w = Math.min(maxW, w + fit.size * 1.6);
    takeawayCache = { lines: fit.lines, size: fit.size, lh, w, h, cta };
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
    if (THEME.glass) { ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(x + 20 * u, y + 2 * u, w - 40 * u, h * 0.4); }
    ctx.shadowBlur = 0;
    ctx.strokeStyle = THEME.cardStroke; ctx.lineWidth = 2 * u; ctx.stroke();
    ctx.fillStyle = THEME.cardText ? THEME.cardText : THEME.accent;
    ctx.fillRect(x, y + h * 0.2, 6 * u, h * 0.6);
    ctx.fillStyle = THEME.cardText || THEME.text;
    ctx.font = CR.font(f.size, 800, CR.titleFamily);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const ctaH = f.cta ? f.cta.size * 1.5 : 0;
    let ly = y + (h - ctaH) / 2 - (f.lines.length - 1) * f.lh / 2;
    for (const line of f.lines) { ctx.fillText(line, x + w / 2, ly + f.size * 0.04); ly += f.lh; }
    if (f.cta) {
      ctx.font = CR.font(f.cta.size, 600, 'sans');
      ctx.globalAlpha *= 0.8;
      ctx.fillText(f.cta.text, x + w / 2, y + h - f.size * 0.55 - f.cta.size * 0.55);
    }
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

  // rolling digits: characters that change slide up like an odometer (f: 0→1)
  CR.drawRoll = function (from, to, f, x, y, align) {
    from = String(from); to = String(to);
    if (f <= 0 || from === to) return CR.drawNumber(from, x, y, align);
    if (f >= 1) return CR.drawNumber(to, x, y, align);
    const e = CR.easeInOutCubic(f);
    if (from.length !== to.length) {
      const ga = ctx.globalAlpha;
      ctx.globalAlpha = ga * (1 - e); CR.drawNumber(from, x, y, align);
      ctx.globalAlpha = ga * e; const w = CR.drawNumber(to, x, y, align);
      ctx.globalAlpha = ga; return w;
    }
    const size = parseFloat(/([\d.]+)px/.exec(ctx.font)[1]);
    const dw = ctx.measureText('0').width;
    const total = CR.numberWidth(to);
    let cx = align === 'right' ? x - total : align === 'center' ? x - total / 2 : x;
    const saved = ctx.textAlign; ctx.textAlign = 'left';
    const ga = ctx.globalAlpha;
    for (let k = 0; k < to.length; k++) {
      const a = from[k], b = to[k];
      const isD = b >= '0' && b <= '9';
      const cw = isD ? dw : ctx.measureText(b).width;
      const off = (ch) => (ch >= '0' && ch <= '9' ? (dw - ctx.measureText(ch).width) / 2 : 0);
      if (a === b) ctx.fillText(b, cx + off(b), y);
      else {
        ctx.save();
        ctx.beginPath(); ctx.rect(cx - 2 * u, y - size * 1.0, cw + 4 * u, size * 1.22); ctx.clip();
        ctx.globalAlpha = ga * (1 - e); ctx.fillText(a, cx + off(a), y - e * size * 0.95);
        ctx.globalAlpha = ga * e; ctx.fillText(b, cx + off(b), y + (1 - e) * size * 0.95);
        ctx.restore();
      }
      cx += cw;
    }
    ctx.textAlign = saved;
    return total;
  };
  // which period label to show at key position p, and how far the roll to the next one is
  CR.periodRoll = function (times, p, perKey) {
    const k = CR.periodIndex(p);
    const span = clamp(0.18 / Math.max(perKey, 1e-3), 0.1, 0.35);
    const f = p - k;
    if (k + 1 >= times.length || f < 1 - span) return { from: times[k], to: times[k], f: 0 };
    return { from: times[k], to: times[k + 1], f: (f - (1 - span)) / span };
  };

  // ------------------------------------------------------------- effects
  // tiny deterministic hash -> [0,1)
  const rnd = (CR.rnd = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); });
  // confetti bursts: [{t, x, y, seed}]; each lasts 1.5 s
  CR.drawConfetti = function (bursts, t) {
    for (const bu of bursts) {
      const age = t - bu.t;
      if (age < 0 || age > 1.5) continue;
      ctx.save();
      ctx.globalAlpha = 1 - CR.smoothstep(0.9, 1.5, age);
      for (let k = 0; k < 56; k++) {
        const ang = -Math.PI / 2 + (rnd(bu.seed, k) - 0.5) * Math.PI * 1.3;
        const sp = (520 + 820 * rnd(bu.seed + 1, k)) * u;
        const drag = 1 - Math.exp(-2.2 * age);
        const px = bu.x + Math.cos(ang) * sp * drag / 2.2;
        const py = bu.y + Math.sin(ang) * sp * drag / 2.2 + 520 * u * age * age;
        const sz = (8 + 10 * rnd(bu.seed + 2, k)) * u;
        ctx.translate(px, py); ctx.rotate(rnd(bu.seed + 3, k) * 6 + age * (rnd(bu.seed + 4, k) - 0.5) * 18);
        ctx.fillStyle = THEME.palette[k % 8];
        ctx.fillRect(-sz / 2, -sz * 0.3, sz, sz * 0.6);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        if (CR.camera) CR.camera();
      }
      ctx.restore();
    }
  };

  function vignette() {
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.hypot(W, H) * 0.6);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  function scanlines(t) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    const step = Math.max(2, Math.round(4 * u));
    for (let y = 0; y < H; y += step) ctx.fillRect(0, y, W, Math.max(1, step / 2));
    // a slow tracking band rolling down the picture
    const by = (((t * 0.18) % 1.3) - 0.15) * H;
    const g = ctx.createLinearGradient(0, by - 40 * u, 0, by + 40 * u);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.06)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, by - 40 * u, W, 80 * u);
    // PLAY stamp + tape counter
    const L = CR.L;
    const size = (L.shape === 'portrait' ? 30 : 22) * u;
    const y = L.shape === 'portrait' ? L.top * 0.55 : 30 * u;
    ctx.font = CR.font(size, 700, 'mono'); ctx.textBaseline = 'middle';
    ctx.fillStyle = THEME.text; ctx.globalAlpha = 0.85;
    ctx.textAlign = 'left'; CR.fillTextFx('▶ PLAY', L.m, y);
    const s = Math.floor(t);
    ctx.textAlign = 'right'; CR.fillTextFx('SP 0:' + String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'), W - L.m, y);
    ctx.restore();
  }
  function topProgress(t) {
    const TL = CR.TL; if (!TL) return;
    const L = CR.L;
    const f = clamp((t - TL.I) / TL.M, 0, 1);
    const y = L.shape === 'portrait' ? L.top * 0.38 : 18 * u, h = 8 * u, w = W - 2 * L.m;
    ctx.save();
    ctx.fillStyle = THEME.grid; CR.roundRect(L.m, y, w, h, h / 2); ctx.fill();
    ctx.fillStyle = THEME.accent; ctx.shadowColor = THEME.accent; ctx.shadowBlur = 12 * u;
    CR.roundRect(L.m, y, Math.max(h, w * f), h, h / 2); ctx.fill();
    ctx.restore();
  }

  // the hook: a big question/claim over a dimmed chart for the first ~1.5 s
  let hookCache = null;
  function hookKicker() {
    const D = SPEC.data || {};
    if (D.times && D.times.length > 1) return D.times[0] + ' → ' + D.times[D.times.length - 1];
    if (D.items && D.items.length > 1) return D.items[0].label + ' → ' + D.items[D.items.length - 1].label;
    return '';
  }
  CR.drawHook = function (t) {
    const HD = CR.hookDur;
    if (!HD || t >= HD) return;
    const L = CR.L, st = SPEC.hookStyle || 'pop';
    const big = st === 'bold';
    const maxW = W - 2 * L.m - (big ? 40 * u : 0);
    if (!hookCache) {
      const size = (L.shape === 'portrait' ? (big ? 150 : 104) : big ? 110 : 84) * u;
      const fit = CR.fitLines(SPEC.hook, maxW, size, big ? 900 : CR.titleWeight, big ? 'sans' : CR.titleFamily, big ? 4 : 3, 0.45);
      ctx.font = CR.font(fit.size, big ? 900 : CR.titleWeight, big ? 'sans' : CR.titleFamily);
      hookCache = { fit, widths: fit.lines.map((l) => ctx.measureText(l).width), kicker: hookKicker() };
    }
    const { fit, widths, kicker } = hookCache;
    const exit = CR.smoothstep(HD - 0.32, HD, t);
    ctx.save();
    ctx.globalAlpha = 0.9 * (1 - exit);
    ctx.fillStyle = THEME.bg; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1 - exit;
    const lh = fit.size * (big ? 1.2 : 1.14);
    const blockH = lh * fit.lines.length;
    const cy = H * (L.shape === 'portrait' ? 0.44 : 0.5);
    const y0 = cy - blockH / 2 + fit.size * 0.85 - exit * 30 * u;
    const fam = big ? 'sans' : CR.titleFamily, wt = big ? 900 : CR.titleWeight;
    // kicker: the data range, in the accent colour
    if (kicker && st !== 'strap') {
      const ks = (L.shape === 'portrait' ? 38 : 30) * u;
      ctx.font = CR.font(ks, 700, THEME.bodyFamily || 'sans'); ctx.textAlign = 'center';
      ctx.fillStyle = THEME.accent;
      ctx.globalAlpha = (1 - exit) * CR.smoothstep(0, 0.25, t);
      ctx.fillText(kicker, W / 2, y0 - fit.size * 1.05 - ks * 0.4);
      ctx.globalAlpha = 1 - exit;
    }
    ctx.textBaseline = 'alphabetic';
    if (st === 'strap') {
      // broadcast strap sliding in from the left
      const slide = CR.easeOutCubic(clamp((t - 0.05) / 0.4, 0, 1));
      const ts = (L.shape === 'portrait' ? 36 : 28) * u;
      const x = L.m - (1 - slide) * W;
      const top = y0 - fit.size * 1.0 - ts * 1.9;
      ctx.font = CR.font(ts, 800, 'sans');
      const tag = ('DATA' + (kicker ? '  ·  ' + kicker : '')).toUpperCase();
      const tw = ctx.measureText(tag).width + ts * 1.2;
      ctx.fillStyle = THEME.accent; ctx.fillRect(x, top, tw, ts * 1.8);
      ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'left'; ctx.fillText(tag, x + ts * 0.6, top + ts * 1.25);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(x, top + ts * 1.8, Math.max(...widths) + 60 * u, blockH + fit.size * 0.5);
      ctx.fillStyle = '#0B1630'; ctx.font = CR.font(fit.size, wt, fam);
      fit.lines.forEach((line, j) => ctx.fillText(line, x + 30 * u, y0 + j * lh));
      ctx.restore();
      return;
    }
    ctx.font = CR.font(fit.size, wt, fam);
    if (st === 'type') {
      // typewriter: characters appear at a steady rate, with a blinking block cursor
      const all = fit.lines.join('');
      const n = Array.from(all).length;
      const shown = Math.floor(clamp((t - 0.1) / Math.max(0.3, HD * 0.62), 0, 1) * n + 1e-6);
      let left = shown, cur = null;
      fit.lines.forEach((line, j) => {
        const chars = Array.from(line);
        const part = chars.slice(0, Math.max(0, left)).join('');
        left -= chars.length;
        const x = W / 2 - widths[j] / 2, y = y0 + j * lh;
        ctx.textAlign = 'left'; ctx.fillStyle = THEME.text;
        CR.fillTextFx(part, x, y);
        if (left < 0 && !cur) cur = [x + ctx.measureText(part).width, y];
      });
      if (!cur) cur = [W / 2 + widths[widths.length - 1] / 2, y0 + (fit.lines.length - 1) * lh];
      if (Math.floor(t * 4) % 2 === 0 || shown < n) {
        ctx.fillStyle = THEME.accent;
        ctx.fillRect(cur[0] + 6 * u, cur[1] - fit.size * 0.78, fit.size * 0.5, fit.size * 0.9);
      }
      ctx.restore();
      return;
    }
    // pop / bold: words land one after another with a little overshoot
    let wi = 0;
    const step = big ? 0.13 : 0.085;
    fit.lines.forEach((line, j) => {
      const words = /\s/.test(line) ? line.split(/(?<=\s)/) : [line];
      let x = W / 2 - widths[j] / 2;
      const y = y0 + j * lh;
      if (big && j % 2 === 1) {
        // alternate lines sit on a highlight block, like Douyin captions
        const a = CR.smoothstep(0.05 + wi * step, 0.2 + wi * step, t);
        ctx.fillStyle = THEME.accent; ctx.globalAlpha = (1 - exit) * a;
        ctx.fillRect(x - 18 * u, y - fit.size * 0.9, widths[j] * a + 36 * u, fit.size * 1.12);
        ctx.globalAlpha = 1 - exit;
      }
      for (const w of words) {
        const t0 = 0.05 + wi * step;
        const k = clamp((t - t0) / 0.22, 0, 1);
        const back = 1 + 2.2 * Math.pow(k - 1, 3) + 1.2 * Math.pow(k - 1, 2); // easeOutBack
        const sc = (big ? 1.6 : 1.3) - (big ? 0.6 : 0.3) * back;
        const ww = ctx.measureText(w).width;
        ctx.save();
        ctx.globalAlpha = (1 - exit) * clamp(k * 2, 0, 1);
        ctx.translate(x + ww / 2, y - fit.size * 0.35); ctx.scale(sc * (1 + exit * 0.08), sc * (1 + exit * 0.08));
        ctx.textAlign = 'center';
        ctx.fillStyle = big && j % 2 === 1 ? (THEME.cardText || '#000') : THEME.text;
        CR.fillTextFx(w, 0, fit.size * 0.35);
        ctx.restore();
        x += ww; wi++;
      }
    });
    ctx.restore();
  };
  function letterbox(t) {
    const open = CR.easeInOutCubic(clamp((t - Math.max(0, CR.hookDur - 0.25)) / 0.7, 0, 1));
    const h = H * 0.1 * (1 - open);
    if (h < 0.5) return;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, h); ctx.fillRect(0, H - h, W, h);
  }
  // camera punch (scale about the centre) requested by the template for frame t
  let punch = 0;
  CR.camera = function () { if (punch > 0) { ctx.translate(W / 2, H / 2); ctx.scale(1 + punch, 1 + punch); ctx.translate(-W / 2, -H / 2); } };
  function overlays(t) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    if (FX.vignette) vignette();
    if (FX.scanlines) scanlines(t);
    if (SPEC.progress === 'top' || SPEC.progress === 'both') topProgress(t);
    CR.drawHook(t);
    if (FX.letterbox) letterbox(t);
  }

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
      CR.t = t;
      punch = FX.punch && impl.punch ? impl.punch(t) : 0;
      CR.camera();
      impl.draw(ctx, t);
      overlays(t);
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      return true;
    },
    state: (t) => impl.state(clamp(+t || 0, 0, SPEC.duration)),
    keyTimes: () => impl.keyTimes(),
    events: () => (impl.events ? impl.events() : []),
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
