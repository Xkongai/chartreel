# Open data sources that are easy to cite

Always keep the raw download and record: source, indicator/table code, retrieval date, license.

| Source | Good for | License | How |
| --- | --- | --- | --- |
| World Bank Indicators API | GDP, population, life expectancy, CO₂, internet use … by country/region, 1960– | CC BY 4.0 | `https://api.worldbank.org/v2/country/CHN;IND;USA/indicator/SP.POP.TOTL?date=1960:2024&format=json&per_page=20000` (send a normal User-Agent header) |
| Our World in Data | energy mix, emissions, health, technology adoption | CC BY 4.0 (check each chart) | every chart page has "Download → CSV"; the pattern is `https://ourworldindata.org/grapher/<chart-slug>.csv` |
| FRED (St. Louis Fed) | US macro series, rates, prices | mostly public domain; check series notes | `https://fred.stlouisfed.org/graph/fredgraph.csv?id=GDP` |
| Eurostat | EU statistics | CC BY 4.0 | dataset browser → download CSV |
| UN Data / UN WPP | population estimates and projections | CC BY 3.0 IGO | https://population.un.org/wpp/downloads |
| 国家统计局 data.stats.gov.cn | 中国年度/月度统计 | 注明来源 | 数据查询 → 下载 CSV/Excel |
| GitHub / package registries APIs | stars, downloads over time | per service terms | cite the API and date |

World Bank indicator codes used in the examples: `NY.GDP.MKTP.CD` (GDP, current US$), `SP.POP.TOTL`
(population). Region aggregates: `EAS SAS SSF ECS LCN MEA NAC`.

Checklist before rendering:
- Same unit and base year across all series (nominal vs real, per-capita vs total).
- Note when the latest year is an estimate or preliminary.
- Aggregates (e.g. regions) may not sum exactly to the world total; say "share of these N regions" if needed.
