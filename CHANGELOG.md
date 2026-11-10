# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
