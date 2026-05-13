"""Pytest conftest: подготовка окружения до импорта app."""
import os

os.environ.setdefault("ANTHROPIC_API_KEY", "test-key-placeholder")
os.environ.setdefault("LARMORSIGHT_EMPLOYEE", "research-analyst")
# LARMORSIGHT_SKILLS_BUCKET намеренно не задаём — тесты должны идти без обращения к GCS.
