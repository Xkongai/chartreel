"""CSV loading and validation.

Two shapes are accepted:

* **series** (race, line, share): one row per period.
  - wide:  ``year,China,India,...``  (first column = period, one column per series)
  - long:  ``year,name,value``       (one row per period x series; pivoted here)
* **items** (counter): ``label,value[,note]`` — one row per number to reveal.

Every number that ends up on screen is either a value from this file or a
linear interpolation between two adjacent rows of it.
"""
from __future__ import annotations

import csv
import io
import math
import re
from dataclasses import dataclass, field
from pathlib import Path

TIME_NAMES = {"year", "date", "time", "period", "month", "day", "quarter", "年份", "年", "日期", "时间"}
NAME_NAMES = {"name", "series", "label", "category", "country", "entity", "item", "名称", "类别"}
VALUE_NAMES = {"value", "val", "amount", "count", "数值", "值"}
NOTE_NAMES = {"note", "notes", "caption", "comment", "备注", "说明"}

_NUM_STRIP = re.compile(r"[\s,_$€£¥₩₹]")


class DataError(ValueError):
    """A problem with the input data. ``str()`` is a user-facing message."""


@dataclass
class Series:
    name: str
    values: list[float | None]
    filled: list[int] = field(default_factory=list)  # row indexes filled by interpolation


@dataclass
class SeriesData:
    times: list[str]
    series: list[Series]
    warnings: list[str] = field(default_factory=list)
    kind: str = "series"

    def to_json(self) -> dict:
        return {
            "kind": "series",
            "times": self.times,
            "series": [{"name": s.name, "values": s.values} for s in self.series],
        }


@dataclass
class Item:
    label: str
    value: float
    note: str = ""


@dataclass
class ItemData:
    items: list[Item]
    warnings: list[str] = field(default_factory=list)
    kind: str = "items"

    def to_json(self) -> dict:
        return {"kind": "items", "items": [{"label": i.label, "value": i.value, "note": i.note} for i in self.items]}


def parse_number(raw: str) -> float | None:
    """Parse '1,234.5', '$3.2e9', '45%', ' 12 ' -> float. Empty -> None. Bad -> ValueError."""
    s = (raw or "").strip()
    if s == "" or s.lower() in {"na", "n/a", "nan", "null", "none", "-", "–", ".."}:
        return None
    s = _NUM_STRIP.sub("", s)
    if s.endswith("%"):
        s = s[:-1]
    if s.startswith("(") and s.endswith(")"):  # accounting negative
        s = "-" + s[1:-1]
    v = float(s)
    if not math.isfinite(v):
        raise ValueError(raw)
    return v


def read_rows(path: str | Path) -> list[list[str]]:
    p = Path(path)
    if not p.exists():
        raise DataError(f"{p}: file not found")
    raw = p.read_bytes()
    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        try:
            text = raw.decode("gb18030")
        except UnicodeDecodeError as exc:
            raise DataError(f"{p}: not UTF-8 text ({exc})") from None
    sample = text[:4096]
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=",;\t")
    except csv.Error:
        dialect = csv.excel
    rows = [r for r in csv.reader(io.StringIO(text), dialect) if any(c.strip() for c in r)]
    if not rows:
        raise DataError(f"{p}: the file is empty")
    return [[c.strip() for c in r] for r in rows]


def _norm(h: str) -> str:
    return h.strip().lower()


def _is_long(header: list[str]) -> tuple[int, int, int] | None:
    hs = [_norm(h) for h in header]
    if len(hs) != 3:
        return None
    t = next((i for i, h in enumerate(hs) if h in TIME_NAMES), None)
    n = next((i for i, h in enumerate(hs) if h in NAME_NAMES), None)
    v = next((i for i, h in enumerate(hs) if h in VALUE_NAMES), None)
    if None in (t, n, v) or len({t, n, v}) != 3:
        return None
    return t, n, v


def _fill_gaps(values: list[float | None]) -> tuple[list[float | None], list[int]]:
    """Linearly fill *interior* gaps; leading/trailing blanks stay None (series absent)."""
    known = [i for i, v in enumerate(values) if v is not None]
    out = list(values)
    filled: list[int] = []
    for a, b in zip(known, known[1:]):
        for i in range(a + 1, b):
            f = (i - a) / (b - a)
            out[i] = values[a] + (values[b] - values[a]) * f  # type: ignore[operator]
            filled.append(i)
    return out, filled


def _time_key(label: str):
    try:
        return (0, float(label))
    except ValueError:
        return (1, label)


def load_series(path: str | Path, *, min_rows: int = 2) -> SeriesData:
    rows = read_rows(path)
    header, body = rows[0], rows[1:]
    where = Path(path).name
    if len(header) < 2:
        raise DataError(f"{where}: need at least 2 columns (period + one series); got header {header!r}")
    warnings: list[str] = []

    long = _is_long(header)
    times: list[str] = []
    table: dict[str, dict[str, float | None]] = {}
    order: list[str] = []
    if long:
        ti, ni, vi = long
        for r_no, row in enumerate(body, start=2):
            if len(row) < 3:
                raise DataError(f"{where}:{r_no}: expected 3 columns ({', '.join(header)}), got {len(row)}")
            t, name = row[ti], row[ni]
            if not t or not name:
                raise DataError(f"{where}:{r_no}: empty period or name")
            try:
                v = parse_number(row[vi])
            except ValueError:
                raise DataError(f"{where}:{r_no}: {header[vi]!r} is not a number: {row[vi]!r}") from None
            if t not in table:
                table[t] = {}
                times.append(t)
            if name not in order:
                order.append(name)
            if name in table[t]:
                raise DataError(f"{where}:{r_no}: duplicate row for period {t!r} and name {name!r}")
            table[t][name] = v
        names = order
    else:
        names = header[1:]
        if any(not n for n in names):
            raise DataError(f"{where}:1: every series column needs a name in the header row")
        dup = sorted({n for n in names if names.count(n) > 1})
        if dup:
            raise DataError(f"{where}:1: duplicate series names: {', '.join(dup)}")
        for r_no, row in enumerate(body, start=2):
            if len(row) > len(header):
                raise DataError(f"{where}:{r_no}: {len(row)} cells but the header has {len(header)} columns")
            row = row + [""] * (len(header) - len(row))
            t = row[0]
            if not t:
                raise DataError(f"{where}:{r_no}: the first column (period) is empty")
            if t in table:
                raise DataError(f"{where}:{r_no}: period {t!r} appears twice")
            vals: dict[str, float | None] = {}
            for c, name in enumerate(names, start=1):
                try:
                    vals[name] = parse_number(row[c])
                except ValueError:
                    raise DataError(f"{where}:{r_no}: column {name!r} is not a number: {row[c]!r}") from None
            table[t] = vals
            times.append(t)

    if len(times) < min_rows:
        raise DataError(f"{where}: need at least {min_rows} periods (rows) to animate, found {len(times)}")
    keys = [_time_key(t) for t in times]
    if all(k[0] == 0 for k in keys) and keys != sorted(keys):
        raise DataError(f"{where}: periods must be in ascending order (first column); found {times[:6]}…")

    series: list[Series] = []
    for name in names:
        raw = [table[t].get(name) for t in times]
        if all(v is None for v in raw):
            warnings.append(f"series {name!r} has no values and was dropped")
            continue
        filled_vals, filled = _fill_gaps(raw)
        if filled:
            warnings.append(f"series {name!r}: {len(filled)} blank cell(s) filled by linear interpolation")
        series.append(Series(name=name, values=filled_vals, filled=filled))
    if not series:
        raise DataError(f"{where}: no numeric data found")
    if len(series) > 40:
        warnings.append(f"{len(series)} series; only the top ones are shown at any time")
    return SeriesData(times=times, series=series, warnings=warnings)


def load_items(path: str | Path) -> ItemData:
    rows = read_rows(path)
    header, body = rows[0], rows[1:]
    where = Path(path).name
    hs = [_norm(h) for h in header]
    li = next((i for i, h in enumerate(hs) if h in NAME_NAMES | TIME_NAMES), 0)
    vi = next((i for i, h in enumerate(hs) if h in VALUE_NAMES), 1 if len(hs) > 1 else None)
    ni = next((i for i, h in enumerate(hs) if h in NOTE_NAMES), None)
    if vi is None or vi == li:
        raise DataError(f"{where}:1: counter data needs columns 'label,value[,note]'; got {header!r}")
    items: list[Item] = []
    for r_no, row in enumerate(body, start=2):
        row = row + [""] * (len(header) - len(row))
        try:
            v = parse_number(row[vi])
        except ValueError:
            raise DataError(f"{where}:{r_no}: value is not a number: {row[vi]!r}") from None
        if v is None:
            raise DataError(f"{where}:{r_no}: value is empty")
        items.append(Item(label=row[li], value=v, note=row[ni] if ni is not None else ""))
    if not items:
        raise DataError(f"{where}: no rows after the header")
    warnings = []
    if len(items) > 6:
        warnings.append(f"{len(items)} items; counters read best with 2-5")
    return ItemData(items=items, warnings=warnings)


def load(path: str | Path, template: str):
    if template == "counter":
        return load_items(path)
    data = load_series(path)
    if template == "share":
        for s in data.series:
            if any(v is not None and v < 0 for v in s.values):
                raise DataError(f"{Path(path).name}: share charts need non-negative values; {s.name!r} has a negative value")
    elif template == "race":
        if any(v is not None and v < 0 for s in data.series for v in s.values):
            data.warnings.append("negative values are drawn as empty bars in a race")
    return data


def slice_times(data: SeriesData, start: str | None, end: str | None) -> SeriesData:
    """Keep rows from ``start`` to ``end`` (inclusive, matched against the period labels)."""
    times = data.times
    i0 = 0 if start is None else _index(times, start, "--start")
    i1 = len(times) - 1 if end is None else _index(times, end, "--end")
    if i1 - i0 < 1:
        raise DataError(f"--start/--end leave fewer than 2 periods ({times[i0]}..{times[i1]})")
    keep = []
    for s in data.series:
        vals = s.values[i0 : i1 + 1]
        if all(v is None for v in vals):
            continue
        keep.append(Series(s.name, vals, [i - i0 for i in s.filled if i0 <= i <= i1]))
    return SeriesData(times=times[i0 : i1 + 1], series=keep, warnings=data.warnings)


def _index(times: list[str], label: str, flag: str) -> int:
    if label in times:
        return times.index(label)
    raise DataError(f"{flag} {label!r} is not a period in the data (have {times[0]}..{times[-1]})")
