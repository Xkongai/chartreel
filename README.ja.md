<p align="center">
  <img src="docs/banner.png" alt="chartreel — CSV を入れると、データアニメーション動画が出てくる。世界銀行データの実際のレンダリング：9:16 のバーチャートレース、ラインレース、カウンター、ワッフルチャート" width="100%">
</p>

<h1 align="center">chartreel</h1>

<p align="center">
  <b>CSV を、数字が正確なデータアニメーション短尺動画に変える Agent Skill + CLI。</b><br>
  バーチャートレース、ラインレース、大きな数字のカウンター、構成比の推移 —— MP4 + GIF + カバー画像、9:16 / 16:9、日本語・中国語対応。
</p>

<p align="center">
  <a href="https://github.com/Xkongai/chartreel/actions/workflows/ci.yml"><img src="https://github.com/Xkongai/chartreel/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT"></a>
  <img src="https://img.shields.io/badge/python-3.10%2B-3776AB.svg" alt="Python 3.10+">
  <img src="https://img.shields.io/badge/Agent%20Skill-Claude%20Code%20%7C%20Codex%20%7C%20Cursor-8A2BE2.svg" alt="Agent Skill">
</p>

<p align="center">
  <a href="README.md">English</a> | <a href="README.zh-CN.md">简体中文</a> | <b>日本語</b> | <a href="README.es.md">Español</a> | <a href="README.pt-BR.md">Português (Brasil)</a> | <a href="README.fr.md">Français</a> | <a href="README.de.md">Deutsch</a> | <a href="README.ko.md">한국어</a> | <a href="README.ru.md">Русский</a>
</p>

「世界の経済大国 1990–2024」「中国とインドの人口」のようなデータ動画は、TikTok（抖音）、小紅書、YouTube Shorts、
Reels、X でよく伸びます。ただ、作るには After Effects や Flourish の有料プラン、または大量の matplotlib コードが必要でした。
**chartreel** は AI エージェントにそのためのスキルを与えます。エージェントが実データを探し、ストーリー（フック、山場、結論）を書き、
完成した動画をレンダリングします。画面に出る数字はすべて CSV から来ています。

> **エージェントにこう頼むだけ：**「世界銀行のデータで、1990 年以降の経済規模トップ 10 の縦型バーチャートレースを 15 秒で作って。最後に結論を入れて。」

## ショーケース

以下のアニメーションとフレームはすべて、同梱の[世界銀行サンプル](examples/README.md)（CC BY 4.0）を chartreel で実際にレンダリングしたものです。下に生成コマンドを載せています。

### テンプレート

| バーチャートレース · 16:9 · `dark` | ラインレース · 中国語ラベル · `paper` |
| --- | --- |
| <img src="docs/hero.gif" alt="バーチャートレース · 16:9 · dark" width="100%"> | <img src="docs/line-race.gif" alt="ラインレース · 中国語ラベル · paper" width="100%"> |
| `chartreel render examples/gdp-race.csv -c examples/gdp-race.json -a 16:9 --size 720 -d 7 --intro 0.4 --outro 1.6 --top 8` | `chartreel render examples/population-zh.csv -c examples/population-zh.json -a 16:9 --size 720 -d 8 --outro 1.6` |
| **ビッグナンバー・カウンター · 1:1 · `neon`** | **構成比の変化（ワッフル）· 16:9 · `paper`** |
| <img src="docs/counter.gif" alt="ビッグナンバー・カウンター · 1:1 · neon" width="100%"> | <img src="docs/share.gif" alt="構成比の変化（ワッフル）· 16:9 · paper" width="100%"> |
| `chartreel render examples/china-gdp-counter.csv -c examples/china-gdp-counter.json -a 1:1 --size 720 -d 7 --outro 1.6` | `chartreel render examples/population-share.csv -c examples/population-share.json --theme paper -a 16:9 --size 720 -d 7 --outro 1.6` |

フルサイズのカバー：[9:16 レース](docs/cover-race-9x16.png) · [16:9 ラインレース](docs/cover-line-16x9.png)。

### スタイルプリセット（`--style`）

同じデータ、同じ 15 秒の 9:16 動画で 8 通りの見た目。プリセットはテーマ、最初の約 1.5 秒のフックカード、年カウンター、1 位の装飾、エフェクトをまとめたものです。どのプリセットでも数値は正確なままです（`tests/test_styles.py`）。サムネイルは各 MP4 の 8.25 秒時点のフレームで、次のコマンドで作りました：

```bash
chartreel render examples/gdp-race.csv -c examples/gdp-race.json -d 15 --style STYLE \
  --hook "Who has the world's biggest economy?" --cta "Follow for more data stories"
# all eight at once: bash scripts/make_styles.sh out/styles
```

<table>
<tr><td width="25%" valign="top"><img src="docs/styles/classic.jpg" alt="--style classic" width="100%"><br><b><code>--style classic</code></b><br><sub>標準の見た目、フックなし（<code>--hook</code>/<code>--cta</code> なしでレンダリング）</sub></td><td width="25%" valign="top"><img src="docs/styles/cinematic.jpg" alt="--style cinematic" width="100%"><br><b><code>--style cinematic</code></b><br><sub>シネマ風：レターボックスのフック、金色のグロー、回転する年表示、1 位に王冠、パンチイン</sub></td><td width="25%" valign="top"><img src="docs/styles/news.jpg" alt="--style news" width="100%"><br><b><code>--style news</code></b><br><sub>ニュース番組風：フックのストラップ、順位番号、赤い年バッジ、出典ストラップ</sub></td><td width="25%" valign="top"><img src="docs/styles/editorial.jpg" alt="--style editorial" width="100%"><br><b><code>--style editorial</code></b><br><sub>新聞風：タイプライターのフック、グレーのバー、指定系列を強調（<code>--highlight "China,United States"</code> を追加）</sub></td></tr>
<tr><td width="25%" valign="top"><img src="docs/styles/arcade.jpg" alt="--style arcade" width="100%"><br><b><code>--style arcade</code></b><br><sub>ゲーム風：ネオン、バーがトップ 3 に入ると紙吹雪とパンチイン、▲ 矢印、スピードライン</sub></td><td width="25%" valign="top"><img src="docs/styles/retro.jpg" alt="--style retro" width="100%"><br><b><code>--style retro</code></b><br><sub>VHS 風：走査線、色ずれ文字、PLAY 表示、タイプライターのフック</sub></td><td width="25%" valign="top"><img src="docs/styles/glass.jpg" alt="--style glass" width="100%"><br><b><code>--style glass</code></b><br><sub>グラスモーフィズム：漂うカラーの光、すりガラスのパネル、上部の進行バー</sub></td><td width="25%" valign="top"><img src="docs/styles/bold.jpg" alt="--style bold" width="100%"><br><b><code>--style bold</code></b><br><sub>抖音の大文字風：特大の強調フック、巨大な年表示、順位番号</sub></td></tr>
</table>

8 種類を並べて比較：

<p align="center"><img src="docs/styles-compare.jpg" alt="8 種類を並べて比較" width="100%"></p>

自由な組み合わせも可能です：`--fx bg,vignette,letterbox,scanlines,punch,confetti,trails,arrows,glass`、`--no-fx confetti`、`--year-style roll|row|badge`、`--progress top`、`--hook-style pop|type|strap|bold`。`--audio music.mp3` で権利を持つ音源を追加できます（長さを合わせてフェード。chartreel は音楽を同梱しません）。`chartreel styles` で一覧を表示します。

## インストール

Python 3.10+、ffmpeg、Chromium が必要です（Chromium は Playwright がダウンロードします。インストール済みの Chrome でも動きます）。

**1. CLI**

```bash
pip install "git+https://github.com/Xkongai/chartreel"
python -m playwright install chromium     # skip if Chrome/Chromium is installed
chartreel doctor                          # checks ffmpeg, Chromium and fonts
```

ffmpeg：`brew install ffmpeg`（macOS）· `sudo apt install ffmpeg`（Ubuntu）· `winget install Gyan.FFmpeg`（Windows）。
Linux で日本語・中国語・韓国語を表示するには：`sudo apt install fonts-noto-cjk fonts-noto-color-emoji`。

**2. スキル**（使っているエージェントを選択）

| エージェント | インストール |
| --- | --- |
| Claude Code | `/plugin marketplace add Xkongai/chartreel` の後に `/plugin install chartreel@chartreel` |
| Codex | `git clone https://github.com/Xkongai/chartreel && mkdir -p ~/.agents/skills && cp -r chartreel/skills/chartreel ~/.agents/skills/` |
| Cursor、OpenCode、Gemini CLI など | `npx skills add Xkongai/chartreel -g` |
| `SKILL.md` を読む任意のエージェント | `skills/chartreel/` をそのエージェントのスキルフォルダーにコピー |

手動でコピーしたい場合、Claude Code は `~/.claude/skills/chartreel/` も読み込みます。

## クイックスタート（CLI）

```bash
git clone https://github.com/Xkongai/chartreel && cd chartreel
chartreel render examples/gdp-race.csv -c examples/gdp-race.json -o out/
# out/gdp-race.mp4   1080×1920 H.264, 12 s
# out/gdp-race.gif   540 px wide
# out/gdp-race-cover.png
```

フラグだけでも指定できます：

```bash
chartreel render my.csv --template line --theme paper --aspect 16:9 --duration 15 \
  --title "China vs India" --source "World Bank, CC BY 4.0" --takeaway "India passed China in 2021" \
  --note "2021: India passes China" --locale zh -o out/
```

`chartreel validate my.csv` は先にファイルをチェックし、問題のある行と列を正確に示します。
`chartreel preview my.csv -o out/` は、ブラウザーでシークできる単体の HTML プレーヤーを書き出します。

## テンプレートとテーマ

| テンプレート | 向いている内容 | CSV |
| --- | --- | --- |
| `race` | 時間とともに変わる順位、追い抜き | `year,A,B,C…` |
| `line` | いくつかの系列の成長や交差 | `year,A,B,C…` |
| `counter` | 1 つの大きな数字と「×N 倍」の比較 | `label,value,note` |
| `share` | 全体に占める割合の推移（10×10 ワッフル） | `year,A,B,C…` |

テーマ：`dark`（ダークテック）、`paper`（新聞風、セリフ見出し）、`neon`（発光）。
アスペクト比：`9:16`、`16:9`、`1:1`、`4:5`、`3:4`。縦持ち形式 `year,name,value` は自動で変換されます。

ストーリー用オプション：`--title`（フック）、`--subtitle`（単位）、`--note "時点: テキスト"`（山場）、
`--takeaway`（締めのカード）、`--source`（常に表示）。数値：`--prefix $`、`--suffix`、`--decimals`、
`--number-style compact|full|percent`、`--locale zh`（万 / 亿 / 万亿）。系列ごとの `label`、`color`、`emoji`
は JSON 設定に書きます。全オプション：[skills/chartreel/references/options.md](skills/chartreel/references/options.md)。

## 数字が正確な理由

- 各行が画面に出る瞬間、すべての値は CSV の値と一致し、その間は隣り合う 2 行の直線補間です。
  `tests/test_accuracy.py` は全サンプルを複数のアスペクト比で検査し、レースの順位が各行でデータと一致することも確認します。
- 途中の空欄は補間され、`validate` が報告します。記憶で埋めることはありません。
- カウンターはカウントアップした後、正確な値で止まります。ワッフルは常にちょうど 100 マス（最大剰余法）です。
- スキルはエージェントに、一次情報源からデータを取得し、結論をコードで計算し、出典を必ず示すよう指示します。

## 仕組み

各テンプレートは、決定的な `renderFrame(t)` を持つ単体の HTML ページです。時計も乱数も使わないため、
ブラウザーのプレビューと書き出しで同じフレームがまったく同じに描かれます。chartreel は Playwright でヘッドレス Chromium を動かし、
フレームごとにキャプチャして ffmpeg に渡します（H.264 `yuv420p`、`+faststart`。GIF は `palettegen`）。
複数のブラウザーワーカーが区間ごとに並列でレンダリングします（`--jobs`）。

8 コアの Linux マシンでの実測：12 秒・1080×1920 のレース（360 フレーム）は、4 ワーカーで約 9 秒（1 ワーカーで約 27 秒）。

## 制限事項

- フォントはシステムのものを使います。CJK フォントがないと文字が四角になります。`chartreel doctor` が警告します。
  Windows では国旗の絵文字が表示されません（システムの絵文字フォントに国旗がないため）。
- 音楽や効果音は同梱していません（`--audio` で自分の音源を追加できます）。フレーム単位のカスタムキーフレームはまだありません。行と行の間隔は一定です。
- `line` は約 8 系列まで、`share` は約 10 項目までが読みやすい目安です。

## 開発

```bash
pip install -e ".[dev]" && python -m playwright install chromium
pytest -q                       # parsing, accuracy, deterministic frames, smoke renders
bash scripts/make_demos.sh      # regenerate docs/*.gif
bash scripts/make_styles.sh out/styles    # the eight style presets, 9:16 15 s MP4 + cover
python scripts/make_gallery.py out/styles # docs/styles/*.jpg and docs/styles-compare.jpg
python scripts/make_banner.py             # docs/banner.png and docs/banner@2x.png
python scripts/fetch_worldbank.py   # re-download the example data
```

[CONTRIBUTING.md](CONTRIBUTING.md) と [CHANGELOG.md](CHANGELOG.md) をご覧ください。

## ライセンス

[MIT](LICENSE) © 2026 Xkongai。サンプルデータ：世界銀行「世界開発指標（WDI）」、CC BY 4.0。
