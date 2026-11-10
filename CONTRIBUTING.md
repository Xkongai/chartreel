# Contributing to chartreel

Thanks for your interest! Issues and pull requests are welcome.

## Reporting bugs / requesting features

Please use the issue templates on GitHub. For bugs, include `chartreel --version`, your OS, the
output of `chartreel doctor`, the command and config you ran, and a few rows of the CSV. For
visual problems, attach the cover PNG or a frame.

## Development setup

```bash
git clone https://github.com/Xkongai/chartreel.git
cd chartreel
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
python -m playwright install chromium
pytest -q
```

Browser and ffmpeg tests are skipped when Chromium or ffmpeg is missing. On Debian/Ubuntu,
`sudo apt install ffmpeg fonts-noto-cjk fonts-noto-color-emoji` makes the full suite run.

## How the code is laid out

- `src/chartreel/data.py` — CSV parsing and validation (wide, long and counter shapes).
- `src/chartreel/spec.py` — options → JSON spec, and the self-contained HTML builder.
- `src/chartreel/render.py` — headless Chromium frame capture → ffmpeg (MP4, GIF, PNG).
- `src/chartreel/templates/` — `common.js` (themes, fonts, timeline, number formats) and one
  file per template. A template draws a frame from `t` alone: no wall-clock, no randomness.

## Ground rules for templates

- Every number on screen is a CSV value or a linear interpolation between two adjacent rows.
  `tests/test_accuracy.py` checks this at every key frame; add a case when you add a template.
- Look at your frames. Render a cover at a few times (`--formats png --cover-at 3.5`) in 9:16,
  16:9 and 1:1, and with Chinese labels, before opening a PR.

## Documentation

The README is available in nine languages. If you change `README.md`, please update the
translations too, or say in the PR which ones still need updating. Regenerate the demo GIFs with
`bash scripts/make_demos.sh` when a visual change affects them.

## Pull requests

- Keep PRs focused; add or update tests for behaviour changes.
- Run `pytest -q` before pushing.
- By contributing you agree that your contributions are licensed under the MIT License.
