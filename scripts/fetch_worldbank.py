#!/usr/bin/env python3
"""Re-download the example datasets from the World Bank Indicators API.

Usage:  python scripts/fetch_worldbank.py

Data: World Bank, World Development Indicators, licensed CC BY 4.0
(https://datacatalog.worldbank.org/public-licenses#cc-by). Only the standard
library is used, so this works without installing chartreel.
"""
from __future__ import annotations

import csv
import json
import sys
import urllib.request
from pathlib import Path

API = "https://api.worldbank.org/v2/country/{codes}/indicator/{indicator}?date={start}:{end}&format=json&per_page=20000"
HERE = Path(__file__).resolve().parent.parent / "examples"
UA = "chartreel-example-fetcher/0.1 (+https://github.com/Xkongai/chartreel)"


def fetch(codes: list[str], indicator: str, start: int, end: int) -> dict[tuple[str, int], float]:
    url = API.format(codes=";".join(codes), indicator=indicator, start=start, end=end)
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        payload = json.load(resp)
    if not isinstance(payload, list) or len(payload) < 2:
        raise SystemExit(f"unexpected response from {url}: {payload!r:.300}")
    out: dict[tuple[str, int], float] = {}
    for row in payload[1] or []:
        if row.get("value") is None:
            continue
        out[(row["countryiso3code"], int(row["date"]))] = float(row["value"])
    return out


def write_wide(path: Path, names: dict[str, str], values: dict[tuple[str, int], float], years: range, time_col: str = "year") -> None:
    with path.open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow([time_col, *names.values()])
        for y in years:
            row = [y]
            for code in names:
                v = values.get((code, y))
                row.append("" if v is None else f"{v:.0f}")  # whole dollars / people
            w.writerow(row)
    print(f"wrote {path.relative_to(HERE.parent)}")


def main() -> int:
    HERE.mkdir(exist_ok=True)

    # 1) GDP (current US$) bar chart race, 1990-2024.
    gdp = {
        "USA": "United States", "CHN": "China", "JPN": "Japan", "DEU": "Germany",
        "IND": "India", "GBR": "United Kingdom", "FRA": "France", "ITA": "Italy",
        "BRA": "Brazil", "CAN": "Canada", "RUS": "Russia", "KOR": "South Korea",
        "ESP": "Spain", "AUS": "Australia", "MEX": "Mexico", "IDN": "Indonesia",
    }
    vals = fetch(list(gdp), "NY.GDP.MKTP.CD", 1990, 2024)
    write_wide(HERE / "gdp-race.csv", gdp, vals, range(1990, 2025))

    # 2) Population, China vs India (and others), line race with Chinese labels.
    pop = {"CHN": "中国", "IND": "印度", "USA": "美国", "IDN": "印度尼西亚", "PAK": "巴基斯坦", "NGA": "尼日利亚"}
    vals = fetch(list(pop), "SP.POP.TOTL", 1960, 2024)
    write_wide(HERE / "population-zh.csv", pop, vals, range(1960, 2025))

    # 3) Share of world population by World Bank region, 1960-2024.
    regions = {
        "EAS": "East Asia & Pacific", "SAS": "South Asia", "SSF": "Sub-Saharan Africa",
        "ECS": "Europe & Central Asia", "LCN": "Latin America & Caribbean",
        "MEA": "Middle East & North Africa", "NAC": "North America",
    }
    vals = fetch(list(regions), "SP.POP.TOTL", 1960, 2024)
    write_wide(HERE / "population-share.csv", regions, vals, range(1960, 2024 + 1, 4))

    # 4) Counter: China's GDP at three points in time.
    vals = fetch(["CHN"], "NY.GDP.MKTP.CD", 1980, 2024)
    with (HERE / "china-gdp-counter.csv").open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["label", "value", "note"])
        for y, note in ((1980, "改革开放初期"), (2000, "加入世贸前夕"), (2024, "最新数据")):
            w.writerow([f"{y}年", f"{vals[('CHN', y)]:.0f}", note])
    print("wrote examples/china-gdp-counter.csv")
    return 0


if __name__ == "__main__":
    sys.exit(main())
