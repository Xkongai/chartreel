from chartreel.cli import main


def test_validate_ok(examples, capsys):
    assert main(["validate", str(examples / "gdp-race.csv"), "-c", str(examples / "gdp-race.json")]) == 0
    assert "16 series x 35 periods" in capsys.readouterr().out


def test_validate_counter(examples, capsys):
    assert main(["validate", str(examples / "china-gdp-counter.csv"), "-t", "counter"]) == 0
    assert "3 counter item(s)" in capsys.readouterr().out


def test_validate_bad_csv(tmp_path, capsys):
    p = tmp_path / "bad.csv"
    p.write_text("year,A\n2000,1\n2001,oops\n", encoding="utf-8")
    assert main(["validate", str(p)]) == 2
    assert "bad.csv:3" in capsys.readouterr().err


def test_validate_warns_without_source(tmp_path, capsys):
    p = tmp_path / "d.csv"
    p.write_text("year,A\n2000,1\n2001,2\n", encoding="utf-8")
    assert main(["validate", str(p)]) == 0
    assert "no --source" in capsys.readouterr().out


def test_preview_writes_html(examples, tmp_path):
    assert main(["preview", str(examples / "population-zh.csv"), "-c", str(examples / "population-zh.json"),
                 "-o", str(tmp_path)]) == 0
    html = (tmp_path / "population-zh.html").read_text(encoding="utf-8")
    assert "中印人口之争" in html and "renderFrame" in html


def test_bad_format(examples, capsys):
    assert main(["render", str(examples / "gdp-race.csv"), "--formats", "webm"]) == 2


def test_lists(capsys):
    assert main(["templates"]) == 0 and "race" in capsys.readouterr().out
    assert main(["themes"]) == 0 and "neon" in capsys.readouterr().out
