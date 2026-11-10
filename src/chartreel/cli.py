"""Command-line interface: ``chartreel render | validate | preview | templates | themes | doctor``."""
from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

from . import __version__
from .data import DataError, ItemData, load, slice_times
from .spec import FX, STYLE_KEYS, STYLES, TEMPLATE_ALIASES, TEMPLATES, THEMES, build_spec, load_config, resolve

EXIT_OK, EXIT_DATA, EXIT_RENDER = 0, 2, 3

# option name -> config key (config files use the same names with underscores)
OPTION_KEYS = ["template", "theme", "aspect", "size", "duration", "fps", "title", "subtitle", "source", "source_label",
               "takeaway", "top", "number_style", "locale", "prefix", "suffix", "decimals", "start", "end",
               "intro", "outro", "gif_width", "gif_fps", "cover_at", "name", "formats", "jobs",
               "style", "hook", "hook_style", "cta", "year_style", "progress", "fx", "no_fx", "highlight",
               "leader", "ranks", "safe_zone", "audio", "audio_fade"]


def _err(msg: str) -> None:
    print(f"chartreel: error: {msg}", file=sys.stderr)


def _log(msg: str = "", end: str = "\n") -> None:
    print(msg, end=end, file=sys.stderr, flush=True)


def add_spec_args(p: argparse.ArgumentParser) -> None:
    p.add_argument("data", help="CSV file (wide: period,seriesA,seriesB…  long: period,name,value  counter: label,value,note)")
    p.add_argument("-c", "--config", help="JSON file with any of these options plus per-series {label,color,emoji}")
    p.add_argument("-t", "--template", help="race | line | counter | share (default: race)")
    p.add_argument("--theme", help="dark | paper | neon (default: dark)")
    p.add_argument("-a", "--aspect", help="9:16 | 16:9 | 1:1 | 4:5 | 3:4 (default: 9:16)")
    p.add_argument("--size", type=int, help="short side in pixels (default: 1080)")
    p.add_argument("-d", "--duration", type=float, help="seconds (default: 12)")
    p.add_argument("--fps", type=int, help="frames per second (default: 30)")
    p.add_argument("--title", help="headline shown on every frame — make it the hook")
    p.add_argument("--subtitle", help="one-line context, e.g. units")
    p.add_argument("--source", help="data source shown in the footer (required for honest charts)")
    p.add_argument("--source-label", help="footer prefix (default: 'Source' / '数据来源')")
    p.add_argument("--takeaway", help="closing sentence shown at the end")
    p.add_argument("--note", action="append", dest="notes", metavar="PERIOD: TEXT",
                   help="event callout at a period, e.g. '2008: Financial crisis' (repeatable)")
    p.add_argument("--top", type=int, help="bars shown in a race (default: 10)")
    p.add_argument("--number-style", help="compact (1.2B) | full (1,234,567) | percent")
    p.add_argument("--locale", help="en | zh  (zh uses 万/亿/万亿 in compact style)")
    p.add_argument("--prefix", help="text before numbers, e.g. '$'")
    p.add_argument("--suffix", help="text after numbers, e.g. ' km'")
    p.add_argument("--decimals", type=int, help="fixed decimals (default: automatic)")
    p.add_argument("--start", help="first period to include")
    p.add_argument("--end", help="last period to include")
    p.add_argument("--intro", type=float, help="seconds before the data starts moving")
    p.add_argument("--outro", type=float, help="seconds the final frame (and takeaway) is held")
    p.add_argument("--no-brand", dest="brand", action="store_false", default=None, help="hide the small 'chartreel' mark")
    g = p.add_argument_group("style presets and effects (chartreel styles lists them)")
    g.add_argument("-s", "--style", help="classic | cinematic | news | editorial | arcade | retro | glass | bold")
    g.add_argument("--hook", help="hook text for the first ~1.5 s (presets default to the title)")
    g.add_argument("--no-hook", dest="hook", action="store_false", default=None, help="no hook card")
    g.add_argument("--hook-style", help="pop | type | strap | bold")
    g.add_argument("--cta", help="small line under the takeaway, e.g. 'Follow for more data stories'")
    g.add_argument("--year-style", help="watermark | roll | row | badge (race)")
    g.add_argument("--progress", help="timeline | top | both | none")
    g.add_argument("--fx", help="comma list of effects to use instead of the preset's: " + ", ".join(FX))
    g.add_argument("--no-fx", action="append", metavar="EFFECT", help="drop one effect from the preset (repeatable)")
    g.add_argument("--highlight", help="race: 'leader' or comma list of series to colour; the rest turn grey")
    g.add_argument("--leader", dest="leader", action="store_true", default=None, help="race: outline and crown on #1")
    g.add_argument("--no-leader", dest="leader", action="store_false", default=None, help="race: no #1 decoration")
    g.add_argument("--ranks", dest="ranks", action="store_true", default=None, help="race: rank numbers column")
    g.add_argument("--safe-zone", dest="safe_zone", action="store_true", default=None,
                   help="wider margins for Douyin/Shorts/Reels UI (on for presets)")
    g.add_argument("--no-safe-zone", dest="safe_zone", action="store_false", default=None)


def merged_options(args: argparse.Namespace) -> dict:
    cfg = load_config(getattr(args, "config", None))
    if getattr(args, "style", None):
        # --style on the command line replaces the look stored in the config file
        for key in STYLE_KEYS:
            cfg.pop(key, None)
    opts = dict(cfg)
    for key in OPTION_KEYS + ["notes", "brand"]:
        val = getattr(args, key, None)
        if val is not None:
            opts[key] = val
    return opts


def load_data(args, opts):
    template = resolve(opts.get("template") or "race", TEMPLATES, TEMPLATE_ALIASES, "template")
    data = load(args.data, template)
    if not isinstance(data, ItemData) and (opts.get("start") or opts.get("end")):
        data = slice_times(data, opts.get("start"), opts.get("end"))
    return template, data


def cmd_validate(args) -> int:
    try:
        opts = merged_options(args)
        template, data = load_data(args, opts)
        spec = build_spec(data, opts)
    except DataError as exc:
        _err(str(exc))
        return EXIT_DATA
    if isinstance(data, ItemData):
        print(f"ok: {len(data.items)} counter item(s): " + ", ".join(i.label for i in data.items))
    else:
        print(f"ok: {len(data.series)} series x {len(data.times)} periods ({data.times[0]} … {data.times[-1]})"
              f" → template {template}, {spec['width']}x{spec['height']}, {spec['duration']:g}s")
    for w in data.warnings:
        print(f"warning: {w}")
    if not spec["source"]:
        print("warning: no --source given; cite where the numbers come from")
    return EXIT_OK


def cmd_render(args, default_formats: str = "mp4,gif,png") -> int:
    try:
        opts = merged_options(args)
        _, data = load_data(args, opts)
        spec = build_spec(data, opts)
        formats = {f.strip().lower() for f in str(opts.get("formats") or default_formats).split(",") if f.strip()}
        bad = formats - {"mp4", "gif", "png", "html"}
        if bad:
            raise DataError(f"unknown format(s): {', '.join(sorted(bad))} (use mp4,gif,png,html)")
        if opts.get("audio") and not Path(opts["audio"]).is_file():
            raise DataError(f"audio file not found: {opts['audio']}")
        if opts.get("audio") and "mp4" not in formats:
            _log("warning: --audio only applies to the MP4")
    except DataError as exc:
        _err(str(exc))
        return EXIT_DATA
    for w in data.warnings:
        _log(f"warning: {w}")
    if not spec["source"]:
        _log("warning: no --source given; cite where the numbers come from")
    out = Path(args.out)
    name = opts.get("name") or Path(args.data).stem
    from .render import RenderError, render

    _log(f"chartreel {spec['template']} · {spec['theme']} · {spec['width']}x{spec['height']} · "
         f"{spec['duration']:g}s @ {spec['fps']}fps → {out}/")
    try:
        res = render(spec, out, name, formats, gif_width=opts.get("gif_width"), gif_fps=int(opts.get("gif_fps") or 15),
                     cover_at=opts.get("cover_at") or "end", jobs=opts.get("jobs"), audio=opts.get("audio"),
                     audio_fade=float(opts["audio_fade"]) if opts.get("audio_fade") is not None else 1.0, log=_log)
    except RenderError as exc:
        _err(str(exc))
        return EXIT_RENDER
    for kind, path in res["files"].items():
        size = path.stat().st_size
        print(f"{kind:5} {path}  ({size / 1024 / 1024:.2f} MB)" if size > 1024 * 1024 else f"{kind:5} {path}  ({size / 1024:.0f} KB)")
    if "seconds" in res:
        _log(f"done in {res['seconds']:.1f}s")
    return EXIT_OK


def _font_report() -> str:
    """Best-effort font check. macOS and Windows always ship CJK fonts; on Linux ask fontconfig."""
    if not sys.platform.startswith("linux"):
        return "system fonts (macOS/Windows include CJK fonts)"
    import subprocess

    def families(pattern: str) -> str:
        try:
            return subprocess.run(["fc-list", pattern, "family"], capture_output=True, text=True, timeout=10).stdout
        except (OSError, subprocess.SubprocessError):
            return ""

    cjk = bool(families(":lang=zh").strip())
    inter = "Inter" in families("Inter")
    emoji = "Emoji" in families(":lang=und-zsye") or "Emoji" in families("Noto Color Emoji")
    return (f"Inter: {'yes' if inter else 'no (falls back to system sans)'} · "
            f"CJK: {'yes' if cjk else 'NOT FOUND (sudo apt install fonts-noto-cjk)'} · "
            f"emoji: {'yes' if emoji else 'no (sudo apt install fonts-noto-color-emoji)'}")


def cmd_doctor(_args) -> int:
    ok = True
    print(f"chartreel {__version__}  python {sys.version.split()[0]}")
    ff = shutil.which("ffmpeg")
    print(f"ffmpeg      {'ok  ' + ff if ff else 'MISSING (brew/apt/winget install ffmpeg)'}")
    ok &= bool(ff)
    try:
        import playwright  # noqa: F401
        print("playwright  ok")
    except ImportError:
        print("playwright  MISSING (pip install playwright)")
        return EXIT_RENDER
    from .render import RenderError, launch_browser

    try:
        from playwright.sync_api import sync_playwright

        with sync_playwright() as pw:
            b = launch_browser(pw)
            page = b.new_page()
            print(f"chromium    ok  {b.version}")
            b.close()
        print(f"fonts       {_font_report()}")
    except RenderError as exc:
        print(f"chromium    MISSING  {exc}")
        ok = False
    return EXIT_OK if ok else EXIT_RENDER


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(prog="chartreel", description="Turn a CSV into an accurate data-animation short video (MP4 + GIF + cover).")
    ap.add_argument("--version", action="version", version=f"chartreel {__version__}")
    sub = ap.add_subparsers(dest="cmd", required=True)

    r = sub.add_parser("render", help="render MP4 + GIF + cover PNG (and optional HTML)")
    add_spec_args(r)
    r.add_argument("-o", "--out", default="out", help="output folder (default: out/)")
    r.add_argument("--name", help="output file name stem (default: CSV file name)")
    r.add_argument("--formats", help="comma list of mp4,gif,png,html (default: mp4,gif,png)")
    r.add_argument("--gif-width", type=int, help="GIF width in px (default: min(width, 540))")
    r.add_argument("--gif-fps", type=int, help="GIF frame rate (default: 15)")
    r.add_argument("-j", "--jobs", type=int, help="parallel browser workers (default: auto, up to 4)")
    r.add_argument("--cover-at", help="cover frame time in seconds, or 'start' / 'end' (default: end)")
    r.add_argument("--audio", help="music/voice file to put under the MP4 (trimmed to length, faded in/out)")
    r.add_argument("--audio-fade", type=float, help="fade in/out seconds for --audio (default: 1.0)")

    v = sub.add_parser("validate", help="check a CSV (and options) without rendering")
    add_spec_args(v)

    pv = sub.add_parser("preview", help="write a self-contained HTML player (no browser needed to build it)")
    add_spec_args(pv)
    pv.add_argument("-o", "--out", default="out")
    pv.add_argument("--name")

    sub.add_parser("templates", help="list templates")
    sub.add_parser("themes", help="list themes")
    sub.add_parser("styles", help="list style presets and effects")
    sub.add_parser("doctor", help="check ffmpeg, Chromium and fonts")

    args = ap.parse_args(argv)
    if args.cmd == "render":
        return cmd_render(args)
    if args.cmd == "preview":
        args.formats = "html"
        return cmd_render(args, "html")
    if args.cmd == "validate":
        return cmd_validate(args)
    if args.cmd == "templates":
        for k, v in TEMPLATES.items():
            print(f"{k:8} {v}")
        return EXIT_OK
    if args.cmd == "themes":
        for k, v in THEMES.items():
            print(f"{k:8} {v}")
        return EXIT_OK
    if args.cmd == "styles":
        for k, (desc, d) in STYLES.items():
            print(f"{k:10} {desc}")
            if d:
                print(f"{'':10} theme={d.get('theme')} hook={d.get('hook_style')} year={d.get('year_style')} "
                      f"progress={d.get('progress')} fx={','.join(d.get('fx') or []) or '-'}")
        print("\neffects (--fx a,b / --no-fx a):")
        for k, v in FX.items():
            print(f"  {k:10} {v}")
        return EXIT_OK
    if args.cmd == "doctor":
        return cmd_doctor(args)
    return EXIT_DATA


if __name__ == "__main__":
    raise SystemExit(main())
