---
name: chartreel
description: Turn a CSV, or a short description plus real data, into an accurate data-animation short video — bar chart race, line race, big-number counter, or share/waffle shift — exported as MP4 + GIF + cover PNG in 9:16, 16:9, 1:1, 4:5 or 3:4 for Douyin/TikTok, Xiaohongshu, YouTube Shorts, Reels, Bilibili or X. Use when the user asks for an animated chart, a bar chart race, a "data video", 动态排行榜, 数据可视化视频, or wants numbers turned into a short clip. Every on-screen number comes from the source data.
license: MIT
---

# chartreel

Make short, honest data-animation videos with the `chartreel` CLI. You pick the chart,
shape the data, write the story, render, and check the result. The renderer only ever
shows values from the CSV or straight-line interpolations between two adjacent rows.

## 0. Tools

```bash
chartreel doctor          # checks ffmpeg, Chromium and fonts
```

If `chartreel` is missing:

```bash
pip install "git+https://github.com/Xkongai/chartreel"   # or: uv tool install git+https://github.com/Xkongai/chartreel
python -m playwright install chromium                      # skip if Chrome/Chromium is already installed
# ffmpeg: macOS `brew install ffmpeg` · Ubuntu `sudo apt install ffmpeg` · Windows `winget install Gyan.FFmpeg`
# Chinese/Japanese/Korean text on Linux: `sudo apt install fonts-noto-cjk fonts-noto-color-emoji`
```

## 1. Get real data — never invent numbers

- Use the user's file when they give one. Keep it unchanged; reshape into a new CSV.
- Otherwise fetch from a primary, citable source and save the raw response next to the CSV.
  See `references/data-sources.md` (World Bank API, Our World in Data, FRED, Eurostat, national statistics offices).
- If the user types numbers in chat, use exactly those and cite them as "user-provided".
- Never fill gaps from memory. Blank cells are allowed: interior gaps are interpolated and
  `chartreel validate` reports how many; leading/trailing blanks mean the series is absent.
- Record the source name, indicator code or URL, and license; they go into `--source`.

## 2. Choose the template

| Story | Template | Data shape |
| --- | --- | --- |
| Who is #1 over time, overtakes ("GDP ranking 1990–2024") | `race` | period × series (5–40 series) |
| How a few things grew or crossed ("China vs India population") | `line` | period × series (2–8 series) |
| One jaw-dropping number, then "×N" comparisons ("from $191B to $18.7T") | `counter` | `label,value[,note]` (2–5 rows) |
| How a whole is split and shifts ("world population by region") | `share` | period × parts (2–10 parts, non-negative) |

## 3. Shape the CSV

```csv
year,China,India,United States        # wide: first column = period, one column per series
1990,361560229446,320979026420,5963144000000

year,name,value                       # long: also accepted, pivoted automatically
1990,China,361560229446

label,value,note                      # counter
1980年,191487500000,改革开放初期
```

Rules: periods ascending; plain numbers (commas, `$`, `%` are stripped); UTF-8 (BOM ok).
For long ranges, keep yearly rows — more rows give smoother, more truthful motion.

## 4. Write the data story

1. **Hook (title)**: the question or the surprise, ≤ 2 short lines. "The world's largest economies, 1990–2024", "中印人口之争".
2. **Context (subtitle)**: units and scope — "GDP, current US$".
3. **Key moments (`--note "PERIOD: text"`)**: 1–3 events. Each must be visible in the data at that period
   (check the CSV before writing "X passes Y").
4. **Takeaway (`--takeaway`)**: one sentence computed from the CSV. Do the arithmetic in code, e.g.
   `python -c "print(18729668435848/361560229446)"` → 51.8 → "China's GDP grew 52× in 34 years". Round honestly.
5. **Source (`--source`)**: always. Example: `World Bank WDI (NY.GDP.MKTP.CD), CC BY 4.0`.

Put it all in a JSON config so the render is reproducible (`references/options.md` lists every key):

```json
{
  "template": "race", "theme": "dark", "aspect": "9:16", "duration": 15,
  "title": "The world's largest economies, 1990–2024", "subtitle": "GDP, current US$",
  "source": "World Bank WDI (NY.GDP.MKTP.CD), CC BY 4.0",
  "takeaway": "China's GDP grew 52× in 34 years", "prefix": "$", "top": 10,
  "notes": ["2010: China passes Japan"],
  "series": {"China": {"emoji": "🇨🇳", "color": "#FF6B6B"}}
}
```

Chinese videos: add `"locale": "zh"` (numbers as 万/亿/万亿) and write title/notes in Chinese.

## 5. Validate, render, check

```bash
chartreel validate data.csv -c story.json          # schema + option check, clear row/column errors
chartreel render   data.csv -c story.json -o out/  # out/data.mp4, out/data.gif, out/data-cover.png
chartreel preview  data.csv -c story.json -o out/  # optional: self-contained HTML player to scrub
```

Platform presets: Douyin/TikTok/Shorts/Reels `-a 9:16 -d 15` (10–30 s) · Xiaohongshu `-a 3:4` or `9:16` ·
Bilibili/YouTube/X `-a 16:9` · X/Instagram feed `-a 1:1` or `4:5`. Pace: about 0.3–0.6 s per period for a race.
Quick drafts: `--size 540 --fps 15`. `--jobs N` sets parallel workers. A 12 s 1080×1920 race renders in
about 10–30 s depending on CPU.

Then **look** at the output before you hand it over:

```bash
ffmpeg -v error -i out/data.mp4 -vf "fps=1,scale=360:-1,tile=4x3" -frames:v 1 out/contact.png
```

Open the cover and the contact sheet. Check: title not cut, labels readable, no CJK tofu boxes (□),
the takeaway matches the numbers, the source is visible. Fix and re-render if needed.

## 6. Hand over

Report the MP4, GIF and cover paths, the source and license, and how the takeaway was computed.
Say plainly if any cells were interpolated (validate prints it). Do not claim a trend the data does not show.

## Accuracy rules (non-negotiable)

- On-screen values = CSV values at each period, linear interpolation in between. The counter template counts
  up to each value and then holds the exact number; say so if asked.
- Derived numbers (ratios, growth, "passes") must be computed from the CSV, not recalled.
- Never mix units or currencies in one chart; never compare nominal and real values silently.
- Always show the source. Keep the raw download so the user can audit it.
