"""Nothing may draw on top of the data.

* Bars in a race never intersect, not even mid-overtake (they get thinner while
  they pass each other).
* The takeaway card at the end gets its own band: it never covers a bar, the
  plot, the counter rows, the waffle or the legend, in every aspect ratio.

Geometry comes from window.chartreel.geometry(t), the same numbers draw() uses.
"""
import pytest

from chartreel.data import load
from chartreel.render import Page, frame_times
from chartreel.spec import build_spec, load_config

pytestmark = pytest.mark.usefixtures("need_browser")

ASPECTS = ["9:16", "16:9", "1:1", "4:5", "3:4"]
CASES = [
    ("gdp-race", "race"),
    ("population-zh", "line"),
    ("china-gdp-counter", "counter"),
    ("population-share", "share"),
]
SCAN = """(ts) => ts.map((t) => { window.chartreel.renderFrame(t); return window.chartreel.geometry(t); })"""


def make_spec(examples, name, aspect, size=540, **extra):
    cfg = load_config(examples / f"{name}.json")
    cfg.update(aspect=aspect, size=size, **extra)
    data = load(examples / f"{name}.csv", cfg["template"])
    return build_spec(data, cfg)


def hit(a, b, eps=0.0):
    return (a["x"] < b["x"] + b["w"] - eps and b["x"] < a["x"] + a["w"] - eps
            and a["y"] < b["y"] + b["h"] - eps and b["y"] < a["y"] + a["h"] - eps)


def scan(page, spec, extra=()):
    ts = sorted(set(frame_times(spec["duration"], spec["fps"])) | set(extra))
    return ts, page.eval(SCAN, ts)


@pytest.mark.parametrize("aspect", ASPECTS)
def test_race_bars_never_overlap(examples, aspect):
    spec = make_spec(examples, "gdp-race", aspect, duration=15)
    with Page(spec) as page:
        # every frame, plus a fine 5 ms grid around every rank change
        ts = frame_times(spec["duration"], spec["fps"])
        geo = page.eval(SCAN, ts)
        swaps = []
        prev = None
        for t, g in zip(ts, geo):
            order = [b["name"] for b in sorted(g["bars"], key=lambda b: b["y"])]
            if prev is not None and order != prev:
                swaps.append(t)
            prev = order
        assert len(swaps) > 10, "the GDP race should contain overtakes"
        fine = sorted({round(s + k * 0.005, 4) for s in swaps for k in range(-40, 41)})
        fine = [t for t in fine if 0 <= t <= spec["duration"]]
        geo += page.eval(SCAN, fine)
        ts = ts + fine
    for t, g in zip(ts, geo):
        bars = g["bars"]
        for i, a in enumerate(bars):
            for b in bars[i + 1:]:
                assert not hit(a, b), f"{aspect} t={t:.3f}: {a['name']} overlaps {b['name']}"


@pytest.mark.parametrize("name,template", CASES)
@pytest.mark.parametrize("aspect", ASPECTS)
def test_takeaway_card_covers_nothing(examples, name, template, aspect):
    spec = make_spec(examples, name, aspect, duration=10)
    assert spec.get("takeaway"), "examples should exercise the takeaway card"
    with Page(spec) as page:
        ts, geo = scan(page, spec, extra=[spec["duration"]])
    W, H = spec["width"], spec["height"]
    shown = 0
    for t, g in zip(ts, geo):
        card = g["card"]
        if not card:
            continue
        shown += 1
        assert 0 <= card["x"] and card["x"] + card["w"] <= W, f"{t}: card off-frame {card}"
        assert card["y"] >= 0 and card["y"] + card["h"] <= g["footTop"] + 0.5, f"{t}: card over the source line"
        for r in g["bars"] + g["content"]:
            assert not hit(card, r, eps=0.5), f"{name} {aspect} t={t:.2f}: card {card} covers {r}"
    assert shown > 5, "the card should be on screen during the outro"
    # the final frame (the cover) shows the whole card
    assert geo[-1]["card"] is not None
