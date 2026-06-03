# Repo review — 2026-06-03

Состояние монорепозитория после ночного прохода: что проверено, что починено,
и какие решения остаются за человеком.

## TL;DR

Репозиторий **рабочий**. Все сборки и тест-сьюты зелёные после корректной
настройки окружения. «Поломки», которые мешали с ходу прогнать тесты, были
**в окружении, а не в коде** (битый `cffi`, недостающие extras, системные
Qt-библиотеки). Добавлены воспроизводимые `dev-setup.sh` / `dev-test.sh`,
вычищен мёртвый legacy-workflow, поправлен один реальный баг и линт.

## Проверено (всё зелёное)

| Компонент | Команда | Результат |
|---|---|---|
| rhaef_v2 (root) | `pytest tests/` | **19 passed** |
| roboqc_data | `pytest` (`[cv,brigada]`) | **49 passed** |
| checker | `pytest` (PyQt6, offscreen) | **36 passed, 2 skipped** (macOS-only) |
| romeoflexvision (сайт) | `npm ci && npm run build` | ✅ build + `eslint` clean |
| telegram-bot | `npm run build` (tsc) | ✅ |
| voice-gateway | `npm run build` (tsc) | ✅ |
| ruff | `rhaef_v2 scripts tests`, `roboqc_data/src tests` | ✅ clean |
| Docker | `uvicorn rhaef_v2.core.graph:app` импорт-таргет | ✅ валиден |

Воспроизведение с нуля: `scripts/dev-setup.sh` (+ `--checker` для Qt-приложения),
затем `scripts/dev-test.sh`.

## Починено в этом проходе

1. **Реальный баг** — `scripts/rfv_pipeline/pipeline.py`: в disk-режиме
   `-framerate str(v.avg_fps)` передавался без fallback. При `avg_fps == 0`
   (что возвращает `_frac` при неудачном парсинге) ffmpeg получал `-framerate 0`
   и падал. Приведено к тому же паттерну, что строки 239/542/544
   (`str(v.avg_fps) if v.avg_fps else "30"`).
2. **Мёртвый legacy** — удалены `sync-scene-ops.yml` (+ `scripts/sync-scene-ops.mjs`,
   `romeoflexvision/public/scene-ops.json`). Workflow по cron каждые 6 ч
   коммитил в `main`, подтягивая данные из чужого репозитория `Pino_cut`.
   Проверено: фронтенд `scene-ops.json` нигде не читает — зависимости нет.
   (Совпадает с пунктом «Неделя 1 / A» в ROADMAP.)
3. **Lint** — корневое дерево (`rhaef_v2 scripts tests`) приведено к ruff-clean
   (был 19 нарушений в `scripts/rfv_pipeline/`, включая некорректные
   `f""`-строки и forward-ref на неимпортированный `np`).
4. **Отсутствующий LICENSE** — `checker/pyproject.toml` и READMEs объявляют
   MIT и ссылаются на «LICENSE at the repository root», но файла не было.
   Добавлен MIT `LICENSE`.
5. **Воспроизводимость окружения** — `scripts/dev-setup.sh` / `scripts/dev-test.sh`
   ставят все компоненты и чинят битый `cffi`, который ломал импорт
   `litellm` в этом sandbox-образе.

## Остаётся за человеком (намеренно не трогал)

Это стратегические / необратимые решения — по ROADMAP они «human-only».

- **Брендинг рассинхронизирован.** В дереве сосуществуют `NeutronVision`
  (root README, checker README), `RomeoFlexVision` (имя репо, `romeoflexvision/`),
  `roboqc-landing` (`package.json` лендинга), `rfv-voice-gateway`, `RoboQC`
  (AGENTS/ARCHITECTURE). Открытый PR #26 предлагает ещё одну схему
  («Neuron Vision Display»). Нужно зафиксировать одно каноническое имя.
- **Удаление/архивация подпроектов.** ROADMAP помечает `voice-gateway/` и
  `larmorsight-office/` к архивации, а `larmorsight-office/` ещё содержит
  строку «LarmorSight» (~30 файлов), которую план требует убрать из
  публичного источника. Это удаление кода — оставлено на ваше решение.
- **Открытые PR #25, #26** — не сливал и не закрывал.
- **`grok-2-vision-1212`** в `checker` помечен в ROADMAP как устаревшая модель
  (замена — отдельная задача недели 1/D).
- **Висячая ссылка** в `checker/README.md` на
  `/root/.claude/plans/crystalline-floating-boot.md` (локальный путь, файла нет).

## Заметки по окружению (для будущих сессий)

- `roboqc_data` требует extras `[cv,brigada]` + `opencv-python-headless`.
- `checker` (PyQt6) требует системные `libegl1 libgl1 libxkbcommon0 libdbus-1-3`
  и `QT_QPA_PLATFORM=offscreen` для headless-прогона.
- Если `import litellm` падает с `No module named '_cffi_backend'` —
  `pip install --force-reinstall cffi`.
