"""macOS screenshot capture utility used by the Tauri Rust side (not directly by API)."""
from __future__ import annotations

import subprocess
import tempfile
from pathlib import Path

from app.utils.logging import get_logger

logger = get_logger(__name__)


def capture_screen(output_path: str | None = None) -> str:
    """Capture the full screen and return the saved file path."""
    if output_path is None:
        tmp = tempfile.NamedTemporaryFile(suffix=".png", delete=False, prefix="localcopilot_")
        output_path = tmp.name
        tmp.close()

    result = subprocess.run(
        ["screencapture", "-x", "-t", "png", output_path],
        capture_output=True,
        timeout=10,
    )
    if result.returncode != 0:
        raise RuntimeError(
            f"screencapture failed: {result.stderr.decode()}"
        )
    logger.info("Screenshot saved to %s", output_path)
    return output_path


def capture_window(output_path: str | None = None) -> str:
    """Capture the interactive window selection on macOS."""
    if output_path is None:
        tmp = tempfile.NamedTemporaryFile(suffix=".png", delete=False, prefix="localcopilot_")
        output_path = tmp.name
        tmp.close()

    result = subprocess.run(
        ["screencapture", "-i", "-t", "png", output_path],
        capture_output=True,
        timeout=30,
    )
    if result.returncode != 0:
        raise RuntimeError(f"screencapture failed: {result.stderr.decode()}")
    return output_path
