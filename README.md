<p align="center">
  <img src="docs/hero.gif" alt="chartreel bar chart race: the world's largest economies 1990–2024, World Bank data" width="100%">
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

## Gallery

| Line race (Chinese labels, `paper`) | Big-number counter (`neon`) |
| --- | --- |
| <img src="docs/line-race.gif" alt="Line race: China vs India population 1960–2024" width="100%"> | <img src="docs/counter.gif" alt="Counter: China's GDP 1980, 2000, 2024" width="100%"> |
| **Share shift (`paper`)** | **Vertical 9:16 for Shorts / Douyin (`neon`)** |
| <img src="docs/share.gif" alt="Waffle chart: share of world population by region" width="100%"> | <img src="docs/vertical.gif" alt="Vertical bar chart race" width="45%"> |

Full-size covers: [9:16 race](docs/cover-race-9x16.png) · [16:9 line race](docs/cover-line-16x9.png).
All demos use [World Bank data (CC BY 4.0)](examples/README.md).

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
- No audio track and no custom per-frame keyframes yet; time between rows is uniform.
- The `line` template is easiest to read with up to about 8 series; `share` with up to about 10 parts.

## Development

```bash
pip install -e ".[dev]" && python -m playwright install chromium
pytest -q                       # parsing, accuracy, deterministic frames, smoke renders
bash scripts/make_demos.sh      # regenerate docs/*.gif
python scripts/fetch_worldbank.py   # re-download the example data
```

See [CONTRIBUTING.md](CONTRIBUTING.md) and [CHANGELOG.md](CHANGELOG.md).

## License

[MIT](LICENSE) © 2026 Xkongai. Example data: World Bank, World Development Indicators, CC BY 4.0.
