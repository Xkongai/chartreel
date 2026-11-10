"""Numbers on screen must come from the CSV.

At each row's key time, the template's state() must equal the source values
exactly, and the formatted text must be the formatted source value.
"""
import csv
import math

import pytest

from chartreel.data import load
from chartreel.render import Page
from chartreel.spec import build_spec, load_config

pytestmark = pytest.mark.usefixtures("need_browser")

CASES = [("gdp-race", "race"), ("population-zh", "line"), ("population-share", "share")]


def small(spec):
    # tiny frames: the numbers do not depend on resolution
    return spec


def make_spec(examples, name, **extra):
    cfg = load_config(examples / f"{name}.json")
    cfg.update(extra)
    cfg.setdefault("size", 270)
    data = load(examples / f"{name}.csv", cfg["template"])
    return build_spec(data, cfg)


@pytest.mark.parametrize("name,template", CASES)
@pytest.mark.parametrize("aspect", ["9:16", "16:9"])
def test_series_keyframes_match_source(examples, name, template, aspect):
    spec = make_spec(examples, name, aspect=aspect, duration=8)
    rows = list(csv.reader(open(examples / f"{name}.csv", encoding="utf-8")))
    header, body = rows[0], rows[1:]
    with Page(spec) as page:
        times = page.key_times()
        assert len(times) == len(body)
        assert times == sorted(times)
        for row, t in zip(body, times):
            st = page.state(t)
            assert st["period"] == row[0]
            for col, cell in zip(header[1:], row[1:]):
                assert st["values"][col] == pytest.approx(float(cell), rel=1e-12, abs=1e-9), (row[0], col)
            if template != "share":
                for col, cell in zip(header[1:], row[1:]):
                    want = page.eval("([v, f]) => window.chartreel.formatNumber(v, f)", [float(cell), spec["format"]])
                    assert st["texts"][col] == want
        # between two rows: strictly between the neighbours (linear interpolation, no overshoot)
        mid = page.state((times[3] + times[4]) / 2)
        for col in header[1:]:
            a, b = float(body[3][header.index(col)]), float(body[4][header.index(col)])
            assert min(a, b) - 1e-6 <= mid["values"][col] <= max(a, b) + 1e-6
            assert mid["values"][col] == pytest.approx((a + b) / 2, rel=1e-9)


def test_race_top_ranking_matches_source(examples):
    spec = make_spec(examples, "gdp-race")
    rows = list(csv.reader(open(examples / "gdp-race.csv", encoding="utf-8")))
    header, body = rows[0], rows[1:]
    with Page(spec) as page:
        times = page.key_times()
        for row, t in zip(body, times):
            ranked = sorted(header[1:], key=lambda c: -float(row[header.index(c)]))[: spec["top"]]
            assert page.state(t)["top"] == ranked


def test_share_cells_always_total_100(examples):
    spec = make_spec(examples, "population-share")
    with Page(spec) as page:
        for t in [0, 1.3, 2.71, 5, 7.77, spec["duration"]]:
            st = page.state(t)
            assert sum(st["cells"].values()) == 100
            assert sum(st["share"].values()) == pytest.approx(100.0)


def test_counter_holds_exact_values(examples):
    spec = make_spec(examples, "china-gdp-counter")
    rows = list(csv.DictReader(open(examples / "china-gdp-counter.csv", encoding="utf-8")))
    with Page(spec) as page:
        times = page.key_times()
        assert len(times) == len(rows)
        for row, t in zip(rows, times):
            st = page.state(t + 1e-6)
            assert st["exact"] and st["label"] == row["label"]
            assert st["value"] == float(row["value"])
        last = page.state(spec["duration"])
        assert last["value"] == float(rows[-1]["value"])
        # while counting, the number stays between the previous and the next value
        st = page.state(times[1] - 0.3)
        assert float(rows[0]["value"]) <= st["value"] <= float(rows[1]["value"])


@pytest.mark.parametrize("value,fmt,want", [
    (29298013000000, {"prefix": "$"}, "$29.3T"),
    (4190008188359, {"prefix": "$"}, "$4.19T"),
    (361560229445, {"prefix": "$"}, "$362B"),
    (999, {}, "999"),
    (1234567, {"style": "full"}, "1,234,567"),
    (12.345, {"style": "percent"}, "12.3%"),
    (1408975000, {"locale": "zh"}, "14.1亿"),
    (45709310, {"locale": "zh"}, "4571万"),
    (18729668435848, {"locale": "zh", "suffix": "美元"}, "18.7万亿美元"),
    (10e12, {"prefix": "$", "trim": True}, "$10T"),
    (2.5e9, {"trim": True}, "2.5B"),
    (-1500, {}, "-1.50K"),
    (1500, {"decimals": 0}, "2K"),
])
def test_number_format(examples, value, fmt, want):
    spec = make_spec(examples, "gdp-race")
    with Page(spec) as page:
        assert page.eval("([v, f]) => window.chartreel.formatNumber(v, f)", [value, fmt]) == want


def test_render_is_deterministic(examples):
    spec = make_spec(examples, "gdp-race", duration=4)
    with Page(spec) as page:
        a = page.frame_png(1.234)
        page.frame_png(3.0)
        b = page.frame_png(1.234)
    assert a == b
    assert not math.isnan(len(a))
