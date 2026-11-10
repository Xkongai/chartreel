"""Build the JSON spec a template consumes."""
from __future__ import annotations

import json
import re
from importlib import resources
from pathlib import Path

from .data import DataError, ItemData, SeriesData

TEMPLATES = {
    "race": "Bar chart race: ranked bars overtaking each other over time",
    "line": "Line race: lines drawn over time with live labels at the tips",
    "counter": "Big-number counter: each row counts up, then a comparison",
    "share": "Share shift: 10x10 waffle of each series' share over time",
}
TEMPLATE_ALIASES = {"bar": "race", "bar-race": "race", "barrace": "race", "line-race": "line",
                    "number": "counter", "big-number": "counter", "waffle": "share", "proportion": "share"}
THEMES = {
    "dark": "Dark tech: deep navy, vivid bars, soft glow",
    "paper": "Newspaper: warm paper, serif headline, ink palette",
    "neon": "Neon: black-violet background, glowing bars",
    "cinema": "Cinema: deep teal-to-black gradient, warm gold accent, soft glow",
    "broadcast": "Broadcast: navy and white with a red accent, TV-news straps",
    "retro": "Retro VHS: dusk purple, warm sunset palette, monospace type",
    "glass": "Glass: animated colour blobs behind frosted panels",
    "bold": "Bold: black and white with a loud yellow accent, giant type",
}
THEME_ALIASES = {"dark-tech": "dark", "tech": "dark", "newspaper": "paper", "news": "paper", "light": "paper"}
# A style preset is a bundle of theme + effects + defaults. Anything the user sets wins.
FX = {
    "bg": "animated gradient background",
    "vignette": "dark vignette around the frame",
    "letterbox": "cinema bars that open after the hook",
    "scanlines": "VHS scanlines, tracking band and PLAY stamp",
    "punch": "camera punch-in when a bar climbs onto the podium (top 3)",
    "confetti": "confetti burst from a bar that reaches a new top-3 rank",
    "trails": "speed streaks inside fast-growing bars",
    "arrows": "rank-up arrow next to the value after an overtake",
    "glass": "frosted panel behind the chart",
}
STYLES = {
    "classic": ("The default look: clean, no hook, no extra effects", {}),
    "cinematic": ("Movie-trailer: hook card, letterbox, vignette, gold glow, rolling year, crown on #1", {
        "theme": "cinema", "hook_style": "pop", "year_style": "roll", "leader": True,
        "fx": ["bg", "vignette", "letterbox", "punch"], "progress": "timeline"}),
    "news": ("TV news: headline strap hook, rank numbers, year badge, source strap", {
        "theme": "broadcast", "hook_style": "strap", "year_style": "badge", "ranks": True, "leader": True,
        "fx": [], "progress": "timeline"}),
    "editorial": ("Newspaper graphic: typewriter hook, grey bars with highlighted series, big serif year", {
        "theme": "paper", "hook_style": "type", "year_style": "row", "highlight": "leader",
        "fx": [], "progress": "timeline"}),
    "arcade": ("Gaming: neon, confetti on podium overtakes, punch zoom, rank-up arrows, speed streaks", {
        "theme": "neon", "hook_style": "pop", "year_style": "roll", "leader": True,
        "fx": ["bg", "punch", "confetti", "trails", "arrows"], "progress": "top"}),
    "retro": ("VHS tape: scanlines, chromatic text, typewriter hook, PLAY stamp", {
        "theme": "retro", "hook_style": "type", "year_style": "roll", "leader": True,
        "fx": ["scanlines", "vignette", "arrows"], "progress": "timeline"}),
    "glass": ("Glassmorphism: drifting colour blobs, frosted chart panel, top progress bar", {
        "theme": "glass", "hook_style": "pop", "year_style": "row", "leader": True,
        "fx": ["bg", "glass", "trails"], "progress": "top"}),
    "bold": ("Douyin big-text: giant highlighted hook words, huge year, punch, confetti, top progress", {
        "theme": "bold", "hook_style": "bold", "year_style": "row", "leader": True, "ranks": True,
        "fx": ["punch", "confetti", "arrows"], "progress": "top"}),
}
STYLE_ALIASES = {"default": "classic", "cinema": "cinematic", "movie": "cinematic", "broadcast": "news", "tv": "news",
                 "paper": "editorial", "minimal": "editorial", "neon": "arcade", "gaming": "arcade", "vhs": "retro",
                 "glassmorphism": "glass", "douyin": "bold", "big-text": "bold"}
STYLE_KEYS = ("theme", "hook_style", "year_style", "fx", "progress", "leader", "ranks", "highlight")
HOOK_STYLES = {"pop", "type", "strap", "bold"}
YEAR_STYLES = {"watermark", "roll", "row", "badge"}
PROGRESS = {"timeline", "top", "both", "none"}

ASPECTS = {"9:16": (9, 16), "16:9": (16, 9), "1:1": (1, 1), "4:5": (4, 5), "3:4": (3, 4)}
_HEX = re.compile(r"^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$")


def resolve(name: str, table: dict, aliases: dict, what: str) -> str:
    key = (name or "").strip().lower()
    key = aliases.get(key, key)
    if key not in table:
        raise DataError(f"unknown {what} {name!r}; choose one of: {', '.join(table)}")
    return key


def frame_size(aspect: str, short_side: int = 1080) -> tuple[int, int]:
    if aspect not in ASPECTS:
        raise DataError(f"unknown aspect {aspect!r}; choose one of: {', '.join(ASPECTS)}")
    a, b = ASPECTS[aspect]
    even = lambda x: int(round(x / 2.0)) * 2  # noqa: E731  (H.264 yuv420p needs even sizes)
    if a <= b:
        return even(short_side), even(short_side * b / a)
    return even(short_side * a / b), even(short_side)


def parse_note(text: str) -> dict:
    """'2008: Global financial crisis' -> {'at': '2008', 'text': 'Global financial crisis'}"""
    m = re.match(r"^\s*([^:=]+?)\s*[:=]\s*(.+)$", text)
    if not m:
        raise DataError(f"--note must look like 'PERIOD: text', got {text!r}")
    return {"at": m.group(1), "text": m.group(2).strip()}


def load_config(path: str | Path | None) -> dict:
    if not path:
        return {}
    p = Path(path)
    try:
        cfg = json.loads(p.read_text(encoding="utf-8"))
    except FileNotFoundError:
        raise DataError(f"{p}: config file not found") from None
    except json.JSONDecodeError as exc:
        raise DataError(f"{p}: invalid JSON ({exc})") from None
    if not isinstance(cfg, dict):
        raise DataError(f"{p}: config must be a JSON object")
    return cfg


def build_spec(data: SeriesData | ItemData, opts: dict) -> dict:
    """``opts`` holds already-merged options (config file + CLI flags)."""
    template = resolve(opts.get("template") or "race", TEMPLATES, TEMPLATE_ALIASES, "template")
    style = resolve(opts.get("style") or "classic", STYLES, STYLE_ALIASES, "style")
    opts = {**STYLES[style][1], **{k: v for k, v in opts.items() if v is not None}}
    theme = resolve(opts.get("theme") or "dark", THEMES, THEME_ALIASES, "theme")
    styled = style != "classic"
    aspect = opts.get("aspect") or "9:16"
    width, height = frame_size(aspect, int(opts.get("size") or 1080))
    duration = float(opts.get("duration") or 12)
    fps = int(opts.get("fps") or 30)
    if not 1 <= duration <= 600:
        raise DataError("--duration must be between 1 and 600 seconds")
    if not 1 <= fps <= 60:
        raise DataError("--fps must be between 1 and 60")
    if (template == "counter") != isinstance(data, ItemData):
        raise DataError("internal: data shape does not match template")

    payload = data.to_json()
    overrides = opts.get("series") or {}
    if not isinstance(overrides, dict):
        raise DataError("config 'series' must map series names to {label, color, emoji}")
    known = {s["name"] for s in payload.get("series", [])} | {i["label"] for i in payload.get("items", [])}
    for name, o in overrides.items():
        if name not in known:
            raise DataError(f"config 'series' mentions {name!r}, which is not in the data (have: {', '.join(sorted(known))})")
        color = (o or {}).get("color")
        if color and not _HEX.match(color):
            raise DataError(f"series {name!r}: color must be #rgb or #rrggbb, got {color!r}")
    for s in payload.get("series", []):
        for key in ("label", "color", "emoji"):
            if overrides.get(s["name"], {}).get(key):
                s[key] = overrides[s["name"]][key]
    for it in payload.get("items", []):
        for key in ("color", "emoji"):
            if overrides.get(it["label"], {}).get(key):
                it[key] = overrides[it["label"]][key]

    notes = [parse_note(n) if isinstance(n, str) else n for n in (opts.get("notes") or [])]
    if isinstance(data, SeriesData):
        for n in notes:
            if str(n.get("at")) not in data.times:
                raise DataError(f"note period {n.get('at')!r} is not in the data")

    fmt = {
        "style": opts.get("number_style") or "compact",
        "locale": opts.get("locale") or "en",
        "prefix": opts.get("prefix") or "",
        "suffix": opts.get("suffix") or "",
        "decimals": opts.get("decimals"),
    }
    if fmt["style"] not in {"compact", "full", "percent"}:
        raise DataError("--number-style must be compact, full or percent")
    if fmt["locale"] not in {"en", "zh"}:
        raise DataError("--locale must be en or zh")

    fx = opts.get("fx") or []
    if isinstance(fx, str):
        fx = [x.strip() for x in fx.split(",") if x.strip()]
    for name in opts.get("no_fx") or []:
        fx = [x for x in fx if x != name]
    bad = [x for x in fx if x not in FX]
    if bad:
        raise DataError(f"unknown effect(s) {', '.join(bad)}; choose from: {', '.join(FX)}")
    hook = opts.get("hook")
    if hook is None or hook is True:
        hook = (opts.get("title") or "") if styled or hook is True else ""
    if hook is False:
        hook = ""
    hook_style = opts.get("hook_style") or "pop"
    year_style = opts.get("year_style") or "watermark"
    progress = opts.get("progress") or "timeline"
    for val, allowed, flag in ((hook_style, HOOK_STYLES, "--hook-style"), (year_style, YEAR_STYLES, "--year-style"),
                               (progress, PROGRESS, "--progress")):
        if val not in allowed:
            raise DataError(f"{flag} must be one of: {', '.join(sorted(allowed))} (got {val!r})")
    highlight = opts.get("highlight")
    if isinstance(highlight, str) and highlight != "leader":
        highlight = [x.strip() for x in highlight.split(",") if x.strip()]
    if isinstance(highlight, list):
        for name in highlight:
            if name not in known:
                raise DataError(f"--highlight mentions {name!r}, which is not in the data (have: {', '.join(sorted(known))})")
    safe = opts.get("safe_zone")
    safe = styled if safe is None else bool(safe)

    return {
        "template": template,
        "theme": theme,
        "style": style,
        "hook": str(hook),
        "hookStyle": hook_style,
        "cta": opts.get("cta") or "",
        "yearStyle": year_style,
        "progress": progress,
        "leader": bool(opts.get("leader", False)),
        "ranks": bool(opts.get("ranks", False)),
        "highlight": highlight or None,
        "fx": {k: (k in fx) for k in FX},
        "safe": safe,
        "aspect": aspect,
        "width": width,
        "height": height,
        "duration": duration,
        "fps": fps,
        "title": opts.get("title") or "",
        "subtitle": opts.get("subtitle") or "",
        "source": opts.get("source") or "",
        "sourceLabel": opts.get("source_label") or ("数据来源" if fmt["locale"] == "zh" else "Source"),
        "takeaway": opts.get("takeaway") or "",
        "notes": notes,
        "top": int(opts.get("top") or 10),
        "format": fmt,
        "brand": bool(opts.get("brand", True)),
        "intro": opts.get("intro"),
        "outro": opts.get("outro"),
        "data": payload,
    }


def template_source(name: str) -> str:
    pkg = resources.files("chartreel") / "templates"
    return (pkg / f"{name}.js").read_text(encoding="utf-8")


def build_html(spec: dict, *, render_mode: bool = False) -> str:
    """Self-contained HTML. ``render_mode`` hides the preview player (used for frame capture)."""
    pkg = resources.files("chartreel") / "templates"
    shell = (pkg / "_shell.html").read_text(encoding="utf-8")
    common = (pkg / "common.js").read_text(encoding="utf-8")
    js = template_source(spec["template"])
    spec_js = ("window.__CHARTREEL_RENDER__ = true;\n" if render_mode else "") + "window.CHARTREEL_SPEC = " + json.dumps(spec, ensure_ascii=False, indent=None).replace("</", "<\\/") + ";"
    return (
        shell.replace("@@TEMPLATE@@", spec["template"])
        .replace("/*@@SPEC@@*/", spec_js)
        .replace("/*@@COMMON@@*/", common)
        .replace("/*@@TEMPLATE_JS@@*/", js)
    )
