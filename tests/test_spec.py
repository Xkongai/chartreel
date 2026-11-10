import json

import pytest

from chartreel.data import DataError, load_series
from chartreel.spec import build_html, build_spec, frame_size, parse_note


@pytest.mark.parametrize("aspect,size,want", [("9:16", 1080, (1080, 1920)), ("16:9", 1080, (1920, 1080)),
                                              ("1:1", 1080, (1080, 1080)), ("4:5", 1080, (1080, 1350)),
                                              ("16:9", 721, (1282, 720))])
def test_frame_size_even(aspect, size, want):
    assert frame_size(aspect, size) == want


def test_parse_note():
    assert parse_note("2008: Financial crisis") == {"at": "2008", "text": "Financial crisis"}
    assert parse_note("2021=印度超过中国") == {"at": "2021", "text": "印度超过中国"}
    with pytest.raises(DataError):
        parse_note("no separator")


@pytest.fixture
def data(tmp_path):
    p = tmp_path / "d.csv"
    p.write_text("year,A,B\n2000,1,2\n2001,3,4\n", encoding="utf-8")
    return load_series(p)


def test_build_spec_defaults(data):
    s = build_spec(data, {})
    assert (s["template"], s["theme"], s["width"], s["height"], s["fps"]) == ("race", "dark", 1080, 1920, 30)
    assert s["data"]["series"][0] == {"name": "A", "values": [1.0, 3.0]}


def test_aliases(data):
    s = build_spec(data, {"template": "bar-race", "theme": "newspaper"})
    assert (s["template"], s["theme"]) == ("race", "paper")
    with pytest.raises(DataError, match="unknown theme"):
        build_spec(data, {"theme": "pink"})


def test_series_overrides(data):
    s = build_spec(data, {"series": {"A": {"color": "#ff0000", "emoji": "🇨🇳", "label": "Alpha"}}})
    assert s["data"]["series"][0]["color"] == "#ff0000"
    assert s["data"]["series"][0]["label"] == "Alpha"
    with pytest.raises(DataError, match="not in the data"):
        build_spec(data, {"series": {"Z": {}}})
    with pytest.raises(DataError, match="color"):
        build_spec(data, {"series": {"A": {"color": "red"}}})


def test_note_must_match_a_period(data):
    with pytest.raises(DataError, match="not in the data"):
        build_spec(data, {"notes": ["1999: nope"]})


def test_html_is_self_contained_and_escaped(data):
    s = build_spec(data, {"title": "</script><b>x"})
    html = build_html(s)
    assert "<\\/script><b>x" in html
    assert "/*@@" not in html
    start = html.index("window.CHARTREEL_SPEC = ") + len("window.CHARTREEL_SPEC = ")
    end = html.index(";</script>", start)
    spec = json.loads(html[start:end].replace("<\\/", "</"))
    assert spec["title"] == "</script><b>x"
    assert "__CHARTREEL_RENDER__ = true" not in html
    assert "__CHARTREEL_RENDER__ = true" in build_html(s, render_mode=True)
