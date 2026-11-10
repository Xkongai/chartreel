<p align="center">
  <img src="docs/banner.png" alt="chartreel — на входе CSV, на выходе анимированное видео с данными. Настоящие рендеры данных Всемирного банка: гонка столбцов 9:16, гонка линий, счётчик и вафельная диаграмма" width="100%">
</p>

<h1 align="center">chartreel</h1>

<p align="center">
  <b>Agent Skill + CLI, который превращает CSV в короткое видео с анимацией данных и точными цифрами.</b><br>
  Гонка столбцов, гонка линий, счётчик больших чисел и сдвиг долей — MP4 + GIF + обложка, 9:16 или 16:9, с поддержкой китайского.
</p>

<p align="center">
  <a href="https://github.com/Xkongai/chartreel/actions/workflows/ci.yml"><img src="https://github.com/Xkongai/chartreel/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT"></a>
  <img src="https://img.shields.io/badge/python-3.10%2B-3776AB.svg" alt="Python 3.10+">
  <img src="https://img.shields.io/badge/Agent%20Skill-Claude%20Code%20%7C%20Codex%20%7C%20Cursor-8A2BE2.svg" alt="Agent Skill">
</p>

<p align="center">
  <a href="README.md">English</a> | <a href="README.zh-CN.md">简体中文</a> | <a href="README.ja.md">日本語</a> | <a href="README.es.md">Español</a> | <a href="README.pt-BR.md">Português (Brasil)</a> | <a href="README.fr.md">Français</a> | <a href="README.de.md">Deutsch</a> | <a href="README.ko.md">한국어</a> | <b>Русский</b>
</p>

Видео с данными — «крупнейшие экономики мира, 1990–2024», «Китай против Индии: население» — хорошо заходят в
Douyin, Xiaohongshu, YouTube Shorts, Reels и X. Обычно для такого ролика нужен After Effects, подписка Flourish или
ноутбук, полный кода на matplotlib. **chartreel** даёт вашему ИИ-агенту навык для этого: агент находит реальные данные,
пишет сюжет (зацепка, ключевые моменты, вывод) и рендерит готовый клип. Каждое число на экране берётся из вашего CSV.

> **Попросите агента:** «Сделай 15-секундную вертикальную гонку столбцов 10 крупнейших экономик с 1990 года
> по данным Всемирного банка и с выводом в конце».

## Примеры

Каждый ролик и кадр ниже — настоящий рендер chartreel на встроенных [примерах Всемирного банка](examples/README.md) (CC BY 4.0); команда, которой он сделан, указана под ним.

### Шаблоны

| Гонка столбцов · 16:9 · `dark` | Гонка линий · подписи на китайском · `paper` |
| --- | --- |
| <img src="docs/hero.gif" alt="Гонка столбцов · 16:9 · dark" width="100%"> | <img src="docs/line-race.gif" alt="Гонка линий · подписи на китайском · paper" width="100%"> |
| `chartreel render examples/gdp-race.csv -c examples/gdp-race.json -a 16:9 --size 720 -d 7 --intro 0.4 --outro 1.6 --top 8` | `chartreel render examples/population-zh.csv -c examples/population-zh.json -a 16:9 --size 720 -d 8 --outro 1.6` |
| **Счётчик большого числа · 1:1 · `neon`** | **Сдвиг долей (вафля) · 16:9 · `paper`** |
| <img src="docs/counter.gif" alt="Счётчик большого числа · 1:1 · neon" width="100%"> | <img src="docs/share.gif" alt="Сдвиг долей (вафля) · 16:9 · paper" width="100%"> |
| `chartreel render examples/china-gdp-counter.csv -c examples/china-gdp-counter.json -a 1:1 --size 720 -d 7 --outro 1.6` | `chartreel render examples/population-share.csv -c examples/population-share.json --theme paper -a 16:9 --size 720 -d 7 --outro 1.6` |

Обложки в полном размере: [гонка 9:16](docs/cover-race-9x16.png) · [гонка линий 16:9](docs/cover-line-16x9.png).

### Готовые стили (`--style`)

Те же данные, то же 15-секундное видео 9:16, восемь стилей. Стиль объединяет тему, карточку-хук на первые ~1,5 с, счётчик года, выделение лидера и эффекты. Цифры остаются точными в каждом стиле (`tests/test_styles.py`). Миниатюры — кадр на 8,25 с каждого MP4, сделанного так:

```bash
chartreel render examples/gdp-race.csv -c examples/gdp-race.json -d 15 --style STYLE \
  --hook "Who has the world's biggest economy?" --cta "Follow for more data stories"
# all eight at once: bash scripts/make_styles.sh out/styles
```

<table>
<tr><td width="25%" valign="top"><img src="docs/styles/classic.jpg" alt="--style classic" width="100%"><br><b><code>--style classic</code></b><br><sub>Стиль по умолчанию, без хука (рендер без <code>--hook</code>/<code>--cta</code>)</sub></td><td width="25%" valign="top"><img src="docs/styles/cinematic.jpg" alt="--style cinematic" width="100%"><br><b><code>--style cinematic</code></b><br><sub>Хук с киношными полосами, золотое свечение, прокрутка года, корона у лидера, наезд камеры</sub></td><td width="25%" valign="top"><img src="docs/styles/news.jpg" alt="--style news" width="100%"><br><b><code>--style news</code></b><br><sub>Телевизионные плашки: хук-плашка, номера мест, красная плашка года, плашка источника</sub></td><td width="25%" valign="top"><img src="docs/styles/editorial.jpg" alt="--style editorial" width="100%"><br><b><code>--style editorial</code></b><br><sub>Хук печатной машинкой, серые столбцы, выделенные ряды (плюс <code>--highlight "China,United States"</code>)</sub></td></tr>
<tr><td width="25%" valign="top"><img src="docs/styles/arcade.jpg" alt="--style arcade" width="100%"><br><b><code>--style arcade</code></b><br><sub>Неон, конфетти и наезд, когда столбец входит в топ-3, стрелки ▲, полосы скорости</sub></td><td width="25%" valign="top"><img src="docs/styles/retro.jpg" alt="--style retro" width="100%"><br><b><code>--style retro</code></b><br><sub>Строки VHS, хроматический текст, метка PLAY, хук печатной машинкой</sub></td><td width="25%" valign="top"><img src="docs/styles/glass.jpg" alt="--style glass" width="100%"><br><b><code>--style glass</code></b><br><sub>Плывущие цветные пятна, матовая панель, полоса прогресса сверху</sub></td><td width="25%" valign="top"><img src="docs/styles/bold.jpg" alt="--style bold" width="100%"><br><b><code>--style bold</code></b><br><sub>Крупный текст в стиле Douyin: огромные выделенные слова хука, большой год, номера мест</sub></td></tr>
</table>

Все восемь рядом:

<p align="center"><img src="docs/styles-compare.jpg" alt="Все восемь рядом" width="100%"></p>

Можно собрать свой: `--fx bg,vignette,letterbox,scanlines,punch,confetti,trails,arrows,glass`, `--no-fx confetti`, `--year-style roll|row|badge`, `--progress top`, `--hook-style pop|type|strap|bold`. `--audio music.mp3` добавляет вашу дорожку, на которую у вас есть права (обрезается и плавно появляется/затухает; chartreel не содержит музыки). `chartreel styles` покажет всё.

## Установка

Нужны Python 3.10+, ffmpeg и Chromium (его скачивает Playwright; подойдёт и уже установленный Chrome).

**1. CLI**

```bash
pip install "git+https://github.com/Xkongai/chartreel"
python -m playwright install chromium     # skip if Chrome/Chromium is installed
chartreel doctor                          # checks ffmpeg, Chromium and fonts
```

ffmpeg: `brew install ffmpeg` (macOS) · `sudo apt install ffmpeg` (Ubuntu) · `winget install Gyan.FFmpeg` (Windows).
Для китайского, японского и корейского текста в Linux: `sudo apt install fonts-noto-cjk fonts-noto-color-emoji`.

**2. Навык** (выберите своего агента)

| Агент | Установка |
| --- | --- |
| Claude Code | `/plugin marketplace add Xkongai/chartreel`, затем `/plugin install chartreel@chartreel` |
| Codex | `git clone https://github.com/Xkongai/chartreel && mkdir -p ~/.agents/skills && cp -r chartreel/skills/chartreel ~/.agents/skills/` |
| Cursor, OpenCode, Gemini CLI и другие | `npx skills add Xkongai/chartreel -g` |
| Любой агент, читающий `SKILL.md` | скопируйте `skills/chartreel/` в папку навыков агента |

Claude Code также читает `~/.claude/skills/chartreel/`, если вы предпочитаете скопировать папку вручную.

## Быстрый старт (CLI)

```bash
git clone https://github.com/Xkongai/chartreel && cd chartreel
chartreel render examples/gdp-race.csv -c examples/gdp-race.json -o out/
# out/gdp-race.mp4   1080×1920 H.264, 12 s
# out/gdp-race.gif   540 px wide
# out/gdp-race-cover.png
```

Или только с флагами:

```bash
chartreel render my.csv --template line --theme paper --aspect 16:9 --duration 15 \
  --title "China vs India" --source "World Bank, CC BY 4.0" --takeaway "India passed China in 2021" \
  --note "2021: India passes China" --locale zh -o out/
```

`chartreel validate my.csv` сначала проверяет файл и указывает точную строку и столбец любой ошибки.
`chartreel preview my.csv -o out/` создаёт самостоятельный HTML-плеер, который можно перематывать в браузере.

## Шаблоны и темы

| Шаблон | Для чего | CSV |
| --- | --- | --- |
| `race` | рейтинги во времени, обгоны | `year,A,B,C…` |
| `line` | несколько рядов, которые растут или пересекаются | `year,A,B,C…` |
| `counter` | одно большое число, затем сравнения «×N» | `label,value,note` |
| `share` | изменение долей целого (вафля 10×10) | `year,A,B,C…` |

Темы: `dark` (тёмный техно), `paper` (газета, заголовок с засечками), `neon` (свечение).
Форматы кадра: `9:16`, `16:9`, `1:1`, `4:5`, `3:4`. Длинный формат `year,name,value` преобразуется автоматически.

Параметры сюжета: `--title` (зацепка), `--subtitle` (единицы), `--note "ПЕРИОД: текст"` (ключевые моменты),
`--takeaway` (финальная карточка), `--source` (показывается всегда). Числа: `--prefix $`, `--suffix`, `--decimals`,
`--number-style compact|full|percent`, `--locale zh` (万 / 亿 / 万亿). `label`, `color` и `emoji` для каждого ряда
задаются в JSON-конфиге. Полный список: [skills/chartreel/references/options.md](skills/chartreel/references/options.md).

## Почему цифрам можно верить

- В момент, когда строка на экране, каждое значение равно значению из CSV; между строками — линейная интерполяция
  двух соседних строк. `tests/test_accuracy.py` проверяет это для каждого примера в нескольких форматах кадра и сверяет,
  что порядок в гонке совпадает с данными в каждой строке.
- Пустые ячейки в середине интерполируются, и `validate` сообщает о них; ничего не дописывается «по памяти».
- Счётчик досчитывает и останавливается на точном значении. В вафле всегда ровно 100 клеток (метод наибольшего остатка).
- Навык требует от агента брать данные из первоисточника, считать выводы кодом и всегда указывать источник.

## Как это работает

Каждый шаблон — самостоятельная HTML-страница с детерминированной функцией `renderFrame(t)`: без системных часов и
случайности, поэтому один и тот же кадр одинаково выглядит в превью браузера и при экспорте. chartreel управляет
headless Chromium через Playwright, снимает каждый кадр и передаёт его в ffmpeg (H.264 `yuv420p`, `+faststart`;
GIF через `palettegen`). Несколько процессов браузера рендерят участки параллельно (`--jobs`).

Замер на 8-ядерной Linux-машине: 12-секундная гонка 1080×1920 (360 кадров) рендерится примерно за 9 с
с 4 процессами (примерно за 27 с с одним).

## Ограничения

- Шрифты берутся из системы. Без CJK-шрифта китайский текст отображается квадратиками; `chartreel doctor` предупредит.
  Эмодзи флагов не отображаются в Windows (в системном шрифте эмодзи нет флагов).
- Музыки и звуковых эффектов в комплекте нет (свою дорожку можно добавить через `--audio`), своих покадровых ключевых кадров пока тоже нет; время между строками одинаковое.
- Шаблон `line` хорошо читается примерно до 8 рядов, `share` — примерно до 10 частей.

## Разработка

```bash
pip install -e ".[dev]" && python -m playwright install chromium
pytest -q                       # parsing, accuracy, deterministic frames, smoke renders
bash scripts/make_demos.sh      # regenerate docs/*.gif
bash scripts/make_styles.sh out/styles    # the eight style presets, 9:16 15 s MP4 + cover
python scripts/make_gallery.py out/styles # docs/styles/*.jpg and docs/styles-compare.jpg
python scripts/make_banner.py             # docs/banner.png and docs/banner@2x.png
python scripts/fetch_worldbank.py   # re-download the example data
```

См. [CONTRIBUTING.md](CONTRIBUTING.md) и [CHANGELOG.md](CHANGELOG.md).

## Лицензия

[MIT](LICENSE) © 2026 Xkongai. Данные примеров: Всемирный банк, World Development Indicators, CC BY 4.0.
