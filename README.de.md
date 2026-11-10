<p align="center">
  <img src="docs/hero.gif" alt="chartreel-Balkenrennen: die größten Volkswirtschaften der Welt 1990–2024, Daten der Weltbank" width="100%">
</p>

<h1 align="center">chartreel</h1>

<p align="center">
  <b>Ein Agent Skill + CLI, das aus einer CSV ein kurzes Datenanimations-Video mit exakten Zahlen macht.</b><br>
  Balkenrennen, Linienrennen, Großzahl-Zähler und Anteilsverschiebung — MP4 + GIF + Cover, 9:16 oder 16:9, mit Chinesisch-Unterstützung.
</p>

<p align="center">
  <a href="https://github.com/Xkongai/chartreel/actions/workflows/ci.yml"><img src="https://github.com/Xkongai/chartreel/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT"></a>
  <img src="https://img.shields.io/badge/python-3.10%2B-3776AB.svg" alt="Python 3.10+">
  <img src="https://img.shields.io/badge/Agent%20Skill-Claude%20Code%20%7C%20Codex%20%7C%20Cursor-8A2BE2.svg" alt="Agent Skill">
</p>

<p align="center">
  <a href="README.md">English</a> | <a href="README.zh-CN.md">简体中文</a> | <a href="README.ja.md">日本語</a> | <a href="README.es.md">Español</a> | <a href="README.pt-BR.md">Português (Brasil)</a> | <a href="README.fr.md">Français</a> | <b>Deutsch</b> | <a href="README.ko.md">한국어</a> | <a href="README.ru.md">Русский</a>
</p>

Datenvideos — „Die größten Volkswirtschaften der Welt, 1990–2024“, „China gegen Indien: die Bevölkerung“ — laufen auf
Douyin, Xiaohongshu, YouTube Shorts, Reels und X sehr gut. Eines zu bauen heißt meist: After Effects, ein Flourish-Abo
oder ein Notebook voller matplotlib-Code. **chartreel** gibt deinem KI-Agenten einen Skill dafür: Der Agent sucht echte Daten,
schreibt die Story (Hook, Schlüsselmomente, Fazit) und rendert den fertigen Clip. Jede Zahl im Bild stammt aus deiner CSV.

> **Sag deinem Agenten:** „Mach ein 15-sekündiges vertikales Balkenrennen der 10 größten Volkswirtschaften seit 1990
> mit Weltbank-Daten und einem Fazit am Ende.“

## Galerie

| Linienrennen (chinesische Beschriftung, `paper`) | Großzahl-Zähler (`neon`) |
| --- | --- |
| <img src="docs/line-race.gif" alt="Linienrennen: Bevölkerung von China und Indien 1960–2024" width="100%"> | <img src="docs/counter.gif" alt="Zähler: Chinas BIP 1980, 2000 und 2024" width="100%"> |
| **Anteilsverschiebung (`paper`)** | **Vertikal 9:16 für Shorts / Douyin (`neon`)** |
| <img src="docs/share.gif" alt="Waffeldiagramm: Anteil der Weltbevölkerung nach Region" width="100%"> | <img src="docs/vertical.gif" alt="Vertikales Balkenrennen" width="45%"> |

Cover in voller Größe: [9:16-Rennen](docs/cover-race-9x16.png) · [16:9-Linienrennen](docs/cover-line-16x9.png).
Alle Demos nutzen [Daten der Weltbank (CC BY 4.0)](examples/README.md).

## Installation

Du brauchst Python 3.10+, ffmpeg und Chromium (Playwright lädt es herunter; ein installiertes Chrome geht auch).

**1. Die CLI**

```bash
pip install "git+https://github.com/Xkongai/chartreel"
python -m playwright install chromium     # skip if Chrome/Chromium is installed
chartreel doctor                          # checks ffmpeg, Chromium and fonts
```

ffmpeg: `brew install ffmpeg` (macOS) · `sudo apt install ffmpeg` (Ubuntu) · `winget install Gyan.FFmpeg` (Windows).
Für chinesischen, japanischen oder koreanischen Text unter Linux: `sudo apt install fonts-noto-cjk fonts-noto-color-emoji`.

**2. Der Skill** (wähle deinen Agenten)

| Agent | Installation |
| --- | --- |
| Claude Code | `/plugin marketplace add Xkongai/chartreel`, dann `/plugin install chartreel@chartreel` |
| Codex | `git clone https://github.com/Xkongai/chartreel && mkdir -p ~/.agents/skills && cp -r chartreel/skills/chartreel ~/.agents/skills/` |
| Cursor, OpenCode, Gemini CLI und andere | `npx skills add Xkongai/chartreel -g` |
| Jeder Agent, der `SKILL.md` liest | `skills/chartreel/` in den Skill-Ordner des Agenten kopieren |

Claude Code liest auch `~/.claude/skills/chartreel/`, falls du den Ordner lieber von Hand kopierst.

## Schnellstart (CLI)

```bash
git clone https://github.com/Xkongai/chartreel && cd chartreel
chartreel render examples/gdp-race.csv -c examples/gdp-race.json -o out/
# out/gdp-race.mp4   1080×1920 H.264, 12 s
# out/gdp-race.gif   540 px wide
# out/gdp-race-cover.png
```

Oder nur mit Optionen:

```bash
chartreel render my.csv --template line --theme paper --aspect 16:9 --duration 15 \
  --title "China vs India" --source "World Bank, CC BY 4.0" --takeaway "India passed China in 2021" \
  --note "2021: India passes China" --locale zh -o out/
```

`chartreel validate my.csv` prüft die Datei vorab und nennt bei Problemen die genaue Zeile und Spalte.
`chartreel preview my.csv -o out/` schreibt einen eigenständigen HTML-Player, den du im Browser durchspulen kannst.

## Vorlagen und Themes

| Vorlage | Ideal für | CSV |
| --- | --- | --- |
| `race` | Ranglisten im Zeitverlauf, Überholmanöver | `year,A,B,C…` |
| `line` | wenige Reihen, die wachsen oder sich kreuzen | `year,A,B,C…` |
| `counter` | eine große Zahl, dann „×N“-Vergleiche | `label,value,note` |
| `share` | Anteile an einem Ganzen im Wandel (10×10-Waffel) | `year,A,B,C…` |

Themes: `dark` (dunkle Tech-Optik), `paper` (Zeitung, Serifen-Überschrift), `neon` (Leuchten).
Formate: `9:16`, `16:9`, `1:1`, `4:5`, `3:4`. Das Langformat `year,name,value` wird automatisch umgewandelt.

Story-Optionen: `--title` (der Hook), `--subtitle` (Einheiten), `--note "PERIODE: Text"` (Schlüsselmomente),
`--takeaway` (Abschlusskarte), `--source` (immer sichtbar). Zahlen: `--prefix $`, `--suffix`, `--decimals`,
`--number-style compact|full|percent`, `--locale zh` (万 / 亿 / 万亿). `label`, `color` und `emoji` pro Reihe
kommen in eine JSON-Konfiguration. Vollständige Liste: [skills/chartreel/references/options.md](skills/chartreel/references/options.md).

## Warum die Zahlen stimmen

- In dem Moment, in dem eine Zeile im Bild ist, entspricht jeder Wert genau dem CSV-Wert; dazwischen wird linear zwischen
  den beiden benachbarten Zeilen interpoliert. `tests/test_accuracy.py` prüft das für jedes Beispiel in mehreren Formaten
  und kontrolliert, dass die Rangfolge des Rennens in jeder Zeile zu den Daten passt.
- Leere Zellen in der Mitte werden interpoliert und von `validate` gemeldet; nichts wird aus dem Gedächtnis ergänzt.
- Der Zähler zählt hoch und bleibt dann auf dem exakten Wert stehen. Die Waffel hat immer genau 100 Felder (größter Rest).
- Der Skill weist den Agenten an, Daten aus einer Primärquelle zu holen, Fazits per Code zu berechnen und immer die Quelle anzugeben.

## So funktioniert es

Jede Vorlage ist eine eigenständige HTML-Seite mit einem deterministischen `renderFrame(t)` — ohne Systemuhr und ohne Zufall —,
daher sieht derselbe Frame in der Browser-Vorschau und im Export identisch aus. chartreel steuert Headless-Chromium mit
Playwright, nimmt jeden Frame auf und leitet ihn an ffmpeg weiter (H.264 `yuv420p`, `+faststart`; GIF über `palettegen`).
Mehrere Browser-Prozesse rendern Abschnitte parallel (`--jobs`).

Gemessen auf einem Linux-Rechner mit 8 Kernen: Ein 12-s-Rennen in 1080×1920 (360 Frames) rendert mit 4 Prozessen in etwa 9 s
(mit einem etwa 27 s).

## Einschränkungen

- Schriften kommen vom System. Ohne CJK-Schrift erscheint chinesischer Text als Kästchen; `chartreel doctor` warnt dich.
  Flaggen-Emojis werden unter Windows nicht angezeigt (die System-Emoji-Schrift enthält keine Flaggen).
- Noch keine Tonspur und keine eigenen Keyframes; die Zeit zwischen zwei Zeilen ist gleichmäßig.
- Die Vorlage `line` ist mit bis zu etwa 8 Reihen gut lesbar, `share` mit bis zu etwa 10 Teilen.

## Entwicklung

```bash
pip install -e ".[dev]" && python -m playwright install chromium
pytest -q                       # parsing, accuracy, deterministic frames, smoke renders
bash scripts/make_demos.sh      # regenerate docs/*.gif
python scripts/fetch_worldbank.py   # re-download the example data
```

Siehe [CONTRIBUTING.md](CONTRIBUTING.md) und [CHANGELOG.md](CHANGELOG.md).

## Lizenz

[MIT](LICENSE) © 2026 Xkongai. Beispieldaten: Weltbank, World Development Indicators, CC BY 4.0.
