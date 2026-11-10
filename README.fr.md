<p align="center">
  <img src="docs/hero.gif" alt="Course de barres chartreel : les plus grandes économies du monde 1990–2024, données de la Banque mondiale" width="100%">
</p>

<h1 align="center">chartreel</h1>

<p align="center">
  <b>Une Agent Skill + CLI qui transforme un CSV en courte vidéo de données animées, aux chiffres exacts.</b><br>
  Course de barres, course de courbes, compteur de grands nombres et évolution des parts — MP4 + GIF + couverture, 9:16 ou 16:9, compatible chinois.
</p>

<p align="center">
  <a href="https://github.com/Xkongai/chartreel/actions/workflows/ci.yml"><img src="https://github.com/Xkongai/chartreel/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT"></a>
  <img src="https://img.shields.io/badge/python-3.10%2B-3776AB.svg" alt="Python 3.10+">
  <img src="https://img.shields.io/badge/Agent%20Skill-Claude%20Code%20%7C%20Codex%20%7C%20Cursor-8A2BE2.svg" alt="Agent Skill">
</p>

<p align="center">
  <a href="README.md">English</a> | <a href="README.zh-CN.md">简体中文</a> | <a href="README.ja.md">日本語</a> | <a href="README.es.md">Español</a> | <a href="README.pt-BR.md">Português (Brasil)</a> | <b>Français</b> | <a href="README.de.md">Deutsch</a> | <a href="README.ko.md">한국어</a> | <a href="README.ru.md">Русский</a>
</p>

Les vidéos de données — « les plus grandes économies du monde, 1990–2024 », « Chine contre Inde : la population » — marchent très
bien sur Douyin, Xiaohongshu, YouTube Shorts, Reels et X. En faire une demande d'habitude After Effects, un abonnement Flourish
ou un notebook rempli de code matplotlib. **chartreel** donne à votre agent IA une skill dédiée : l'agent trouve des données réelles,
écrit l'histoire (accroche, moments clés, conclusion) et rend le clip final. Chaque chiffre à l'écran vient de votre CSV.

> **Demandez à votre agent :** « Fais une course de barres verticale de 15 secondes des 10 plus grandes économies depuis 1990,
> avec les données de la Banque mondiale et une conclusion à la fin. »

## Galerie

| Course de courbes (libellés en chinois, `paper`) | Compteur de grands nombres (`neon`) |
| --- | --- |
| <img src="docs/line-race.gif" alt="Course de courbes : population de la Chine et de l'Inde 1960–2024" width="100%"> | <img src="docs/counter.gif" alt="Compteur : PIB de la Chine en 1980, 2000 et 2024" width="100%"> |
| **Évolution des parts (`paper`)** | **Vertical 9:16 pour Shorts / Douyin (`neon`)** |
| <img src="docs/share.gif" alt="Graphique en gaufre : part de la population mondiale par région" width="100%"> | <img src="docs/vertical.gif" alt="Course de barres verticale" width="45%"> |

Couvertures en taille réelle : [course 9:16](docs/cover-race-9x16.png) · [course de courbes 16:9](docs/cover-line-16x9.png).
Toutes les démos utilisent des [données de la Banque mondiale (CC BY 4.0)](examples/README.md).

## Installation

Il vous faut Python 3.10+, ffmpeg et Chromium (Playwright le télécharge ; un Chrome déjà installé fonctionne aussi).

**1. La CLI**

```bash
pip install "git+https://github.com/Xkongai/chartreel"
python -m playwright install chromium     # skip if Chrome/Chromium is installed
chartreel doctor                          # checks ffmpeg, Chromium and fonts
```

ffmpeg : `brew install ffmpeg` (macOS) · `sudo apt install ffmpeg` (Ubuntu) · `winget install Gyan.FFmpeg` (Windows).
Pour le texte chinois, japonais ou coréen sous Linux : `sudo apt install fonts-noto-cjk fonts-noto-color-emoji`.

**2. La skill** (choisissez votre agent)

| Agent | Installation |
| --- | --- |
| Claude Code | `/plugin marketplace add Xkongai/chartreel` puis `/plugin install chartreel@chartreel` |
| Codex | `git clone https://github.com/Xkongai/chartreel && mkdir -p ~/.agents/skills && cp -r chartreel/skills/chartreel ~/.agents/skills/` |
| Cursor, OpenCode, Gemini CLI et autres | `npx skills add Xkongai/chartreel -g` |
| Tout agent qui lit `SKILL.md` | copiez `skills/chartreel/` dans le dossier de skills de l'agent |

Claude Code lit aussi `~/.claude/skills/chartreel/` si vous préférez copier le dossier à la main.

## Démarrage rapide (CLI)

```bash
git clone https://github.com/Xkongai/chartreel && cd chartreel
chartreel render examples/gdp-race.csv -c examples/gdp-race.json -o out/
# out/gdp-race.mp4   1080×1920 H.264, 12 s
# out/gdp-race.gif   540 px wide
# out/gdp-race-cover.png
```

Ou uniquement avec des options :

```bash
chartreel render my.csv --template line --theme paper --aspect 16:9 --duration 15 \
  --title "China vs India" --source "World Bank, CC BY 4.0" --takeaway "India passed China in 2021" \
  --note "2021: India passes China" --locale zh -o out/
```

`chartreel validate my.csv` vérifie d'abord le fichier et indique la ligne et la colonne exactes de chaque problème.
`chartreel preview my.csv -o out/` génère un lecteur HTML autonome que vous pouvez parcourir dans le navigateur.

## Modèles et thèmes

| Modèle | Idéal pour | CSV |
| --- | --- | --- |
| `race` | classements dans le temps, dépassements | `year,A,B,C…` |
| `line` | quelques séries qui croissent ou se croisent | `year,A,B,C…` |
| `counter` | un grand chiffre, puis des comparaisons « ×N » | `label,value,note` |
| `share` | parts d'un tout qui évoluent (gaufre 10×10) | `year,A,B,C…` |

Thèmes : `dark` (tech sombre), `paper` (journal, titre à empattements), `neon` (lueur).
Formats : `9:16`, `16:9`, `1:1`, `4:5`, `3:4`. Le format long `year,name,value` est converti automatiquement.

Options de l'histoire : `--title` (l'accroche), `--subtitle` (unités), `--note "PÉRIODE: texte"` (moments clés),
`--takeaway` (carte de conclusion), `--source` (toujours affichée). Nombres : `--prefix $`, `--suffix`, `--decimals`,
`--number-style compact|full|percent`, `--locale zh` (万 / 亿 / 万亿). `label`, `color` et `emoji` par série
se placent dans un fichier de configuration JSON. Liste complète : [skills/chartreel/references/options.md](skills/chartreel/references/options.md).

## Comment les chiffres restent justes

- Au moment où chaque ligne apparaît à l'écran, chaque valeur est égale à celle du CSV ; entre deux lignes, c'est une
  interpolation linéaire des deux lignes voisines. `tests/test_accuracy.py` le vérifie pour chaque exemple, dans plusieurs
  formats, et contrôle que le classement de la course correspond aux données à chaque ligne.
- Les cellules vides intermédiaires sont interpolées et signalées par `validate` ; rien n'est complété de mémoire.
- Le compteur monte puis s'arrête sur la valeur exacte. La gaufre compte toujours exactement 100 cases (plus fort reste).
- La skill demande à l'agent de récupérer les données d'une source primaire, de calculer les conclusions par du code et de toujours citer la source.

## Fonctionnement

Chaque modèle est une page HTML autonome avec un `renderFrame(t)` déterministe — sans horloge système ni hasard —,
donc une même image est identique dans l'aperçu du navigateur et à l'export. chartreel pilote Chromium sans interface
avec Playwright, capture chaque image et l'envoie à ffmpeg (H.264 `yuv420p`, `+faststart` ; GIF via `palettegen`).
Plusieurs processus de navigateur rendent des segments en parallèle (`--jobs`).

Mesuré sur une machine Linux à 8 cœurs : une course de 12 s en 1080×1920 (360 images) se rend en environ 9 s
avec 4 processus (environ 27 s avec un seul).

## Limites

- Les polices viennent du système. Sans police CJK, le texte chinois s'affiche en carrés ; `chartreel doctor` vous prévient.
  Les émojis de drapeaux ne s'affichent pas sous Windows (sa police d'émojis n'a pas de drapeaux).
- Pas encore de piste audio ni d'images clés personnalisées ; le temps entre deux lignes est uniforme.
- Le modèle `line` reste lisible jusqu'à environ 8 séries ; `share`, jusqu'à environ 10 parts.

## Développement

```bash
pip install -e ".[dev]" && python -m playwright install chromium
pytest -q                       # parsing, accuracy, deterministic frames, smoke renders
bash scripts/make_demos.sh      # regenerate docs/*.gif
python scripts/fetch_worldbank.py   # re-download the example data
```

Voir [CONTRIBUTING.md](CONTRIBUTING.md) et [CHANGELOG.md](CHANGELOG.md).

## Licence

[MIT](LICENSE) © 2026 Xkongai. Données d'exemple : Banque mondiale, Indicateurs du développement dans le monde, CC BY 4.0.
