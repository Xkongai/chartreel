<p align="center">
  <img src="docs/banner.png" alt="chartreel — CSV를 넣으면 데이터 애니메이션 영상이 나옵니다. 세계은행 데이터로 실제 렌더링한 화면: 9:16 바 차트 레이스, 라인 레이스, 카운터, 와플 차트" width="100%">
</p>

<h1 align="center">chartreel</h1>

<p align="center">
  <b>CSV 하나를 숫자가 정확한 데이터 애니메이션 숏폼 영상으로 바꿔 주는 Agent Skill + CLI.</b><br>
  바 차트 레이스, 라인 레이스, 큰 숫자 카운터, 비중 변화 — MP4 + GIF + 커버, 9:16 또는 16:9, 한중일 문자 지원.
</p>

<p align="center">
  <a href="https://github.com/Xkongai/chartreel/actions/workflows/ci.yml"><img src="https://github.com/Xkongai/chartreel/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT"></a>
  <img src="https://img.shields.io/badge/python-3.10%2B-3776AB.svg" alt="Python 3.10+">
  <img src="https://img.shields.io/badge/Agent%20Skill-Claude%20Code%20%7C%20Codex%20%7C%20Cursor-8A2BE2.svg" alt="Agent Skill">
</p>

<p align="center">
  <a href="README.md">English</a> | <a href="README.zh-CN.md">简体中文</a> | <a href="README.ja.md">日本語</a> | <a href="README.es.md">Español</a> | <a href="README.pt-BR.md">Português (Brasil)</a> | <a href="README.fr.md">Français</a> | <a href="README.de.md">Deutsch</a> | <b>한국어</b> | <a href="README.ru.md">Русский</a>
</p>

"세계 최대 경제국 1990–2024", "중국 vs 인도 인구" 같은 데이터 영상은 더우인, 샤오훙수, YouTube Shorts, Reels, X에서
반응이 좋습니다. 하지만 하나 만들려면 보통 After Effects나 Flourish 구독, 혹은 matplotlib 코드가 가득한 노트북이 필요합니다.
**chartreel**은 AI 에이전트에게 이를 위한 스킬을 줍니다. 에이전트가 실제 데이터를 찾고, 스토리(훅, 핵심 장면, 결론)를 쓰고,
완성된 클립을 렌더링합니다. 화면의 모든 숫자는 여러분의 CSV에서 나옵니다.

> **에이전트에게 이렇게 말하세요:** "세계은행 데이터로 1990년 이후 상위 10개 경제국의 15초짜리 세로형 바 차트 레이스를 만들고,
> 마지막에 결론을 넣어 줘."

## 쇼케이스

아래의 모든 영상과 프레임은 함께 제공되는 [세계은행 예제](examples/README.md)(CC BY 4.0)를 chartreel로 실제 렌더링한 것이며, 아래에 만든 명령을 적어 두었습니다.

### 템플릿

| 바 차트 레이스 · 16:9 · `dark` | 라인 레이스 · 중국어 라벨 · `paper` |
| --- | --- |
| <img src="docs/hero.gif" alt="바 차트 레이스 · 16:9 · dark" width="100%"> | <img src="docs/line-race.gif" alt="라인 레이스 · 중국어 라벨 · paper" width="100%"> |
| `chartreel render examples/gdp-race.csv -c examples/gdp-race.json -a 16:9 --size 720 -d 7 --intro 0.4 --outro 1.6 --top 8` | `chartreel render examples/population-zh.csv -c examples/population-zh.json -a 16:9 --size 720 -d 8 --outro 1.6` |
| **큰 숫자 카운터 · 1:1 · `neon`** | **비중 변화(와플) · 16:9 · `paper`** |
| <img src="docs/counter.gif" alt="큰 숫자 카운터 · 1:1 · neon" width="100%"> | <img src="docs/share.gif" alt="비중 변화(와플) · 16:9 · paper" width="100%"> |
| `chartreel render examples/china-gdp-counter.csv -c examples/china-gdp-counter.json -a 1:1 --size 720 -d 7 --outro 1.6` | `chartreel render examples/population-share.csv -c examples/population-share.json --theme paper -a 16:9 --size 720 -d 7 --outro 1.6` |

원본 크기 커버: [9:16 레이스](docs/cover-race-9x16.png) · [16:9 라인 레이스](docs/cover-line-16x9.png).

### 스타일 프리셋 (`--style`)

같은 데이터, 같은 15초 9:16 영상, 여덟 가지 룩. 프리셋은 테마, 처음 약 1.5초의 훅 카드, 연도 카운터, 1위 장식, 효과를 묶은 것입니다. 모든 프리셋에서 숫자는 정확하게 유지됩니다(`tests/test_styles.py`). 썸네일은 각 MP4의 8.25초 프레임이며 다음 명령으로 만들었습니다:

```bash
chartreel render examples/gdp-race.csv -c examples/gdp-race.json -d 15 --style STYLE \
  --hook "Who has the world's biggest economy?" --cta "Follow for more data stories"
# all eight at once: bash scripts/make_styles.sh out/styles
```

<table>
<tr><td width="25%" valign="top"><img src="docs/styles/classic.jpg" alt="--style classic" width="100%"><br><b><code>--style classic</code></b><br><sub>기본 룩, 훅 없음(<code>--hook</code>/<code>--cta</code> 없이 렌더링)</sub></td><td width="25%" valign="top"><img src="docs/styles/cinematic.jpg" alt="--style cinematic" width="100%"><br><b><code>--style cinematic</code></b><br><sub>레터박스 훅, 금빛 글로우, 굴러가는 연도, 1위 왕관, 펀치 인</sub></td><td width="25%" valign="top"><img src="docs/styles/news.jpg" alt="--style news" width="100%"><br><b><code>--style news</code></b><br><sub>TV 뉴스 자막: 훅 띠, 순위 번호, 빨간 연도 배지, 출처 띠</sub></td><td width="25%" valign="top"><img src="docs/styles/editorial.jpg" alt="--style editorial" width="100%"><br><b><code>--style editorial</code></b><br><sub>타자기 훅, 회색 막대, 강조할 시리즈(<code>--highlight "China,United States"</code> 추가)</sub></td></tr>
<tr><td width="25%" valign="top"><img src="docs/styles/arcade.jpg" alt="--style arcade" width="100%"><br><b><code>--style arcade</code></b><br><sub>네온, 막대가 3위 안에 들면 색종이와 펀치 인, ▲ 화살표, 속도선</sub></td><td width="25%" valign="top"><img src="docs/styles/retro.jpg" alt="--style retro" width="100%"><br><b><code>--style retro</code></b><br><sub>VHS 주사선, 색수차 글자, PLAY 표시, 타자기 훅</sub></td><td width="25%" valign="top"><img src="docs/styles/glass.jpg" alt="--style glass" width="100%"><br><b><code>--style glass</code></b><br><sub>떠다니는 색 번짐, 반투명 유리 패널, 상단 진행 막대</sub></td><td width="25%" valign="top"><img src="docs/styles/bold.jpg" alt="--style bold" width="100%"><br><b><code>--style bold</code></b><br><sub>더우인식 큰 글자: 크게 강조한 훅 단어, 거대한 연도, 순위 번호</sub></td></tr>
</table>

여덟 가지를 나란히:

<p align="center"><img src="docs/styles-compare.jpg" alt="여덟 가지를 나란히" width="100%"></p>

직접 조합할 수도 있습니다: `--fx bg,vignette,letterbox,scanlines,punch,confetti,trails,arrows,glass`, `--no-fx confetti`, `--year-style roll|row|badge`, `--progress top`, `--hook-style pop|type|strap|bold`. `--audio music.mp3`로 권리가 있는 음원을 넣을 수 있습니다(길이에 맞춰 자르고 페이드; chartreel은 음악을 포함하지 않습니다). `chartreel styles`로 전체 목록을 볼 수 있습니다.

## 설치

Python 3.10+, ffmpeg, Chromium이 필요합니다(Chromium은 Playwright가 내려받으며, 이미 설치된 Chrome도 됩니다).

**1. CLI**

```bash
pip install "git+https://github.com/Xkongai/chartreel"
python -m playwright install chromium     # skip if Chrome/Chromium is installed
chartreel doctor                          # checks ffmpeg, Chromium and fonts
```

ffmpeg: `brew install ffmpeg`(macOS) · `sudo apt install ffmpeg`(Ubuntu) · `winget install Gyan.FFmpeg`(Windows).
Linux에서 한국어·중국어·일본어 텍스트를 쓰려면: `sudo apt install fonts-noto-cjk fonts-noto-color-emoji`.

**2. 스킬** (사용하는 에이전트 선택)

| 에이전트 | 설치 |
| --- | --- |
| Claude Code | `/plugin marketplace add Xkongai/chartreel` 후 `/plugin install chartreel@chartreel` |
| Codex | `git clone https://github.com/Xkongai/chartreel && mkdir -p ~/.agents/skills && cp -r chartreel/skills/chartreel ~/.agents/skills/` |
| Cursor, OpenCode, Gemini CLI 등 | `npx skills add Xkongai/chartreel -g` |
| `SKILL.md`를 읽는 모든 에이전트 | `skills/chartreel/`을 해당 에이전트의 스킬 폴더에 복사 |

직접 복사하고 싶다면 Claude Code는 `~/.claude/skills/chartreel/`도 읽습니다.

## 빠른 시작 (CLI)

```bash
git clone https://github.com/Xkongai/chartreel && cd chartreel
chartreel render examples/gdp-race.csv -c examples/gdp-race.json -o out/
# out/gdp-race.mp4   1080×1920 H.264, 12 s
# out/gdp-race.gif   540 px wide
# out/gdp-race-cover.png
```

옵션만으로도 됩니다:

```bash
chartreel render my.csv --template line --theme paper --aspect 16:9 --duration 15 \
  --title "China vs India" --source "World Bank, CC BY 4.0" --takeaway "India passed China in 2021" \
  --note "2021: India passes China" --locale zh -o out/
```

`chartreel validate my.csv`는 먼저 파일을 검사하고, 문제가 있으면 정확한 행과 열을 알려 줍니다.
`chartreel preview my.csv -o out/`는 브라우저에서 탐색할 수 있는 독립형 HTML 플레이어를 만듭니다.

## 템플릿과 테마

| 템플릿 | 적합한 이야기 | CSV |
| --- | --- | --- |
| `race` | 시간에 따른 순위, 역전 | `year,A,B,C…` |
| `line` | 몇 개 계열의 성장이나 교차 | `year,A,B,C…` |
| `counter` | 큰 숫자 하나와 "×N배" 비교 | `label,value,note` |
| `share` | 전체 중 각 부분의 비중 변화 (10×10 와플) | `year,A,B,C…` |

테마: `dark`(다크 테크), `paper`(신문 스타일, 세리프 제목), `neon`(네온 글로우).
화면비: `9:16`, `16:9`, `1:1`, `4:5`, `3:4`. 롱 포맷 `year,name,value`는 자동으로 변환됩니다.

스토리 옵션: `--title`(훅), `--subtitle`(단위), `--note "시점: 텍스트"`(핵심 장면),
`--takeaway`(마무리 카드), `--source`(항상 표시). 숫자: `--prefix $`, `--suffix`, `--decimals`,
`--number-style compact|full|percent`, `--locale zh`(万 / 亿 / 万亿). 계열별 `label`, `color`, `emoji`는
JSON 설정 파일에 적습니다. 전체 목록: [skills/chartreel/references/options.md](skills/chartreel/references/options.md).

## 숫자가 정확한 이유

- 각 행이 화면에 나오는 순간 모든 값은 CSV 값과 같고, 그 사이는 인접한 두 행의 선형 보간입니다.
  `tests/test_accuracy.py`가 모든 예제를 여러 화면비에서 검사하고, 레이스 순위가 각 행에서 데이터와 일치하는지도 확인합니다.
- 중간의 빈 칸은 보간되고 `validate`가 알려 줍니다. 기억에 의존해 채우는 값은 없습니다.
- 카운터는 올라간 뒤 정확한 값에서 멈춥니다. 와플은 항상 정확히 100칸입니다(최대 잉여법).
- 스킬은 에이전트에게 1차 출처에서 데이터를 가져오고, 결론은 코드로 계산하고, 항상 출처를 밝히도록 지시합니다.

## 작동 방식

각 템플릿은 결정적인 `renderFrame(t)`를 가진 독립형 HTML 페이지입니다. 시스템 시계나 난수를 쓰지 않으므로
같은 프레임이 브라우저 미리보기와 내보내기에서 똑같이 그려집니다. chartreel은 Playwright로 헤드리스 Chromium을 구동해
프레임마다 캡처하고 ffmpeg로 넘깁니다(H.264 `yuv420p`, `+faststart`, GIF는 `palettegen`).
여러 브라우저 프로세스가 구간을 나눠 병렬로 렌더링합니다(`--jobs`).

8코어 Linux 머신 실측: 12초 1080×1920 레이스(360프레임)는 프로세스 4개로 약 9초(1개로 약 27초)에 렌더링됩니다.

## 제한 사항

- 글꼴은 시스템 글꼴을 사용합니다. CJK 글꼴이 없으면 글자가 네모로 보이며, `chartreel doctor`가 경고합니다.
  Windows에서는 국기 이모지가 표시되지 않습니다(시스템 이모지 글꼴에 국기가 없음).
- 음악과 효과음은 포함하지 않습니다(`--audio`로 직접 음원 추가). 프레임 단위 사용자 키프레임은 아직 없으며 행 사이 시간은 균일합니다.
- `line`은 약 8개 계열, `share`는 약 10개 항목까지가 읽기 좋습니다.

## 개발

```bash
pip install -e ".[dev]" && python -m playwright install chromium
pytest -q                       # parsing, accuracy, deterministic frames, smoke renders
bash scripts/make_demos.sh      # regenerate docs/*.gif
bash scripts/make_styles.sh out/styles    # the eight style presets, 9:16 15 s MP4 + cover
python scripts/make_gallery.py out/styles # docs/styles/*.jpg and docs/styles-compare.jpg
python scripts/make_banner.py             # docs/banner.png and docs/banner@2x.png
python scripts/fetch_worldbank.py   # re-download the example data
```

[CONTRIBUTING.md](CONTRIBUTING.md)와 [CHANGELOG.md](CHANGELOG.md)를 참고하세요.

## 라이선스

[MIT](LICENSE) © 2026 Xkongai. 예제 데이터: 세계은행 세계개발지표(WDI), CC BY 4.0.
