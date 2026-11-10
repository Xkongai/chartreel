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
}
THEME_ALIASES = {"dark-tech": "dark", "tech": "dark", "newspaper": "paper", "news": "paper", "light": "paper"}
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
    theme = resolve(opts.get("theme") or "dark", THEMES, THEME_ALIASES, "theme")
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

    return {
        "template": template,
        "theme": theme,
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
