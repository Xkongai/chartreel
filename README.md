<p align="center">
  <img src="docs/banner.png" alt="chartreel — CSV in. Data-animation video out. Real renders of World Bank data: a 9:16 bar race, a line race, a counter and a waffle chart" width="100%">
</p>

<h1 align="center">chartreel</h1>

<p align="center">
  <b>An Agent Skill + CLI that turns a CSV into an accurate data-animation short video.</b><br>
  Bar chart race, line race, big-number counter and share shift — MP4 + GIF + cover, 9:16 or 16:9, Chinese-ready.
</p>

<p align="center">
  <a href="https://github.com/Xkongai/chartreel/actions/workflows/ci.yml"><img src="https://github.com/Xkongai/chartreel/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT"></a>
  <img src="https://img.shields.io/badge/python-3.10%2B-3776AB.svg" alt="Python 3.10+">
  <img src="https://img.shields.io/badge/Agent%20Skill-Claude%20Code%20%7C%20Codex%20%7C%20Cursor-8A2BE2.svg" alt="Agent Skill">
</p>

<p align="center">
  <b>English</b> | <a href="README.zh-CN.md">简体中文</a> | <a href="README.ja.md">日本語</a> | <a href="README.es.md">Español</a> | <a href="README.pt-BR.md">Português (Brasil)</a> | <a href="README.fr.md">Français</a> | <a href="README.de.md">Deutsch</a> | <a href="README.ko.md">한국어</a> | <a href="README.ru.md">Русский</a>
</p>

Data videos — "the world's biggest economies, 1990–2024", "China vs India population" — do well on
Douyin, Xiaohongshu, YouTube Shorts, Reels and X. Making one usually means After Effects, a Flourish
subscription, or a notebook full of matplotlib code. **chartreel** gives your AI agent a skill for it:
the agent finds real data, writes the story (hook, key moments, takeaway), and renders a finished clip.
Every number on screen comes from your CSV.

> **Ask your agent:** "Make a 15-second vertical bar chart race of the 10 largest economies since 1990
> from World Bank data, with a takeaway at the end."

## Showcase

Every clip and frame below is a real chartreel render of the bundled [World Bank examples](examples/README.md) (CC BY 4.0), made with the command under it.

### Templates

| Bar chart race · 16:9 · `dark` | Line race · Chinese labels · `paper` |
| --- | --- |
| <img src="docs/hero.gif" alt="Bar chart race · 16:9 · dark" width="100%"> | <img src="docs/line-race.gif" alt="Line race · Chinese labels · paper" width="100%"> |
| `chartreel render examples/gdp-race.csv -c examples/gdp-race.json -a 16:9 --size 720 -d 7 --intro 0.4 --outro 1.6 --top 8` | `chartreel render examples/population-zh.csv -c examples/population-zh.json -a 16:9 --size 720 -d 8 --outro 1.6` |
| **Big-number counter · 1:1 · `neon`** | **Share shift (waffle) · 16:9 · `paper`** |
| <img src="docs/counter.gif" alt="Big-number counter · 1:1 · neon" width="100%"> | <img src="docs/share.gif" alt="Share shift (waffle) · 16:9 · paper" width="100%"> |
| `chartreel render examples/china-gdp-counter.csv -c examples/china-gdp-counter.json -a 1:1 --size 720 -d 7 --outro 1.6` | `chartreel render examples/population-share.csv -c examples/population-share.json --theme paper -a 16:9 --size 720 -d 7 --outro 1.6` |

Full-size covers: [9:16 race](docs/cover-race-9x16.png) · [16:9 line race](docs/cover-line-16x9.png).

### Style presets (`--style`)

Same data, same 15-second 9:16 video, eight looks. A preset bundles a theme, a hook card for the first ~1.5 s, a year counter, the #1 decoration and effects. The numbers stay exact in every preset (`tests/test_styles.py`). Thumbnails are the frame at 8.25 s of each MP4, made with:

```bash
chartreel render examples/gdp-race.csv -c examples/gdp-race.json -d 15 --style STYLE \
  --hook "Who has the world's biggest economy?" --cta "Follow for more data stories"
# all eight at once: bash scripts/make_styles.sh out/styles
```

<table>
<tr><td width="25%" valign="top"><img src="docs/styles/classic.jpg" alt="--style classic" width="100%"><br><b><code>--style classic</code></b><br><sub>Default look, no hook (rendered without <code>--hook</code>/<code>--cta</code>)</sub></td><td width="25%" valign="top"><img src="docs/styles/cinematic.jpg" alt="--style cinematic" width="100%"><br><b><code>--style cinematic</code></b><br><sub>Letterbox hook, gold glow, rolling year, crown on #1, punch-in</sub></td><td width="25%" valign="top"><img src="docs/styles/news.jpg" alt="--style news" width="100%"><br><b><code>--style news</code></b><br><sub>TV straps: hook strap, rank numbers, red year badge, source strap</sub></td><td width="25%" valign="top"><img src="docs/styles/editorial.jpg" alt="--style editorial" width="100%"><br><b><code>--style editorial</code></b><br><sub>Typewriter hook, grey bars, highlighted series (plus <code>--highlight "China,United States"</code>)</sub></td></tr>
<tr><td width="25%" valign="top"><img src="docs/styles/arcade.jpg" alt="--style arcade" width="100%"><br><b><code>--style arcade</code></b><br><sub>Neon, confetti and punch-in when a bar reaches the top 3, ▲ arrows, speed streaks</sub></td><td width="25%" valign="top"><img src="docs/styles/retro.jpg" alt="--style retro" width="100%"><br><b><code>--style retro</code></b><br><sub>VHS scanlines, chromatic text, PLAY stamp, typewriter hook</sub></td><td width="25%" valign="top"><img src="docs/styles/glass.jpg" alt="--style glass" width="100%"><br><b><code>--style glass</code></b><br><sub>Drifting colour blobs, frosted chart panel, top progress bar</sub></td><td width="25%" valign="top"><img src="docs/styles/bold.jpg" alt="--style bold" width="100%"><br><b><code>--style bold</code></b><br><sub>Douyin big-text: giant highlighted hook words, huge year, rank numbers</sub></td></tr>
</table>

All eight side by side:

<p align="center"><img src="docs/styles-compare.jpg" alt="All eight side by side" width="100%"></p>

Mix your own: `--fx bg,vignette,letterbox,scanlines,punch,confetti,trails,arrows,glass`, `--no-fx confetti`, `--year-style roll|row|badge`, `--progress top`, `--hook-style pop|type|strap|bold`. `--audio music.mp3` adds a track you own (trimmed and faded; chartreel ships no music). `chartreel styles` lists everything.

## Install

You need Python 3.10+, ffmpeg, and Chromium (Playwright downloads it; an installed Chrome also works).

**1. The CLI**

```bash
pip install "git+https://github.com/Xkongai/chartreel"
python -m playwright install chromium     # skip if Chrome/Chromium is installed
chartreel doctor                          # checks ffmpeg, Chromium and fonts
```

ffmpeg: `brew install ffmpeg` (macOS) · `sudo apt install ffmpeg` (Ubuntu) · `winget install Gyan.FFmpeg` (Windows).
For Chinese/Japanese/Korean text on Linux: `sudo apt install fonts-noto-cjk fonts-noto-color-emoji`.

**2. The skill** (pick your agent)

| Agent | Install |
| --- | --- |
| Claude Code | `/plugin marketplace add Xkongai/chartreel` then `/plugin install chartreel@chartreel` |
| Codex | `git clone https://github.com/Xkongai/chartreel && mkdir -p ~/.agents/skills && cp -r chartreel/skills/chartreel ~/.agents/skills/` |
| Cursor, OpenCode, Gemini CLI and others | `npx skills add Xkongai/chartreel -g` |
| Any agent that reads `SKILL.md` | copy `skills/chartreel/` into the agent's skills folder |

Claude Code also reads `~/.claude/skills/chartreel/` if you prefer to copy the folder by hand.

## Quick start (CLI)

```bash
git clone https://github.com/Xkongai/chartreel && cd chartreel
chartreel render examples/gdp-race.csv -c examples/gdp-race.json -o out/
# out/gdp-race.mp4   1080×1920 H.264, 12 s
# out/gdp-race.gif   540 px wide
# out/gdp-race-cover.png
```

Or with flags only:

```bash
chartreel render my.csv --template line --theme paper --aspect 16:9 --duration 15 \
  --title "China vs India" --source "World Bank, CC BY 4.0" --takeaway "India passed China in 2021" \
  --note "2021: India passes China" --locale zh -o out/
```

`chartreel validate my.csv` checks the file first and points at the exact row and column of any problem.
`chartreel preview my.csv -o out/` writes a self-contained HTML player you can scrub in a browser.

## Templates and themes

| Template | Best for | CSV |
| --- | --- | --- |
| `race` | rankings over time, overtakes | `year,A,B,C…` |
| `line` | a few series growing or crossing | `year,A,B,C…` |
| `counter` | one big number, then "×N" comparisons | `label,value,note` |
| `share` | parts of a whole shifting (10×10 waffle) | `year,A,B,C…` |

Themes: `dark` (dark tech), `paper` (newspaper, serif headline), `neon` (glow).
Aspects: `9:16`, `16:9`, `1:1`, `4:5`, `3:4`. Long format `year,name,value` is pivoted automatically.

Story options: `--title` (the hook), `--subtitle` (units), `--note "PERIOD: text"` (key moments),
`--takeaway` (closing card), `--source` (always shown). Numbers: `--prefix $`, `--suffix`, `--decimals`,
`--number-style compact|full|percent`, `--locale zh` (万 / 亿 / 万亿). Per-series `label`, `color` and `emoji`
go in a JSON config. Full list: [skills/chartreel/references/options.md](skills/chartreel/references/options.md).

## How numbers stay honest

- At each row's moment on screen, every value equals the CSV value; in between it is a straight-line
  interpolation of the two neighbouring rows. `tests/test_accuracy.py` checks this for every example, in
  several aspects, and checks that the race ranking matches the data at every row.
- Blank interior cells are interpolated and reported by `validate`; nothing is filled from memory.
- The counter counts up, then holds the exact value. The waffle always has exactly 100 cells (largest remainder).
- The skill tells the agent to fetch data from a primary source, compute takeaways in code, and always cite the source.

## How it works

Each template is one self-contained HTML page with a deterministic `renderFrame(t)` — no wall-clock and no
randomness — so the same frame renders identically in a browser preview and in the export. chartreel drives
headless Chromium with Playwright, captures each frame, and pipes it to ffmpeg (H.264 `yuv420p`, `+faststart`;
GIF via `palettegen`). Several browser workers render chunks in parallel (`--jobs`).

Measured on an 8-core Linux box: a 12 s 1080×1920 race (360 frames) renders in about 9 s with 4 workers
(about 27 s with one).

## Limitations

- Fonts come from the system. Without a CJK font, Chinese text shows as boxes; `chartreel doctor` warns you.
  Flag emoji do not render on Windows (the system emoji font has no flags).
- No bundled music or sound effects (bring your own track with `--audio`), and no custom per-frame keyframes yet; time between rows is uniform.
- The `line` template is easiest to read with up to about 8 series; `share` with up to about 10 parts.

## Development

```bash
pip install -e ".[dev]" && python -m playwright install chromium
pytest -q                       # parsing, accuracy, deterministic frames, smoke renders
bash scripts/make_demos.sh      # regenerate docs/*.gif
bash scripts/make_styles.sh out/styles    # the eight style presets, 9:16 15 s MP4 + cover
python scripts/make_gallery.py out/styles # docs/styles/*.jpg and docs/styles-compare.jpg
python scripts/make_banner.py             # docs/banner.png and docs/banner@2x.png
python scripts/fetch_worldbank.py   # re-download the example data
```

See [CONTRIBUTING.md](CONTRIBUTING.md) and [CHANGELOG.md](CHANGELOG.md).

## License

[MIT](LICENSE) © 2026 Xkongai. Example data: World Bank, World Development Indicators, CC BY 4.0.
