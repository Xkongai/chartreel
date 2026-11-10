"""Frame-by-frame rendering: headless Chromium -> PNG frames -> ffmpeg."""
from __future__ import annotations

import base64
import multiprocessing
import os
import shutil
import subprocess
import sys
import tempfile
import time
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

from .spec import build_html

CHROME_CANDIDATES = [
    "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
]
CHROME_ARGS = ["--force-color-profile=srgb", "--hide-scrollbars", "--disable-lcd-text", "--font-render-hinting=none"]


class RenderError(RuntimeError):
    pass


def ffmpeg_path() -> str:
    exe = os.environ.get("CHARTREEL_FFMPEG") or shutil.which("ffmpeg")
    if not exe:
        raise RenderError("ffmpeg not found. Install it (macOS: brew install ffmpeg · Ubuntu: sudo apt install ffmpeg · "
                          "Windows: winget install Gyan.FFmpeg) or set CHARTREEL_FFMPEG=/path/to/ffmpeg")
    return exe


def launch_browser(pw):
    """Playwright's own Chromium first, then a system Chrome/Chromium."""
    explicit = os.environ.get("CHARTREEL_CHROME")
    if explicit:
        return pw.chromium.launch(executable_path=explicit, args=CHROME_ARGS)
    try:
        return pw.chromium.launch(args=CHROME_ARGS)
    except Exception as first:  # browser not downloaded
        for path in CHROME_CANDIDATES:
            if Path(path).exists():
                return pw.chromium.launch(executable_path=path, args=CHROME_ARGS)
        raise RenderError("no Chromium found. Run:  python -m playwright install chromium   "
                          f"(or set CHARTREEL_CHROME=/path/to/chrome)\n  detail: {str(first).splitlines()[0]}") from None


class Page:
    """A loaded template page. Use as a context manager."""

    def __init__(self, spec: dict):
        self.spec = spec

    def __enter__(self):
        try:
            from playwright.sync_api import sync_playwright
        except ImportError:
            raise RenderError("playwright is not installed: pip install playwright && python -m playwright install chromium") from None
        self._pw_cm = sync_playwright()
        pw = self._pw_cm.__enter__()
        try:
            self.browser = launch_browser(pw)
            self.page = self.browser.new_page(viewport={"width": self.spec["width"], "height": self.spec["height"]},
                                              device_scale_factor=1)
            errors: list[str] = []
            self.page.on("pageerror", lambda e: errors.append(str(e)))
            self.page.set_content(build_html(self.spec, render_mode=True), wait_until="load")
            self.page.evaluate("() => window.chartreel.ready")
            if errors:
                raise RenderError("template error: " + errors[0])
            self.cdp = self.page.context.new_cdp_session(self.page)
        except BaseException:
            self.__exit__(*sys.exc_info())
            raise
        return self

    def __exit__(self, *exc):
        try:
            if getattr(self, "browser", None):
                self.browser.close()
        finally:
            self._pw_cm.__exit__(*exc)

    def eval(self, expr: str, arg=None):
        return self.page.evaluate(expr, arg)

    def state(self, t: float) -> dict:
        return self.page.evaluate("t => window.chartreel.state(t)", t)

    def key_times(self) -> list[float]:
        return self.page.evaluate("() => window.chartreel.keyTimes()")

    def frame_png(self, t: float) -> bytes:
        self.page.evaluate("t => window.chartreel.renderFrame(t)", t)
        shot = self.cdp.send("Page.captureScreenshot", {"format": "png", "optimizeForSpeed": True,
                                                        "captureBeyondViewport": False})
        return base64.b64decode(shot["data"])


def frame_times(duration: float, fps: int) -> list[float]:
    n = max(1, int(round(duration * fps)))
    return [i / fps for i in range(n)]


def render(spec: dict, out_dir: Path, name: str, formats: set[str], *, gif_width: int | None = None,
           gif_fps: int = 15, cover_at: str | float = "end", crf: int = 18, jobs: int | None = None,
           audio: str | Path | None = None, audio_fade: float = 1.0, log=print) -> dict:
    out_dir.mkdir(parents=True, exist_ok=True)
    result: dict = {"files": {}, "frames": 0}
    t_start = time.perf_counter()
    if "html" in formats:
        html_path = out_dir / f"{name}.html"
        html_path.write_text(build_html(spec), encoding="utf-8")
        result["files"]["html"] = html_path
    need_video = bool(formats & {"mp4", "gif"})
    if not (need_video or "png" in formats):
        return result
    ff = ffmpeg_path() if need_video else None
    times = frame_times(spec["duration"], spec["fps"])
    mp4 = out_dir / f"{name}.mp4"
    tmp_mp4 = None
    if "mp4" not in formats and need_video:
        tmp_mp4 = Path(tempfile.mkstemp(suffix=".mp4")[1])
    video_path = mp4 if "mp4" in formats else tmp_mp4

    if "png" in formats:
        with Page(spec) as page:
            if cover_at in ("end", None):
                t_cover = times[-1]
            elif cover_at == "start":
                t_cover = 0.0
            else:
                t_cover = min(max(float(cover_at), 0.0), spec["duration"])
            cover = out_dir / f"{name}-cover.png"
            cover.write_bytes(page.frame_png(t_cover))
            result["files"]["png"] = cover
    if need_video:
        jobs = _jobs(jobs, len(times))
        t0 = time.perf_counter()
        if jobs == 1:
            _encode_chunk(spec, 0, len(times), str(video_path), crf, ff, log)
        else:
            # split the timeline into contiguous chunks, encode each in its own browser, then concatenate
            tmpdir = Path(tempfile.mkdtemp(prefix="chartreel-"))
            bounds = [round(i * len(times) / jobs) for i in range(jobs + 1)]
            parts = [tmpdir / f"part{i:02d}.mp4" for i in range(jobs)]
            try:
                with ProcessPoolExecutor(max_workers=jobs, mp_context=multiprocessing.get_context("spawn")) as ex:
                    futs = [ex.submit(_encode_chunk, spec, bounds[i], bounds[i + 1], str(parts[i]), crf, ff, None)
                            for i in range(jobs)]
                    for f in futs:
                        f.result()
                lst = tmpdir / "list.txt"
                lst.write_text("".join(f"file '{p.as_posix()}'\n" for p in parts), encoding="utf-8")
                res = subprocess.run([ff, "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(lst),
                                      "-c", "copy", "-movflags", "+faststart", str(video_path)],
                                     capture_output=True, text=True)
                if res.returncode != 0:
                    raise RenderError("ffmpeg concat failed: " + res.stderr.strip()[-800:])
            finally:
                shutil.rmtree(tmpdir, ignore_errors=True)
        if log:
            el = time.perf_counter() - t0
            log(f"  {len(times)} frames in {el:.1f}s ({len(times) / max(el, 1e-6):.1f} fps, {jobs} job{'s' if jobs > 1 else ''})")
        result["frames"] = len(times)
        result["jobs"] = jobs
        if "mp4" in formats:
            if audio:
                add_audio(ff, mp4, Path(audio), spec["duration"], fade=audio_fade)
                result["audio"] = str(audio)
            result["files"]["mp4"] = mp4

    if "gif" in formats:
        gif = out_dir / f"{name}.gif"
        make_gif(ff, video_path, gif, width=gif_width or min(spec["width"], 540), fps=gif_fps)
        result["files"]["gif"] = gif
    if tmp_mp4:
        tmp_mp4.unlink(missing_ok=True)
    result["seconds"] = time.perf_counter() - t_start
    return result


def add_audio(ff: str, video: Path, audio: Path, duration: float, *, fade: float = 1.0) -> None:
    """Mux a user-supplied track under the video: trimmed (or padded with silence) to the video
    length, faded in and out, AAC 192 kb/s. The video stream is copied, not re-encoded."""
    if not audio.is_file():
        raise RenderError(f"audio file not found: {audio}")
    fade = max(0.0, min(fade, duration / 3))
    chain = f"[1:a]atrim=0:{duration:.3f},asetpts=PTS-STARTPTS"
    if fade > 0:
        chain += f",afade=t=in:st=0:d={fade:.3f},afade=t=out:st={max(0.0, duration - fade):.3f}:d={fade:.3f}"
    chain += ",apad[a]"
    tmp = video.with_name(video.stem + ".audio-tmp.mp4")
    res = subprocess.run([ff, "-y", "-loglevel", "error", "-i", str(video), "-i", str(audio), "-filter_complex", chain,
                          "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
                          "-t", f"{duration:.3f}", "-movflags", "+faststart", str(tmp)], capture_output=True, text=True)
    if res.returncode != 0:
        tmp.unlink(missing_ok=True)
        raise RenderError("ffmpeg could not add the audio track: " + res.stderr.strip()[-800:])
    tmp.replace(video)


def _jobs(jobs: int | None, n_frames: int) -> int:
    if jobs is None or jobs <= 0:
        jobs = max(1, min(4, (os.cpu_count() or 2) // 2))
    return max(1, min(jobs, n_frames // 30 or 1))


def _encode_chunk(spec: dict, start: int, end: int, path: str, crf: int, ff: str, log) -> None:
    """Render frames [start, end) into an H.264 file (runs in a worker process when jobs > 1)."""
    times = frame_times(spec["duration"], spec["fps"])
    cmd = [ff, "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", str(spec["fps"]), "-c:v", "png",
           "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", str(crf), "-pix_fmt", "yuv420p",
           "-movflags", "+faststart", "-r", str(spec["fps"]), path]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE)
    t0 = time.perf_counter()
    try:
        with Page(spec) as page:
            for i in range(start, end):
                proc.stdin.write(page.frame_png(times[i]))
                if log and ((i - start) % max(1, spec["fps"]) == 0 or i == end - 1):
                    el = time.perf_counter() - t0
                    log(f"\r  frame {i + 1}/{len(times)}  ({(i - start + 1) / max(el, 1e-6):.1f} fps)", end="")
        proc.stdin.close()
    except BrokenPipeError:
        pass
    finally:
        if proc.stdin and not proc.stdin.closed:
            proc.stdin.close()
    err = proc.stderr.read().decode(errors="replace")
    if proc.wait() != 0:
        raise RenderError("ffmpeg failed: " + err.strip()[-800:])
    if log:
        log("")


def make_gif(ff: str, src: Path, dst: Path, *, width: int, fps: int, colors: int = 256) -> None:
    vf = (f"fps={fps},scale={width}:-2:flags=lanczos,split[a][b];"
          f"[a]palettegen=max_colors={colors}:stats_mode=diff[p];"
          f"[b][p]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle")
    cmd = [ff, "-y", "-loglevel", "error", "-i", str(src), "-vf", vf, "-loop", "0", str(dst)]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        raise RenderError("ffmpeg (gif) failed: " + res.stderr.strip()[-800:])
