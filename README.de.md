<p align="center">
  <img src="docs/banner.png" alt="chartreel — CSV rein, Datenanimations-Video raus. Echte Renderings mit Daten der Weltbank: 9:16-Balkenrennen, Linienrennen, Zähler und Waffeldiagramm" width="100%">
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

## Beispiele

Jeder Clip und jedes Bild unten ist ein echtes chartreel-Rendering der mitgelieferten [Weltbank-Beispiele](examples/README.md) (CC BY 4.0), erzeugt mit dem Befehl darunter.

### Vorlagen

| Balkenrennen · 16:9 · `dark` | Linienrennen · chinesische Beschriftung · `paper` |
| --- | --- |
| <img src="docs/hero.gif" alt="Balkenrennen · 16:9 · dark" width="100%"> | <img src="docs/line-race.gif" alt="Linienrennen · chinesische Beschriftung · paper" width="100%"> |
| `chartreel render examples/gdp-race.csv -c examples/gdp-race.json -a 16:9 --size 720 -d 7 --intro 0.4 --outro 1.6 --top 8` | `chartreel render examples/population-zh.csv -c examples/population-zh.json -a 16:9 --size 720 -d 8 --outro 1.6` |
| **Großer Zähler · 1:1 · `neon`** | **Anteilsverschiebung (Waffel) · 16:9 · `paper`** |
| <img src="docs/counter.gif" alt="Großer Zähler · 1:1 · neon" width="100%"> | <img src="docs/share.gif" alt="Anteilsverschiebung (Waffel) · 16:9 · paper" width="100%"> |
| `chartreel render examples/china-gdp-counter.csv -c examples/china-gdp-counter.json -a 1:1 --size 720 -d 7 --outro 1.6` | `chartreel render examples/population-share.csv -c examples/population-share.json --theme paper -a 16:9 --size 720 -d 7 --outro 1.6` |

Cover in voller Größe: [9:16-Rennen](docs/cover-race-9x16.png) · [16:9-Linienrennen](docs/cover-line-16x9.png).

### Stil-Presets (`--style`)

Gleiche Daten, gleiches 15-Sekunden-Video in 9:16, acht Looks. Ein Preset bündelt ein Theme, eine Hook-Karte für die ersten ~1,5 s, einen Jahreszähler, die Hervorhebung von Platz 1 und Effekte. Die Zahlen bleiben in jedem Preset exakt (`tests/test_styles.py`). Die Vorschaubilder sind das Bild bei 8,25 s jedes MP4, erzeugt mit:

```bash
chartreel render examples/gdp-race.csv -c examples/gdp-race.json -d 15 --style STYLE \
  --hook "Who has the world's biggest economy?" --cta "Follow for more data stories"
# all eight at once: bash scripts/make_styles.sh out/styles
```

<table>
<tr><td width="25%" valign="top"><img src="docs/styles/classic.jpg" alt="--style classic" width="100%"><br><b><code>--style classic</code></b><br><sub>Standard-Look, kein Hook (ohne <code>--hook</code>/<code>--cta</code> gerendert)</sub></td><td width="25%" valign="top"><img src="docs/styles/cinematic.jpg" alt="--style cinematic" width="100%"><br><b><code>--style cinematic</code></b><br><sub>Hook mit Kinobalken, goldener Glanz, rollende Jahreszahl, Krone für Platz 1, Punch-in</sub></td><td width="25%" valign="top"><img src="docs/styles/news.jpg" alt="--style news" width="100%"><br><b><code>--style news</code></b><br><sub>TV-Bauchbinden: Hook-Leiste, Rangnummern, rotes Jahres-Badge, Quellenleiste</sub></td><td width="25%" valign="top"><img src="docs/styles/editorial.jpg" alt="--style editorial" width="100%"><br><b><code>--style editorial</code></b><br><sub>Schreibmaschinen-Hook, graue Balken, hervorgehobene Reihen (plus <code>--highlight "China,United States"</code>)</sub></td></tr>
<tr><td width="25%" valign="top"><img src="docs/styles/arcade.jpg" alt="--style arcade" width="100%"><br><b><code>--style arcade</code></b><br><sub>Neon, Konfetti und Punch-in, wenn ein Balken in die Top 3 kommt, ▲-Pfeile, Speed-Streifen</sub></td><td width="25%" valign="top"><img src="docs/styles/retro.jpg" alt="--style retro" width="100%"><br><b><code>--style retro</code></b><br><sub>VHS-Scanlines, chromatischer Text, PLAY-Stempel, Schreibmaschinen-Hook</sub></td><td width="25%" valign="top"><img src="docs/styles/glass.jpg" alt="--style glass" width="100%"><br><b><code>--style glass</code></b><br><sub>Wandernde Farbflächen, Milchglas-Panel, Fortschrittsbalken oben</sub></td><td width="25%" valign="top"><img src="docs/styles/bold.jpg" alt="--style bold" width="100%"><br><b><code>--style bold</code></b><br><sub>Douyin-Großschrift: riesige hervorgehobene Hook-Wörter, große Jahreszahl, Rangnummern</sub></td></tr>
</table>

Alle acht nebeneinander:

<p align="center"><img src="docs/styles-compare.jpg" alt="Alle acht nebeneinander" width="100%"></p>

Frei kombinierbar: `--fx bg,vignette,letterbox,scanlines,punch,confetti,trails,arrows,glass`, `--no-fx confetti`, `--year-style roll|row|badge`, `--progress top`, `--hook-style pop|type|strap|bold`. `--audio music.mp3` legt eine Tonspur darunter, an der du die Rechte hast (gekürzt und ein-/ausgeblendet; chartreel liefert keine Musik mit). `chartreel styles` listet alles auf.

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
- Keine mitgelieferte Musik und keine Soundeffekte (eigene Tonspur mit `--audio`), und noch keine eigenen Keyframes pro Bild; die Zeit zwischen zwei Zeilen ist gleich lang.
- Die Vorlage `line` ist mit bis zu etwa 8 Reihen gut lesbar, `share` mit bis zu etwa 10 Teilen.

## Entwicklung

```bash
pip install -e ".[dev]" && python -m playwright install chromium
pytest -q                       # parsing, accuracy, deterministic frames, smoke renders
bash scripts/make_demos.sh      # regenerate docs/*.gif
bash scripts/make_styles.sh out/styles    # the eight style presets, 9:16 15 s MP4 + cover
python scripts/make_gallery.py out/styles # docs/styles/*.jpg and docs/styles-compare.jpg
python scripts/make_banner.py             # docs/banner.png and docs/banner@2x.png
python scripts/fetch_worldbank.py   # re-download the example data
```

Siehe [CONTRIBUTING.md](CONTRIBUTING.md) und [CHANGELOG.md](CHANGELOG.md).

## Lizenz

[MIT](LICENSE) © 2026 Xkongai. Beispieldaten: Weltbank, World Development Indicators, CC BY 4.0.
