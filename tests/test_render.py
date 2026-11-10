import json
import subprocess

import pytest

from chartreel.cli import main

pytestmark = pytest.mark.usefixtures("need_browser", "need_ffmpeg")


def probe(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_frames", "-show_entries",
                          "stream=codec_name,pix_fmt,width,height,nb_read_frames,r_frame_rate", "-of", "json", str(path)],
                         capture_output=True, text=True, check=True).stdout
    return json.loads(out)["streams"][0]


@pytest.mark.parametrize("name,aspect", [("gdp-race", "9:16"), ("population-zh", "16:9"),
                                         ("population-share", "1:1"), ("china-gdp-counter", "9:16")])
def test_smoke_render(examples, tmp_path, name, aspect):
    rc = main(["render", str(examples / f"{name}.csv"), "-c", str(examples / f"{name}.json"), "-a", aspect,
               "--size", "240", "-d", "2", "--fps", "10", "-o", str(tmp_path), "--gif-width", "160"])
    assert rc == 0
    mp4, gif, png = tmp_path / f"{name}.mp4", tmp_path / f"{name}.gif", tmp_path / f"{name}-cover.png"
    st = probe(mp4)
    assert st["codec_name"] == "h264" and st["pix_fmt"] == "yuv420p"
    assert int(st["nb_read_frames"]) == 20
    assert st["r_frame_rate"] == "10/1"
    assert st["width"] % 2 == 0 and st["height"] % 2 == 0
    assert gif.read_bytes()[:6] in (b"GIF89a", b"GIF87a")
    assert png.read_bytes()[:8] == b"\x89PNG\r\n\x1a\n"


def test_formats_subset(examples, tmp_path):
    rc = main(["render", str(examples / "gdp-race.csv"), "--size", "200", "-d", "1", "--fps", "5",
               "-o", str(tmp_path), "--formats", "gif", "--name", "only"])
    assert rc == 0
    assert sorted(p.name for p in tmp_path.iterdir()) == ["only.gif"]


def test_parallel_jobs_give_same_frame_count(examples, tmp_path):
    rc = main(["render", str(examples / "gdp-race.csv"), "--size", "200", "-d", "4", "--fps", "15",
               "-o", str(tmp_path), "--formats", "mp4", "-j", "2"])
    assert rc == 0
    st = probe(tmp_path / "gdp-race.mp4")
    assert int(st["nb_read_frames"]) == 60
