"""Gallery thumbnails and the side-by-side style comparison, cut from the MP4s that
scripts/make_styles.sh renders (a real frame of each video, nothing redrawn).

Usage:  python scripts/make_gallery.py SAMPLES_DIR [--at 8.25]
Writes  docs/styles/<style>.jpg  and  docs/styles-compare.jpg  (+ SAMPLES_DIR/compare.png)
"""
from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))
from chartreel.spec import STYLES  # noqa: E402

FONT = None
for cand in ("Inter:bold", "DejaVu Sans:bold"):
    try:
        FONT = subprocess.run(["fc-match", "-f", "%{file}", cand], capture_output=True, text=True).stdout.strip() or None
    except OSError:
        pass
    if FONT:
        break


def font(size: int, weight: int = 700):
    if not FONT:
        return ImageFont.load_default()
    f = ImageFont.truetype(FONT, size)
    try:
        f.set_variation_by_axes([14, weight]) if "opsz" in FONT else None
    except (OSError, AttributeError):
        pass
    return f


def grab(mp4: Path, t: float, out: Path) -> None:
    subprocess.run([shutil.which("ffmpeg") or "ffmpeg", "-y", "-loglevel", "error", "-ss", f"{t:.3f}", "-i", str(mp4),
                    "-frames:v", "1", str(out)], check=True)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("samples")
    ap.add_argument("--at", type=float, default=8.25)
    args = ap.parse_args()
    src = Path(args.samples)
    styles = [s for s in STYLES if (src / f"gdp-race-{s}.mp4").exists()]
    (ROOT / "docs/styles").mkdir(parents=True, exist_ok=True)
    frames = {}
    with tempfile.TemporaryDirectory() as tmp:
        for s in styles:
            p = Path(tmp) / f"{s}.png"
            grab(src / f"gdp-race-{s}.mp4", args.at, p)
            frames[s] = Image.open(p).convert("RGB")
            frames[s].load()
    for s, im in frames.items():
        im.resize((360, 640), Image.LANCZOS).save(ROOT / f"docs/styles/{s}.jpg", quality=86, optimize=True)

    # comparison: one labelled column per style
    pw, ph, pad, head = 300, 533, 22, 92
    W = pad + len(styles) * (pw + pad)
    H = 120 + head + ph + pad + 40
    sheet = Image.new("RGB", (W, H), (9, 12, 20))
    d = ImageDraw.Draw(sheet)
    d.text((pad, 28), "chartreel style presets — same data, same frame", font=font(40, 800), fill=(243, 246, 251))
    d.text((pad, 80), f"World Bank GDP 1990–2024 · 9:16 · 15 s · frame at {args.at:g} s of each MP4 (chartreel render --style …)",
           font=font(20, 500), fill=(140, 151, 171))
    for k, s in enumerate(styles):
        x = pad + k * (pw + pad)
        y = 120
        d.text((x, y + 8), s, font=font(30, 800), fill=(124, 243, 255) if s != "classic" else (200, 205, 215))
        desc = STYLES[s][0].split(":")[0].split(",")[0]
        d.text((x, y + 48), desc[:34], font=font(16, 500), fill=(160, 170, 188))
        sheet.paste(frames[s].resize((pw, ph), Image.LANCZOS), (x, y + head))
        d.rectangle([x - 1, y + head - 1, x + pw, y + head + ph], outline=(60, 68, 86))
    d.text((pad, H - 36), "Data: World Bank WDI (NY.GDP.MKTP.CD), CC BY 4.0", font=font(16, 500), fill=(110, 120, 140))
    sheet.save(src / "compare.png", optimize=True)
    sheet.save(ROOT / "docs/styles-compare.jpg", quality=88, optimize=True)
    print(src / "compare.png")


if __name__ == "__main__":
    main()
