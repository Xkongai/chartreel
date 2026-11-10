import shutil
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
EXAMPLES = ROOT / "examples"


@pytest.fixture
def examples() -> Path:
    return EXAMPLES


_BROWSER: list = []


def browser_ok() -> bool:
    """True when Playwright can start a Chromium (checked once per session)."""
    if not _BROWSER:
        try:
            from playwright.sync_api import sync_playwright

            from chartreel.render import launch_browser

            with sync_playwright() as pw:
                launch_browser(pw).close()
            _BROWSER.append(True)
        except Exception:  # noqa: BLE001
            _BROWSER.append(False)
    return _BROWSER[0]


@pytest.fixture
def need_browser():
    if not browser_ok():
        pytest.skip("Chromium not available (python -m playwright install chromium)")


@pytest.fixture
def need_ffmpeg():
    if not (shutil.which("ffmpeg") and shutil.which("ffprobe")):
        pytest.skip("ffmpeg/ffprobe not installed")
