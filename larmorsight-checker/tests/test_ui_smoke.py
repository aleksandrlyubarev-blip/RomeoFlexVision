"""UI smoke test — requires a Qt-capable display + pytest-qt."""

from __future__ import annotations

import sys

import pytest

pytestmark = pytest.mark.macos

if sys.platform != "darwin":
    pytest.skip("UI smoke runs only on macOS", allow_module_level=True)


def test_main_window_constructs(qtbot) -> None:
    from larmorsight_checker.config.settings import Settings
    from larmorsight_checker.ui.main_window import MainWindow

    window = MainWindow(Settings.load())
    qtbot.addWidget(window)
    assert window.windowTitle().startswith("LarmorSight")
