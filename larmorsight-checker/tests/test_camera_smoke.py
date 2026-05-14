"""Camera smoke test — requires a real macOS host with a UVC camera."""

from __future__ import annotations

import sys

import pytest

pytestmark = pytest.mark.macos

if sys.platform != "darwin":
    pytest.skip("camera smoke runs only on macOS", allow_module_level=True)


def test_open_default_camera_grabs_frame() -> None:
    from larmorsight_checker.camera.uvc_camera import UVCCamera

    cam = UVCCamera(index=0)
    assert cam.open(), "expected default UVC camera to open"
    try:
        frame = cam.read()
        assert frame is not None
        assert frame.ndim == 3 and frame.shape[2] == 3
    finally:
        cam.close()
