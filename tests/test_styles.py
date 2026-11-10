"""Style presets and effects: every preset renders without script errors, keeps the
numbers exact, keeps bars apart and the takeaway card clear, and the CLI options work."""
import json
import shutil
import subprocess

import pytest

from chartreel.cli import main
from chartreel.data import DataError, load
from chartreel.render import Page, frame_times
from chartreel.spec import FX, STYLES, build_spec, load_config

STYLE_NAMES = [s for s in STYLES if s != "classic"]
SCAN = """(ts) => ts.map((t) => { window.chartreel.renderFrame(t); return window.chartreel.geometry(t); })"""


def spec_for(examples, name="gdp-race", **extra):
    cfg = load_config(examples / f"{name}.json")
    cfg.pop("theme", None)
    cfg.setdefault("size", 360)
    cfg.update(extra)
    return build_spec(load(examples / f"{name}.csv", cfg["template"]), cfg)


def hit(a, b, eps=0.0):
    return (a["x"] < b["x"] + b["w"] - eps and b["x"] < a["x"] + a["w"] - eps
            and a["y"] < b["y"] + b["h"] - eps and b["y"] < a["y"] + a["h"] - eps)


# ------------------------------------------------------------------ spec / CLI (no browser)

def test_every_preset_builds(examples):
    for st in STYLES:
        spec = spec_for(examples, style=st)
        assert spec["style"] == st
        assert set(spec["fx"]) == set(FX)
    assert spec_for(examples, style="news")["theme"] == "broadcast"
    assert spec_for(examples, style="vhs")["style"] == "retro"  # alias


def test_hook_defaults(examples):
    assert spec_for(examples)["hook"] == ""  # classic: no hook unless asked
    assert spec_for(examples, style="bold")["hook"] == "The world's largest economies, 1990–2024"
    assert spec_for(examples, style="bold", hook="Who is #1?")["hook"] == "Who is #1?"
    assert spec_for(examples, style="bold", hook=False)["hook"] == ""
    assert spec_for(examples, hook="Who is #1?")["hook"] == "Who is #1?"


def test_effect_overrides(examples):
    s = spec_for(examples, style="arcade", no_fx=["confetti"])
    assert s["fx"]["punch"] and not s["fx"]["confetti"]
    s = spec_for(examples, style="classic", fx="trails,vignette")
    assert s["fx"]["trails"] and s["fx"]["vignette"] and not s["fx"]["punch"]
    with pytest.raises(DataError, match="unknown effect"):
        spec_for(examples, fx="sparkles")
    with pytest.raises(DataError, match="unknown style"):
        spec_for(examples, style="vaporwave")
    with pytest.raises(DataError, match="--year-style"):
        spec_for(examples, year_style="huge")
    with pytest.raises(DataError, match="not in the data"):
        spec_for(examples, highlight="Atlantis")
    assert spec_for(examples, highlight="China, United States")["highlight"] == ["China", "United States"]


def test_cli_style_beats_config_theme(examples, tmp_path):
    out = tmp_path / "o"
    assert main(["preview", str(examples / "gdp-race.csv"), "-c", str(examples / "gdp-race.json"),
                 "--style", "news", "-o", str(out), "--name", "x"]) == 0
    html = (out / "x.html").read_text(encoding="utf-8")
    spec, _ = json.JSONDecoder().raw_decode(html.split("window.CHARTREEL_SPEC = ", 1)[1])
    assert spec["theme"] == "broadcast" and spec["yearStyle"] == "badge" and spec["ranks"] is True
    # an explicit --theme still wins
    assert main(["preview", str(examples / "gdp-race.csv"), "-c", str(examples / "gdp-race.json"),
                 "--style", "news", "--theme", "paper", "-o", str(out), "--name", "y"]) == 0
    assert '"theme": "paper"' in (out / "y.html").read_text(encoding="utf-8")


def test_styles_command(capsys):
    assert main(["styles"]) == 0
    out = capsys.readouterr().out
    for st in STYLES:
        assert st in out
    for fx in FX:
        assert fx in out


def test_missing_audio_is_a_data_error(examples, tmp_path, capsys):
    assert main(["render", str(examples / "gdp-race.csv"), "--audio", str(tmp_path / "nope.mp3"),
                 "-o", str(tmp_path)]) == 2
    assert "audio file not found" in capsys.readouterr().err


# ------------------------------------------------------------------ in the browser

@pytest.mark.usefixtures("need_browser")
@pytest.mark.parametrize("style", STYLE_NAMES)
def test_preset_keeps_numbers_exact(examples, style):
    spec = spec_for(examples, style=style, duration=12)
    rows = spec["data"]
    with Page(spec) as page:
        errors = []
        page.page.on("pageerror", lambda e: errors.append(str(e)))
        kts = page.key_times()
        assert kts[0] >= 1.1, "data must not move while the hook is on screen"
        for k in (0, len(kts) // 2, len(kts) - 1):
            st = page.state(kts[k])
            assert st["period"] == rows["times"][k]
            for s in rows["series"]:
                assert st["values"][s["name"]] == s["values"][k]
        # every frame draws without a script error (hook, effects, outro)
        page.eval(SCAN, frame_times(spec["duration"], 10))
        assert not errors, errors


@pytest.mark.usefixtures("need_browser")
@pytest.mark.parametrize("style", STYLE_NAMES)
@pytest.mark.parametrize("aspect", ["9:16", "16:9"])
def test_preset_layout_is_clean(examples, style, aspect):
    spec = spec_for(examples, style=style, aspect=aspect, duration=12, cta="Follow for more")
    with Page(spec) as page:
        ts = frame_times(spec["duration"], spec["fps"])
        geo = page.eval(SCAN, ts)
    cards = 0
    for t, g in zip(ts, geo):
        bars = g["bars"]
        for i, a in enumerate(bars):
            for b in bars[i + 1:]:
                assert not hit(a, b), f"{style} {aspect} t={t:.2f}: {a['name']} overlaps {b['name']}"
        if g["card"]:
            cards += 1
            for r in bars + g["content"]:
                assert not hit(g["card"], r, eps=0.5), f"{style} {aspect} t={t:.2f}: card covers {r['name']}"
            assert g["card"]["y"] + g["card"]["h"] <= g["footTop"] + 0.5
    assert cards > 5


@pytest.mark.usefixtures("need_browser")
@pytest.mark.parametrize("name", ["population-zh", "china-gdp-counter", "population-share"])
def test_presets_work_on_other_templates(examples, name):
    for style in ("bold", "retro", "glass"):
        spec = spec_for(examples, name, style=style, duration=8)
        with Page(spec) as page:
            errors = []
            page.page.on("pageerror", lambda e: errors.append(str(e)))
            page.eval(SCAN, frame_times(spec["duration"], 6))
            assert not errors, (style, errors)


@pytest.mark.usefixtures("need_browser")
def test_overtake_events_match_the_data(examples):
    # China passes Japan in 2010 (World Bank): the #2 event must fall between the 2009 and 2010 key times
    spec = spec_for(examples, style="arcade", duration=15)
    with Page(spec) as page:
        ev = page.eval("() => window.chartreel.events()")
        kts = page.key_times()
    times = spec["data"]["times"]
    china2 = [e for e in ev if e["name"] == "China" and e["rank"] == 2]
    assert len(china2) == 1
    assert kts[times.index("2009")] < china2[0]["t"] <= kts[times.index("2010")]


@pytest.mark.usefixtures("need_browser", "need_ffmpeg")
def test_audio_is_muxed_with_fades(examples, tmp_path):
    tone = tmp_path / "tone.wav"
    subprocess.run([shutil.which("ffmpeg"), "-y", "-loglevel", "error", "-f", "lavfi", "-i",
                    "sine=frequency=440:duration=5", str(tone)], check=True)
    out = tmp_path / "o"
    assert main(["render", str(examples / "gdp-race.csv"), "-c", str(examples / "gdp-race.json"), "--size", "240",
                 "-d", "3", "--formats", "mp4", "--audio", str(tone), "-o", str(out), "--name", "a", "-j", "1"]) == 0
    probe = json.loads(subprocess.run([shutil.which("ffprobe"), "-v", "error", "-show_streams", "-show_format", "-of", "json",
                                       str(out / "a.mp4")], capture_output=True, text=True, check=True).stdout)
    kinds = {s["codec_type"]: s for s in probe["streams"]}
    assert kinds["audio"]["codec_name"] == "aac" and kinds["video"]["codec_name"] == "h264"
    assert abs(float(probe["format"]["duration"]) - 3.0) < 0.15
    # faded in: the first 50 ms are near silent
    vol = subprocess.run([shutil.which("ffmpeg"), "-v", "info", "-t", "0.05", "-i", str(out / "a.mp4"), "-af", "volumedetect",
                          "-f", "null", "-"], capture_output=True, text=True).stderr
    peak = float(vol.split("max_volume:")[1].split("dB")[0])
    assert peak < -20
