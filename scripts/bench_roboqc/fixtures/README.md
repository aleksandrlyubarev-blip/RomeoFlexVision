# Фикстуры бенчмарка

20 кейсов, по три на каждый класс дефекта (positive / negative / boundary) +
2 edge-case'а (low light, окклюзия).

## image_uri

По умолчанию фикстуры лежат в GCS-бакете `gs://<project>-roboqc-models/fixtures/`.
Долейте свои PNG/JPG с теми же путями:

```bash
gsutil -m cp -r local/fixtures/* gs://<project>-roboqc-models/fixtures/
```

Для локального прогона (без GCS) перепишите `image_uri` на абсолютные пути либо
смонтируйте бакет через `gcsfuse`.

## defect_class

Из `roboqc_data/src/roboqc_data/schema/taxonomy.py` (DefectClass). `null` означает "ок, дефекта нет".

## command

Из `ActionCommand.command` (`pick | reject | re_image | hold_for_review`). Ground truth —
решение оператора / SOP для этого кейса.

## Как расширять

Добавьте строку в `manifest.jsonl`. Поля проверяются в `bench_roboqc.py`.
