"""Конкретные бэкенды ModelRouter (локальные/облачные)."""

from .sglang import build_sglang_client

__all__ = ["build_sglang_client"]
