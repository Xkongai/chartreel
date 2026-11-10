# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-11-10

### Added
- Style presets: `--style classic | cinematic | news | editorial | arcade | retro | glass | bold`, each a theme plus
  a hook card, year counter, #1 decoration and effects. `chartreel styles` lists them.
- Five themes for the presets: `cinema`, `broadcast`, `retro`, `glass`, `bold`.
- Hook card for the first ~1.5 s (`--hook`, `--hook-style pop|type|strap|bold`, `--no-hook`); the data starts moving
  after it.
- Effects (`--fx`, `--no-fx`): animated gradient background, vignette, letterbox, VHS scanlines, camera punch-in
  and confetti when a bar reaches a new top-3 rank, rank-up arrows, speed streaks, frosted glass panel.
- Race options: rolling year counter and big year row (`--year-style watermark|roll|row|badge`), outline + crown on #1
  (`--leader`), rank numbers (`--ranks`), grey-out with `--highlight leader|"A,B"`.
- `--progress timeline|top|both|none`, `--safe-zone` (wider margins for Douyin/Shorts/Reels UI, on for presets),
  `--cta` line under the takeaway.
- `--audio FILE` muxes a user-supplied track into the MP4 (trimmed to length, `--audio-fade` in/out, AAC). No music
  is bundled.
- `window.chartreel.events()` lists overtakes; tests check them against the data.
- README banner (`docs/banner.png`, built by `scripts/make_banner.py` from real renders) and a style gallery
  (`scripts/make_styles.sh`, `scripts/make_gallery.py`).

### Changed
- `--style` on the command line replaces the theme/effects stored in a config file; `--theme` still wins.

## [0.1.0] - 2026-11-10

### Added
- Agent Skill `skills/chartreel/SKILL.md` (Claude Code plugin marketplace, Codex, Cursor and any agent
  that reads `SKILL.md`) with references for options and open data sources.
- `chartreel render`: MP4 (H.264, yuv420p), GIF (palette-optimised) and cover PNG; optional HTML player.
- `chartreel validate` with file/row/column error messages; `chartreel preview`, `templates`, `themes`, `doctor`.
- Templates: `race` (bar chart race), `line` (line race), `counter` (big-number counter + comparison),
  `share` (10×10 waffle share shift).
- Themes: `dark`, `paper`, `neon`. Aspects: 9:16, 16:9, 1:1, 4:5, 3:4.
- Deterministic `renderFrame(t)` templates, parallel rendering (`--jobs`), CJK and emoji text,
  万/亿 number units (`--locale zh`), event notes, takeaway card, JSON config files.
- Nothing covers the data: in the outro the chart shrinks to give the takeaway card its own band
  above the source line (all templates, all aspects), and race bars thin out while they pass each
  other instead of overlapping (`tests/test_layout.py` checks every frame).
- Examples with World Bank data (CC BY 4.0) and `scripts/fetch_worldbank.py` to re-download them.
