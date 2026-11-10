#!/usr/bin/env bash
# Render the GDP race in every style preset (9:16, 15 s) plus GIF thumbnails for the README.
# Usage: bash scripts/make_styles.sh [out_dir]
set -euo pipefail
cd "$(dirname "$0")/.."
OUT="${1:-out/styles}"
mkdir -p "$OUT"
HOOK="Who has the world's biggest economy?"
CTA="Follow for more data stories"
for STYLE in classic cinematic news editorial arcade retro glass bold; do
  EXTRA=()
  [ "$STYLE" = editorial ] && EXTRA=(--highlight "China,United States")
  [ "$STYLE" = classic ] || EXTRA+=(--hook "$HOOK" --cta "$CTA")
  chartreel render examples/gdp-race.csv -c examples/gdp-race.json --style "$STYLE" -d 15 \
    "${EXTRA[@]}" --gif-width 240 --gif-fps 10 -o "$OUT" --name "gdp-race-$STYLE"
done
