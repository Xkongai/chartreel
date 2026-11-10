<p align="center">
  <img src="docs/hero.gif" alt="chartreel 动态排行榜：1990–2024 年全球最大经济体，世界银行数据" width="100%">
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

| 折线竞赛（中文标签，`paper`） | 大数字滚动（`neon`） |
| --- | --- |
| <img src="docs/line-race.gif" alt="折线竞赛：1960–2024 年中印人口" width="100%"> | <img src="docs/counter.gif" alt="大数字滚动：中国 GDP 1980、2000、2024" width="100%"> |
| **占比变化（`paper`）** | **竖屏 9:16，适合抖音 / Shorts（`neon`）** |
| <img src="docs/share.gif" alt="方格图：世界人口按地区的占比" width="100%"> | <img src="docs/vertical.gif" alt="竖屏动态排行榜" width="45%"> |

原尺寸封面：[9:16 排行榜](docs/cover-race-9x16.png) · [16:9 折线竞赛](docs/cover-line-16x9.png)。
所有演示都使用[世界银行数据（CC BY 4.0）](examples/README.md)。

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
- 暂不支持音轨和自定义逐帧关键帧；每两行之间的时长是均匀的。
- `line` 模板建议不超过约 8 条线；`share` 建议不超过约 10 个部分。

## 开发

```bash
pip install -e ".[dev]" && python -m playwright install chromium
pytest -q                       # parsing, accuracy, deterministic frames, smoke renders
bash scripts/make_demos.sh      # regenerate docs/*.gif
python scripts/fetch_worldbank.py   # re-download the example data
```

参见 [CONTRIBUTING.md](CONTRIBUTING.md) 和 [CHANGELOG.md](CHANGELOG.md)。

## 许可证

[MIT](LICENSE) © 2026 Xkongai。示例数据：世界银行《世界发展指标》，CC BY 4.0。
