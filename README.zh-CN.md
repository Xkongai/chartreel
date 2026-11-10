<p align="center">
  <img src="docs/banner.png" alt="chartreel —— 输入 CSV，输出数据动画视频。全部是用世界银行数据真实渲染的画面：9:16 动态排行榜、折线竞赛、数字计数器和方格占比图" width="100%">
</p>

<h1 align="center">chartreel</h1>

<p align="center">
  <b>一个 Agent Skill + 命令行工具：把一份 CSV 变成数字准确的数据动画短视频。</b><br>
  动态排行榜、折线竞赛、大数字滚动、占比变化 —— 输出 MP4 + GIF + 封面，竖屏 9:16 或横屏 16:9，原生支持中文。
</p>

<p align="center">
  <a href="https://github.com/Xkongai/chartreel/actions/workflows/ci.yml"><img src="https://github.com/Xkongai/chartreel/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT"></a>
  <img src="https://img.shields.io/badge/python-3.10%2B-3776AB.svg" alt="Python 3.10+">
  <img src="https://img.shields.io/badge/Agent%20Skill-Claude%20Code%20%7C%20Codex%20%7C%20Cursor-8A2BE2.svg" alt="Agent Skill">
</p>

<p align="center">
  <a href="README.md">English</a> | <b>简体中文</b> | <a href="README.ja.md">日本語</a> | <a href="README.es.md">Español</a> | <a href="README.pt-BR.md">Português (Brasil)</a> | <a href="README.fr.md">Français</a> | <a href="README.de.md">Deutsch</a> | <a href="README.ko.md">한국어</a> | <a href="README.ru.md">Русский</a>
</p>

「1990–2024 全球最大经济体」「中印人口之争」这类数据视频，在抖音、小红书、YouTube Shorts、Reels 和 X 上都很受欢迎。
但做一条通常要用 After Effects、订阅 Flourish，或者写一大堆 matplotlib 代码。**chartreel** 给你的 AI 助手装上一个专门的技能：
它会去找真实数据、写好故事线（开头钩子、关键节点、结尾结论），然后直接渲染出成片。
画面上的每一个数字都来自你的 CSV。

> **直接对你的 AI 助手说：**「用世界银行数据，做一条 15 秒的竖屏动态排行榜，展示 1990 年以来前 10 大经济体，结尾加一句结论。」

## 效果展示

下面每段动图和每一帧，都是 chartreel 用仓库自带的[世界银行示例数据](examples/README.md)（CC BY 4.0）真实渲染出来的，生成命令就写在下面。

### 模板

| 动态排行榜 · 16:9 · `dark` | 折线竞赛 · 中文标签 · `paper` |
| --- | --- |
| <img src="docs/hero.gif" alt="动态排行榜 · 16:9 · dark" width="100%"> | <img src="docs/line-race.gif" alt="折线竞赛 · 中文标签 · paper" width="100%"> |
| `chartreel render examples/gdp-race.csv -c examples/gdp-race.json -a 16:9 --size 720 -d 7 --intro 0.4 --outro 1.6 --top 8` | `chartreel render examples/population-zh.csv -c examples/population-zh.json -a 16:9 --size 720 -d 8 --outro 1.6` |
| **大数字计数器 · 1:1 · `neon`** | **占比变化（方格图）· 16:9 · `paper`** |
| <img src="docs/counter.gif" alt="大数字计数器 · 1:1 · neon" width="100%"> | <img src="docs/share.gif" alt="占比变化（方格图）· 16:9 · paper" width="100%"> |
| `chartreel render examples/china-gdp-counter.csv -c examples/china-gdp-counter.json -a 1:1 --size 720 -d 7 --outro 1.6` | `chartreel render examples/population-share.csv -c examples/population-share.json --theme paper -a 16:9 --size 720 -d 7 --outro 1.6` |

原尺寸封面：[9:16 排行榜](docs/cover-race-9x16.png) · [16:9 折线竞赛](docs/cover-line-16x9.png)。

### 风格预设（`--style`）

同一份数据、同一条 15 秒 9:16 视频，八种风格。每个预设包含一套主题、前 1.5 秒左右的开场钩子卡、年份计数器、第一名的装饰和一组特效。所有预设里的数字都与数据完全一致（见 `tests/test_styles.py`）。缩略图取自每条 MP4 第 8.25 秒的画面，生成命令：

```bash
chartreel render examples/gdp-race.csv -c examples/gdp-race.json -d 15 --style STYLE \
  --hook "Who has the world's biggest economy?" --cta "Follow for more data stories"
# all eight at once: bash scripts/make_styles.sh out/styles
```

<table>
<tr><td width="25%" valign="top"><img src="docs/styles/classic.jpg" alt="--style classic" width="100%"><br><b><code>--style classic</code></b><br><sub>默认风格，无开场钩子（渲染时未加 <code>--hook</code>/<code>--cta</code>）</sub></td><td width="25%" valign="top"><img src="docs/styles/cinematic.jpg" alt="--style cinematic" width="100%"><br><b><code>--style cinematic</code></b><br><sub>电影感：黑边开场、金色光晕、滚动年份、第一名皇冠、推镜头</sub></td><td width="25%" valign="top"><img src="docs/styles/news.jpg" alt="--style news" width="100%"><br><b><code>--style news</code></b><br><sub>新闻台风格：开场标题条、排名数字、红色年份牌、来源条</sub></td><td width="25%" valign="top"><img src="docs/styles/editorial.jpg" alt="--style editorial" width="100%"><br><b><code>--style editorial</code></b><br><sub>报刊风格：打字机开场、灰色柱子、高亮指定系列（另加 <code>--highlight "China,United States"</code>）</sub></td></tr>
<tr><td width="25%" valign="top"><img src="docs/styles/arcade.jpg" alt="--style arcade" width="100%"><br><b><code>--style arcade</code></b><br><sub>游戏风：霓虹、柱子冲进前三时撒彩带并推镜头、▲ 上升箭头、速度线</sub></td><td width="25%" valign="top"><img src="docs/styles/retro.jpg" alt="--style retro" width="100%"><br><b><code>--style retro</code></b><br><sub>复古录像带：扫描线、色差文字、PLAY 标记、打字机开场</sub></td><td width="25%" valign="top"><img src="docs/styles/glass.jpg" alt="--style glass" width="100%"><br><b><code>--style glass</code></b><br><sub>玻璃拟态：流动色块背景、磨砂图表面板、顶部进度条</sub></td><td width="25%" valign="top"><img src="docs/styles/bold.jpg" alt="--style bold" width="100%"><br><b><code>--style bold</code></b><br><sub>抖音大字风：超大高亮开场字、巨大年份、排名数字</sub></td></tr>
</table>

八种风格并排对比：

<p align="center"><img src="docs/styles-compare.jpg" alt="八种风格并排对比" width="100%"></p>

也可以自由组合：`--fx bg,vignette,letterbox,scanlines,punch,confetti,trails,arrows,glass`、`--no-fx confetti`、`--year-style roll|row|badge`、`--progress top`、`--hook-style pop|type|strap|bold`。`--audio music.mp3` 可以给视频配上你有版权的音乐（自动裁剪长度并淡入淡出；chartreel 不附带任何音乐）。`chartreel styles` 会列出全部选项。

## 安装

需要 Python 3.10+、ffmpeg 和 Chromium（Playwright 会自动下载；已经装了 Chrome 也可以）。

**1. 命令行工具**

```bash
pip install "git+https://github.com/Xkongai/chartreel"
python -m playwright install chromium     # skip if Chrome/Chromium is installed
chartreel doctor                          # checks ffmpeg, Chromium and fonts
```

ffmpeg：`brew install ffmpeg`（macOS）· `sudo apt install ffmpeg`（Ubuntu）· `winget install Gyan.FFmpeg`（Windows）。
在 Linux 上显示中文、日文、韩文：`sudo apt install fonts-noto-cjk fonts-noto-color-emoji`。

**2. 技能**（按你用的助手选择）

| 助手 | 安装方式 |
| --- | --- |
| Claude Code | `/plugin marketplace add Xkongai/chartreel`，然后 `/plugin install chartreel@chartreel` |
| Codex | `git clone https://github.com/Xkongai/chartreel && mkdir -p ~/.agents/skills && cp -r chartreel/skills/chartreel ~/.agents/skills/` |
| Cursor、OpenCode、Gemini CLI 等 | `npx skills add Xkongai/chartreel -g` |
| 任何读取 `SKILL.md` 的助手 | 把 `skills/chartreel/` 复制到该助手的技能目录 |

如果你想手动复制，Claude Code 也会读取 `~/.claude/skills/chartreel/`。

## 快速上手（命令行）

```bash
git clone https://github.com/Xkongai/chartreel && cd chartreel
chartreel render examples/gdp-race.csv -c examples/gdp-race.json -o out/
# out/gdp-race.mp4   1080×1920 H.264, 12 s
# out/gdp-race.gif   540 px wide
# out/gdp-race-cover.png
```

也可以只用参数：

```bash
chartreel render my.csv --template line --theme paper --aspect 16:9 --duration 15 \
  --title "China vs India" --source "World Bank, CC BY 4.0" --takeaway "India passed China in 2021" \
  --note "2021: India passes China" --locale zh -o out/
```

`chartreel validate my.csv` 会先检查文件，有问题时精确指出是哪一行、哪一列。
`chartreel preview my.csv -o out/` 会生成一个独立的 HTML 播放器，可以在浏览器里拖动进度条预览。

## 模板和主题

| 模板 | 适合 | CSV |
| --- | --- | --- |
| `race` | 随时间变化的排名、反超 | `year,A,B,C…` |
| `line` | 几条数据的增长或交叉 | `year,A,B,C…` |
| `counter` | 一个震撼的大数字，再做「×N 倍」对比 | `label,value,note` |
| `share` | 整体中各部分的占比变化（10×10 方格图） | `year,A,B,C…` |

主题：`dark`（深色科技）、`paper`（报纸风，衬线标题）、`neon`（霓虹发光）。
画幅：`9:16`、`16:9`、`1:1`、`4:5`、`3:4`。长表格式 `year,name,value` 会自动转换。

故事相关参数：`--title`（开头钩子）、`--subtitle`（单位说明）、`--note "时间点: 文字"`（关键节点）、
`--takeaway`（结尾结论卡片）、`--source`（始终显示的数据来源）。数字格式：`--prefix $`、`--suffix`、`--decimals`、
`--number-style compact|full|percent`、`--locale zh`（万 / 亿 / 万亿）。每条数据的 `label`、`color` 和 `emoji`
写在 JSON 配置里。完整列表见 [skills/chartreel/references/options.md](skills/chartreel/references/options.md)。

## 数字为什么可信

- 每一行数据出现在画面上的那一刻，所有数值都等于 CSV 里的值；两行之间是相邻两行的直线插值。
  `tests/test_accuracy.py` 会在多种画幅下检查每个示例，并检查排行榜在每一行的名次都和数据一致。
- 中间的空单元格会被插值，并由 `validate` 报告出来；不会凭记忆补任何数字。
- 大数字先滚动计数，再停在精确值上。方格图永远正好 100 格（最大余数法）。
- 技能会要求 AI 助手从一手来源获取数据、用代码计算结论，并始终标注来源。

## 工作原理

每个模板都是一个独立的 HTML 页面，带有确定性的 `renderFrame(t)` —— 不依赖系统时钟、没有随机数 ——
所以同一帧在浏览器预览和导出时完全一样。chartreel 用 Playwright 驱动无头 Chromium，逐帧截图，
再交给 ffmpeg（H.264 `yuv420p`、`+faststart`；GIF 用 `palettegen` 生成）。多个浏览器进程会并行渲染不同片段（`--jobs`）。

在一台 8 核 Linux 机器上实测：一条 12 秒 1080×1920 的排行榜（360 帧），4 个进程约 9 秒渲染完（单进程约 27 秒）。

## 已知限制

- 字体来自系统。没有中日韩字体时，中文会显示成方框；`chartreel doctor` 会提醒你。
  Windows 上不显示国旗 emoji（系统 emoji 字体不含国旗）。
- 不附带音乐和音效（可用 `--audio` 加入你自己的音轨），暂不支持自定义逐帧关键帧；每两行之间的时长是均匀的。
- `line` 模板建议不超过约 8 条线；`share` 建议不超过约 10 个部分。

## 开发

```bash
pip install -e ".[dev]" && python -m playwright install chromium
pytest -q                       # parsing, accuracy, deterministic frames, smoke renders
bash scripts/make_demos.sh      # regenerate docs/*.gif
bash scripts/make_styles.sh out/styles    # the eight style presets, 9:16 15 s MP4 + cover
python scripts/make_gallery.py out/styles # docs/styles/*.jpg and docs/styles-compare.jpg
python scripts/make_banner.py             # docs/banner.png and docs/banner@2x.png
python scripts/fetch_worldbank.py   # re-download the example data
```

参见 [CONTRIBUTING.md](CONTRIBUTING.md) 和 [CHANGELOG.md](CHANGELOG.md)。

## 许可证

[MIT](LICENSE) © 2026 Xkongai。示例数据：世界银行《世界发展指标》，CC BY 4.0。
