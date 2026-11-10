# chartreel options

Every option works as a CLI flag (`--number-style`) and as a JSON config key (`number_style`).
CLI flags override the config file.

| Key / flag | Default | Meaning |
| --- | --- | --- |
| `template` / `-t` | `race` | `race`, `line`, `counter`, `share` (aliases: `bar-race`, `waffle`, `big-number`) |
| `theme` / `--theme` | `dark` | `dark` (dark tech), `paper` (newspaper), `neon` |
| `aspect` / `-a` | `9:16` | `9:16`, `16:9`, `1:1`, `4:5`, `3:4` |
| `size` / `--size` | `1080` | short side in pixels (`720` for drafts, `1080` for upload) |
| `duration` / `-d` | `12` | seconds, 1–600 |
| `fps` / `--fps` | `30` | frames per second, 1–60 |
| `title`, `subtitle` | — | headline (hook) and context line |
| `source` / `--source` | — | footer citation; a warning is printed when missing |
| `source_label` | `Source` / `数据来源` | footer prefix |
| `takeaway` | — | closing card shown during the outro, in its own band (the chart shrinks to make room; it never covers data). Keep it short: up to 2 lines |
| `notes` / `--note` | — | list of `"PERIOD: text"` callouts; PERIOD must be a value in the first column |
| `top` / `--top` | `10` | bars visible in a race |
| `number_style` | `compact` | `compact` (1.2B / 1.2亿), `full` (1,234,567), `percent` (12.3%) |
| `locale` | `en` | `en` or `zh` (万 / 亿 / 万亿 units, Chinese footer label) |
| `prefix`, `suffix` | — | e.g. `"$"`, `" km"`, `"美元"` |
| `decimals` | auto | fixed decimals; auto = 2 below 10, 1 below 100, else 0 (in the chosen unit) |
| `start`, `end` | all | period range to keep |
| `intro`, `outro` | auto | seconds before data moves (≤1 s) / final hold with the takeaway (≤2.2 s) |
| `brand` / `--no-brand` | `true` | small "chartreel" mark in the footer |
| `series` | — | `{ "Name": {"label": "显示名", "color": "#ff6b6b", "emoji": "🇨🇳"} }` (counter: keyed by label) |
| `formats` / `--formats` | `mp4,gif,png` | any of `mp4,gif,png,html` |
| `gif_width`, `gif_fps` | `min(width,540)`, `15` | GIF size and frame rate |
| `cover_at` | `end` | cover time in seconds, or `start` / `end` |
| `jobs` / `-j` | auto (≤4) | parallel browser workers |
| `name` / `--name` | CSV stem | output file name stem |

Exit codes: `0` ok · `2` data or option error (message names the file, row and column) · `3` render
environment problem (ffmpeg / Chromium missing, template error).

Environment: `CHARTREEL_CHROME=/path/to/chrome` forces a browser, `CHARTREEL_FFMPEG=/path/to/ffmpeg` forces ffmpeg.
