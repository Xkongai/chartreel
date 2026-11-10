<p align="center">
  <img src="docs/hero.gif" alt="Carrera de barras de chartreel: las mayores economías del mundo 1990–2024, datos del Banco Mundial" width="100%">
</p>

<h1 align="center">chartreel</h1>

<p align="center">
  <b>Una Agent Skill + CLI que convierte un CSV en un vídeo corto de datos animados con cifras exactas.</b><br>
  Carrera de barras, carrera de líneas, contador de grandes cifras y cambio de proporciones — MP4 + GIF + portada, 9:16 o 16:9, compatible con chino.
</p>

<p align="center">
  <a href="https://github.com/Xkongai/chartreel/actions/workflows/ci.yml"><img src="https://github.com/Xkongai/chartreel/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT"></a>
  <img src="https://img.shields.io/badge/python-3.10%2B-3776AB.svg" alt="Python 3.10+">
  <img src="https://img.shields.io/badge/Agent%20Skill-Claude%20Code%20%7C%20Codex%20%7C%20Cursor-8A2BE2.svg" alt="Agent Skill">
</p>

<p align="center">
  <a href="README.md">English</a> | <a href="README.zh-CN.md">简体中文</a> | <a href="README.ja.md">日本語</a> | <b>Español</b> | <a href="README.pt-BR.md">Português (Brasil)</a> | <a href="README.fr.md">Français</a> | <a href="README.de.md">Deutsch</a> | <a href="README.ko.md">한국어</a> | <a href="README.ru.md">Русский</a>
</p>

Los vídeos de datos —«las mayores economías del mundo, 1990–2024», «China contra India en población»— funcionan muy bien en
Douyin, Xiaohongshu, YouTube Shorts, Reels y X. Hacer uno suele requerir After Effects, una suscripción a Flourish o un
cuaderno lleno de código de matplotlib. **chartreel** le da a tu agente de IA una skill para ello: el agente busca datos reales,
escribe la historia (gancho, momentos clave, conclusión) y renderiza el clip terminado. Cada número en pantalla sale de tu CSV.

> **Pídeselo a tu agente:** «Haz una carrera de barras vertical de 15 segundos con las 10 mayores economías desde 1990,
> con datos del Banco Mundial y una conclusión al final.»

## Galería

| Carrera de líneas (etiquetas en chino, `paper`) | Contador de grandes cifras (`neon`) |
| --- | --- |
| <img src="docs/line-race.gif" alt="Carrera de líneas: población de China e India 1960–2024" width="100%"> | <img src="docs/counter.gif" alt="Contador: PIB de China en 1980, 2000 y 2024" width="100%"> |
| **Cambio de proporciones (`paper`)** | **Vertical 9:16 para Shorts / Douyin (`neon`)** |
| <img src="docs/share.gif" alt="Gráfico de gofre: proporción de la población mundial por región" width="100%"> | <img src="docs/vertical.gif" alt="Carrera de barras vertical" width="45%"> |

Portadas a tamaño completo: [carrera 9:16](docs/cover-race-9x16.png) · [carrera de líneas 16:9](docs/cover-line-16x9.png).
Todas las demos usan [datos del Banco Mundial (CC BY 4.0)](examples/README.md).

## Instalación

Necesitas Python 3.10+, ffmpeg y Chromium (Playwright lo descarga; también sirve un Chrome ya instalado).

**1. La CLI**

```bash
pip install "git+https://github.com/Xkongai/chartreel"
python -m playwright install chromium     # skip if Chrome/Chromium is installed
chartreel doctor                          # checks ffmpeg, Chromium and fonts
```

ffmpeg: `brew install ffmpeg` (macOS) · `sudo apt install ffmpeg` (Ubuntu) · `winget install Gyan.FFmpeg` (Windows).
Para texto en chino, japonés o coreano en Linux: `sudo apt install fonts-noto-cjk fonts-noto-color-emoji`.

**2. La skill** (elige tu agente)

| Agente | Instalación |
| --- | --- |
| Claude Code | `/plugin marketplace add Xkongai/chartreel` y luego `/plugin install chartreel@chartreel` |
| Codex | `git clone https://github.com/Xkongai/chartreel && mkdir -p ~/.agents/skills && cp -r chartreel/skills/chartreel ~/.agents/skills/` |
| Cursor, OpenCode, Gemini CLI y otros | `npx skills add Xkongai/chartreel -g` |
| Cualquier agente que lea `SKILL.md` | copia `skills/chartreel/` en la carpeta de skills del agente |

Claude Code también lee `~/.claude/skills/chartreel/` si prefieres copiar la carpeta a mano.

## Inicio rápido (CLI)

```bash
git clone https://github.com/Xkongai/chartreel && cd chartreel
chartreel render examples/gdp-race.csv -c examples/gdp-race.json -o out/
# out/gdp-race.mp4   1080×1920 H.264, 12 s
# out/gdp-race.gif   540 px wide
# out/gdp-race-cover.png
```

O solo con opciones:

```bash
chartreel render my.csv --template line --theme paper --aspect 16:9 --duration 15 \
  --title "China vs India" --source "World Bank, CC BY 4.0" --takeaway "India passed China in 2021" \
  --note "2021: India passes China" --locale zh -o out/
```

`chartreel validate my.csv` revisa el archivo primero y señala la fila y la columna exactas de cualquier problema.
`chartreel preview my.csv -o out/` genera un reproductor HTML autónomo que puedes recorrer en el navegador.

## Plantillas y temas

| Plantilla | Ideal para | CSV |
| --- | --- | --- |
| `race` | rankings a lo largo del tiempo, adelantamientos | `year,A,B,C…` |
| `line` | pocas series que crecen o se cruzan | `year,A,B,C…` |
| `counter` | una gran cifra y luego comparaciones «×N» | `label,value,note` |
| `share` | partes de un todo que cambian (gofre de 10×10) | `year,A,B,C…` |

Temas: `dark` (tecnológico oscuro), `paper` (periódico, titular con serifa), `neon` (brillo).
Formatos: `9:16`, `16:9`, `1:1`, `4:5`, `3:4`. El formato largo `year,name,value` se convierte automáticamente.

Opciones de la historia: `--title` (el gancho), `--subtitle` (unidades), `--note "PERIODO: texto"` (momentos clave),
`--takeaway` (tarjeta final), `--source` (siempre visible). Números: `--prefix $`, `--suffix`, `--decimals`,
`--number-style compact|full|percent`, `--locale zh` (万 / 亿 / 万亿). `label`, `color` y `emoji` por serie
van en un archivo JSON de configuración. Lista completa: [skills/chartreel/references/options.md](skills/chartreel/references/options.md).

## Cómo se mantienen exactas las cifras

- En el momento en que cada fila aparece en pantalla, cada valor es igual al del CSV; entre filas se usa una
  interpolación lineal entre las dos filas vecinas. `tests/test_accuracy.py` lo comprueba en cada ejemplo, en varios
  formatos, y verifica que el ranking de la carrera coincide con los datos en cada fila.
- Las celdas vacías intermedias se interpolan y `validate` las informa; nada se rellena de memoria.
- El contador sube y luego se detiene en el valor exacto. El gofre siempre tiene exactamente 100 celdas (resto mayor).
- La skill le indica al agente que obtenga los datos de una fuente primaria, calcule las conclusiones con código y cite siempre la fuente.

## Cómo funciona

Cada plantilla es una página HTML autónoma con un `renderFrame(t)` determinista —sin reloj del sistema ni aleatoriedad—,
así que el mismo fotograma se ve idéntico en la vista previa del navegador y en la exportación. chartreel controla
Chromium sin interfaz con Playwright, captura cada fotograma y lo pasa a ffmpeg (H.264 `yuv420p`, `+faststart`;
GIF con `palettegen`). Varios procesos de navegador renderizan tramos en paralelo (`--jobs`).

Medido en una máquina Linux de 8 núcleos: una carrera de 12 s a 1080×1920 (360 fotogramas) se renderiza en unos 9 s
con 4 procesos (unos 27 s con uno).

## Limitaciones

- Las fuentes vienen del sistema. Sin una fuente CJK, el texto chino aparece como cuadros; `chartreel doctor` te avisa.
  Los emojis de banderas no se ven en Windows (su fuente de emojis no tiene banderas).
- Aún no hay pista de audio ni fotogramas clave personalizados; el tiempo entre filas es uniforme.
- La plantilla `line` se lee mejor con hasta unas 8 series; `share`, con hasta unas 10 partes.

## Desarrollo

```bash
pip install -e ".[dev]" && python -m playwright install chromium
pytest -q                       # parsing, accuracy, deterministic frames, smoke renders
bash scripts/make_demos.sh      # regenerate docs/*.gif
python scripts/fetch_worldbank.py   # re-download the example data
```

Consulta [CONTRIBUTING.md](CONTRIBUTING.md) y [CHANGELOG.md](CHANGELOG.md).

## Licencia

[MIT](LICENSE) © 2026 Xkongai. Datos de ejemplo: Banco Mundial, Indicadores del Desarrollo Mundial, CC BY 4.0.
