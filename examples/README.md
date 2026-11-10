# Examples

All four datasets come from the **World Bank World Development Indicators**, downloaded from the
World Bank Indicators API on 2026-11-10 (API `lastupdated`: 2026-10-08).
License: **[CC BY 4.0](https://datacatalog.worldbank.org/public-licenses#cc-by)** — attribution: "World Bank, World Development Indicators".

Re-download them with `python scripts/fetch_worldbank.py` (standard library only). Values are
written as whole dollars / whole people, exactly as the API returns them (rounded to the unit).

| File | Indicator | Template | Notes |
| --- | --- | --- | --- |
| `gdp-race.csv` + `gdp-race.json` | `NY.GDP.MKTP.CD` GDP (current US$), 16 economies, 1990–2024 | `race` | takeaway: China 2024 ÷ 1990 = 18,729,668,435,848 ÷ 361,560,229,446 = 51.8 → "52×". China passes Japan between 2009 (5.19T vs 5.34T) and 2010 (6.19T vs 5.81T). |
| `population-zh.csv` + `population-zh.json` | `SP.POP.TOTL` population, 6 countries, 1960–2024, Chinese labels | `line` | India first exceeds China in the 2021 row of this dataset (other sources, e.g. UN WPP, date it to 2023 — the video states "按世界银行数据"). |
| `population-share.csv` + `population-share.json` | `SP.POP.TOTL`, 7 World Bank regions (EAS, SAS, SSF, ECS, LCN, MEA, NAC), every 4 years 1960–2024 | `share` | shares are of the seven regions' total. Sub-Saharan Africa: 7.5% (1960) → 15.8% (2024). |
| `china-gdp-counter.csv` + `china-gdp-counter.json` | `NY.GDP.MKTP.CD`, China, 1980 / 2000 / 2024 | `counter` | 2024 ÷ 1980 = 18,729,668,435,848 ÷ 191,487,500,000 = 97.8 → "约 98 倍"; 2000 ÷ 1980 = 6.39. |

The one-child-policy note (1980) in `population-zh.json` is historical context, not a value from the data.

Render any of them:

```bash
chartreel render examples/gdp-race.csv -c examples/gdp-race.json -o out/
chartreel render examples/population-zh.csv -c examples/population-zh.json -a 16:9 -o out/
chartreel render examples/population-share.csv -c examples/population-share.json --theme paper -o out/
chartreel render examples/china-gdp-counter.csv -c examples/china-gdp-counter.json -o out/
```
