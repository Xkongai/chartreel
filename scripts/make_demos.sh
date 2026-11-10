#!/usr/bin/env bash
# Regenerate the GIFs and covers in docs/ from the example data.
# Usage: bash scripts/make_demos.sh   (needs chartreel installed: pip install -e .)
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=$(mktemp -d)
E=examples

# hero: 16:9 bar chart race, dark theme
chartreel render $E/gdp-race.csv -c $E/gdp-race.json -a 16:9 --size 720 -d 7 --intro 0.4 --outro 1.6 --top 8 \
  --gif-width 880 --gif-fps 15 --cover-at 4.2 -o "$OUT" --name hero
# line race, Chinese labels, newspaper theme
chartreel render $E/population-zh.csv -c $E/population-zh.json -a 16:9 --size 720 -d 8 --outro 1.6 \
  --gif-width 640 --gif-fps 12 -o "$OUT" --name line-race
# big-number counter, neon
chartreel render $E/china-gdp-counter.csv -c $E/china-gdp-counter.json -a 1:1 --size 720 -d 7 --outro 1.6 \
  --gif-width 420 --gif-fps 15 -o "$OUT" --name counter
# share shift (waffle), 16:9 paper
chartreel render $E/population-share.csv -c $E/population-share.json --theme paper -a 16:9 --size 720 -d 7 \
  --outro 1.6 --gif-width 640 --gif-fps 12 -o "$OUT" --name share
# vertical 9:16 for Douyin / Shorts / Reels
chartreel render $E/gdp-race.csv -c $E/gdp-race.json --theme neon -a 9:16 --size 720 -d 8 --outro 1.6 \
  --gif-width 300 --gif-fps 12 -o "$OUT" --name vertical

mkdir -p docs
for n in hero line-race counter share vertical; do cp "$OUT/$n.gif" docs/; done
# full-size covers (1080 px short side)
chartreel render $E/gdp-race.csv -c $E/gdp-race.json --theme neon -a 9:16 --formats png -o "$OUT" --name cover-race-9x16
chartreel render $E/population-zh.csv -c $E/population-zh.json -a 16:9 --formats png -o "$OUT" --name cover-line-16x9
cp "$OUT/cover-race-9x16-cover.png" docs/cover-race-9x16.png
cp "$OUT/cover-line-16x9-cover.png" docs/cover-line-16x9.png
ls -l docs
