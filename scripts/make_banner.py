"""Build the README banner (docs/banner.png, 1280x640, plus docs/banner@2x.png).

Every chart in the banner is a real chartreel frame rendered from the bundled World Bank
examples; the layout is plain HTML/CSS screenshotted with the same Playwright/Chromium that
chartreel renders with. Usage:  python scripts/make_banner.py [out_dir]
"""
from __future__ import annotations

import base64
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))

from chartreel.data import load  # noqa: E402
from chartreel.render import Page, launch_browser  # noqa: E402
from chartreel.spec import build_spec, load_config  # noqa: E402

EX = ROOT / "examples"
HOOK = "Who has the world's biggest economy?"

# (example, overrides, time in seconds)
SHOTS = {
    "race": ("gdp-race", {"style": "arcade", "aspect": "9:16", "duration": 15, "hook": HOOK}, 9.6),
    "line": ("population-zh", {"aspect": "16:9", "duration": 15}, 15.0),
    "counter": ("china-gdp-counter", {"aspect": "1:1", "duration": 10}, 10.0),
    "share": ("population-share", {"aspect": "16:9", "duration": 12}, 7.0),
}


def frame(name: str, extra: dict, t: float) -> str:
    cfg = load_config(EX / f"{name}.json")
    if "style" in extra:
        cfg.pop("theme", None)
    cfg.update(extra)
    spec = build_spec(load(EX / f"{name}.csv", cfg["template"]), cfg)
    with Page(spec) as page:
        png = page.frame_png(t)
    return "data:image/png;base64," + base64.b64encode(png).decode()


HTML = """<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1280px;height:640px;overflow:hidden}
body{font-family:Inter,"Helvetica Neue",Arial,"Noto Sans CJK SC",sans-serif;color:#F3F6FB;
  background:radial-gradient(900px 600px at 85% 20%,rgba(124,77,255,.28),transparent 60%),
             radial-gradient(700px 500px at 10% 100%,rgba(0,209,255,.18),transparent 60%),
             radial-gradient(500px 400px at 55% 110%,rgba(255,64,129,.16),transparent 60%),#070A14;position:relative}
.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),
  linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:40px 40px;
  mask-image:linear-gradient(90deg,#000 0%,rgba(0,0,0,.5) 50%,transparent 100%)}
.left{position:absolute;left:60px;top:92px;width:620px}
.badge{display:inline-flex;gap:8px;align-items:center;font-size:15px;font-weight:600;letter-spacing:.02em;color:#C9D3E6;
  padding:7px 14px;border:1px solid rgba(255,255,255,.16);border-radius:99px;background:rgba(255,255,255,.05)}
.badge i{width:8px;height:8px;border-radius:50%;background:#39E58C;box-shadow:0 0 10px #39E58C}
.mark{display:flex;align-items:flex-end;gap:16px;margin-top:26px}
.logo{display:flex;align-items:flex-end;gap:6px;height:74px;padding-bottom:12px}
.logo b{display:block;width:16px;border-radius:4px 4px 2px 2px}
h1{font-size:112px;line-height:.9;font-weight:900;letter-spacing:-.045em;
  background:linear-gradient(92deg,#7CF3FF 0%,#B9A2FF 45%,#FF8AD8 75%,#FFD27C 100%);-webkit-background-clip:text;color:transparent}
.tag{margin-top:22px;font-size:34px;font-weight:800;letter-spacing:-.02em;line-height:1.15}
.tag em{font-style:normal;color:#7CF3FF}
.sub{margin-top:14px;font-size:17px;line-height:1.5;color:#9AA6BD}
.pill{margin-top:30px;display:inline-flex;align-items:center;gap:12px;font:600 20px "JetBrains Mono","DejaVu Sans Mono",Menlo,monospace;
  padding:14px 22px;border-radius:14px;background:rgba(10,14,28,.85);border:1px solid rgba(124,243,255,.35);
  box-shadow:0 0 0 4px rgba(124,243,255,.06),0 10px 30px rgba(0,0,0,.4)}
.pill span{color:#39E58C}
.foot{position:absolute;left:64px;bottom:34px;font-size:14px;color:#6F7C95}
.card{position:absolute;border-radius:14px;overflow:hidden;box-shadow:0 22px 50px rgba(0,0,0,.55),0 0 0 1px rgba(255,255,255,.12)}
.card img{display:block;width:100%;height:100%;object-fit:cover}
.lab{position:absolute;font-size:12.5px;font-weight:700;letter-spacing:.03em;padding:5px 10px;border-radius:99px;
  background:rgba(7,10,20,.88);border:1px solid rgba(255,255,255,.18);color:#E6ECF7;white-space:nowrap}
.phone{position:absolute;left:712px;top:40px;width:262px;height:568px;border-radius:40px;background:#05060A;padding:10px;
  box-shadow:0 30px 70px rgba(0,0,0,.65),0 0 0 2px #2A2F3C,0 0 60px rgba(0,240,255,.18)}
.phone .scr{width:242px;height:548px;border-radius:31px;overflow:hidden;position:relative}
.phone img{width:100%;height:100%;display:block}
.notch{position:absolute;top:10px;left:50%;transform:translateX(-50%);width:74px;height:20px;border-radius:12px;background:#05060A;z-index:2}
</style></head><body>
<div class="grid"></div>
<div class="left">
  <div class="badge"><i></i>Agent Skill + CLI · open source · MIT</div>
  <div class="mark">
    <div class="logo"><b style="height:30px;background:#FF8AD8"></b><b style="height:52px;background:#B9A2FF"></b><b style="height:74px;background:#7CF3FF"></b></div>
    <h1>chartreel</h1>
  </div>
  <div class="tag">CSV in. <em>Data-animation video</em> out.</div>
  <div class="sub">Bar race · line race · counter · waffle → MP4, GIF &amp; cover.<br>9:16 to 16:9 · 8 style presets · Chinese-ready</div>
  <div class="pill"><span>$</span>npx skills add Xkongai/chartreel -g</div>
</div>
<div class="foot">Every chart here is a real chartreel render of World Bank data (CC BY 4.0).</div>

<div class="phone"><div class="notch"></div><div class="scr"><img src="@@RACE@@"></div></div>
<div class="lab" style="left:742px;top:14px;z-index:3">BAR RACE · 9:16 · arcade style</div>

<div class="card" style="left:1000px;top:58px;width:250px;height:141px;transform:rotate(2.5deg)"><img src="@@LINE@@"></div>
<div class="lab" style="left:1010px;top:206px;transform:rotate(2.5deg)">LINE RACE · 16:9</div>

<div class="card" style="left:1040px;top:250px;width:170px;height:170px;transform:rotate(-3deg)"><img src="@@COUNTER@@"></div>
<div class="lab" style="left:1066px;top:426px;transform:rotate(-3deg)">COUNTER · 1:1</div>

<div class="card" style="left:996px;top:462px;width:250px;height:141px;transform:rotate(2deg)"><img src="@@SHARE@@"></div>
<div class="lab" style="left:1060px;top:608px;transform:rotate(2deg)">SHARE · 16:9</div>
</body></html>"""


def main() -> None:
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "docs"
    out.mkdir(parents=True, exist_ok=True)
    html = HTML
    for key, (name, extra, t) in SHOTS.items():
        html = html.replace(f"@@{key.upper()}@@", frame(name, extra, t))
    from playwright.sync_api import sync_playwright

    with sync_playwright() as pw:
        b = launch_browser(pw)
        for scale, fname in ((1, "banner.png"), (2, "banner@2x.png")):
            page = b.new_page(viewport={"width": 1280, "height": 640}, device_scale_factor=scale)
            page.set_content(html, wait_until="load")
            page.evaluate("() => document.fonts.ready")
            page.screenshot(path=str(out / fname))
            page.close()
        b.close()
    print(out / "banner.png")


if __name__ == "__main__":
    main()
