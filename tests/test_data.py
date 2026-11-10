import pytest

from chartreel.data import DataError, load, load_items, load_series, parse_number, slice_times


def write(tmp_path, text, name="d.csv"):
    p = tmp_path / name
    p.write_text(text, encoding="utf-8")
    return p


@pytest.mark.parametrize("raw,want", [
    ("1,234.5", 1234.5), ("$3.2e9", 3.2e9), ("45%", 45.0), (" 12 ", 12.0), ("(5)", -5.0),
    ("¥1 000", 1000.0), ("", None), ("NA", None), ("..", None),
])
def test_parse_number(raw, want):
    assert parse_number(raw) == want


def test_parse_number_rejects_text():
    with pytest.raises(ValueError):
        parse_number("abc")


def test_wide_csv(tmp_path):
    d = load_series(write(tmp_path, "year,A,B\n2000,1,2\n2001,3,4\n"))
    assert d.times == ["2000", "2001"]
    assert [s.name for s in d.series] == ["A", "B"]
    assert d.series[1].values == [2.0, 4.0]


def test_long_csv_is_pivoted(tmp_path):
    d = load_series(write(tmp_path, "date,name,value\n2000,A,1\n2000,B,2\n2001,A,3\n2001,B,4\n"))
    assert d.times == ["2000", "2001"]
    assert {s.name: s.values for s in d.series} == {"A": [1.0, 3.0], "B": [2.0, 4.0]}


def test_utf8_bom_and_cjk_headers(tmp_path):
    p = tmp_path / "zh.csv"
    p.write_bytes("\ufeff年份,中国,印度\n1960,1,2\n1961,3,4\n".encode("utf-8"))
    d = load_series(p)
    assert [s.name for s in d.series] == ["中国", "印度"]


def test_semicolon_delimiter(tmp_path):
    d = load_series(write(tmp_path, "year;A;B\n2000;1;2\n2001;3;4\n"))
    assert d.series[0].values == [1.0, 3.0]


def test_interior_gaps_are_interpolated_and_reported(tmp_path):
    d = load_series(write(tmp_path, "year,A\n2000,10\n2001,\n2002,30\n2003,\n"))
    assert d.series[0].values == [10.0, 20.0, 30.0, None]
    assert d.series[0].filled == [1]
    assert any("interpolation" in w for w in d.warnings)


def test_bad_number_reports_row_and_column(tmp_path):
    with pytest.raises(DataError, match=r"d.csv:3: column 'B' is not a number: 'x'"):
        load_series(write(tmp_path, "year,A,B\n2000,1,2\n2001,3,x\n"))


def test_duplicate_period(tmp_path):
    with pytest.raises(DataError, match="appears twice"):
        load_series(write(tmp_path, "year,A\n2000,1\n2000,2\n"))


def test_unsorted_years(tmp_path):
    with pytest.raises(DataError, match="ascending"):
        load_series(write(tmp_path, "year,A\n2001,1\n2000,2\n"))


def test_needs_two_rows(tmp_path):
    with pytest.raises(DataError, match="at least 2 periods"):
        load_series(write(tmp_path, "year,A\n2000,1\n"))


def test_duplicate_series_names(tmp_path):
    with pytest.raises(DataError, match="duplicate series"):
        load_series(write(tmp_path, "year,A,A\n2000,1,2\n2001,1,2\n"))


def test_too_many_cells(tmp_path):
    with pytest.raises(DataError, match="d.csv:2: 3 cells"):
        load_series(write(tmp_path, "year,A\n2000,1,5\n2001,2\n"))


def test_missing_file(tmp_path):
    with pytest.raises(DataError, match="not found"):
        load_series(tmp_path / "nope.csv")


def test_share_rejects_negative(tmp_path):
    with pytest.raises(DataError, match="non-negative"):
        load(write(tmp_path, "year,A,B\n2000,1,-2\n2001,1,2\n"), "share")


def test_counter_items(tmp_path):
    d = load_items(write(tmp_path, "label,value,note\n1980,191487500000,start\n2024,18729668435848,\n"))
    assert [(i.label, i.value, i.note) for i in d.items] == [("1980", 191487500000.0, "start"), ("2024", 18729668435848.0, "")]


def test_counter_empty_value(tmp_path):
    with pytest.raises(DataError, match="d.csv:2: value is empty"):
        load_items(write(tmp_path, "label,value\nA,\n"))


def test_slice_times(tmp_path):
    d = load_series(write(tmp_path, "year,A\n2000,1\n2001,2\n2002,3\n"))
    s = slice_times(d, "2001", None)
    assert s.times == ["2001", "2002"] and s.series[0].values == [2.0, 3.0]
    with pytest.raises(DataError, match="not a period"):
        slice_times(d, "1999", None)


def test_examples_load(examples):
    for name, template in [("gdp-race", "race"), ("population-zh", "line"), ("population-share", "share"),
                           ("china-gdp-counter", "counter")]:
        load(examples / f"{name}.csv", template)
