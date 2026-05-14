# Qwen 3.6-35B-A3B vs Gemma 4 31B — RoboQC testbed

Сравнение двух основных кандидатов на роль Reasoning Planner / RoboQC Specialist /
Action в 6-ролевом LangGraph-пайплайне RoboQC. Таблица ниже обновляется автоматически
`scripts/bench_roboqc/report.py` по маркерам `<!-- bench:start -->` / `<!-- bench:end -->`.

## Стенд
- **Оборудование:** 1×A100 80GB (a2-ultragpu-1g, europe-west4-b), Spot, Local SSD 375 GB под `/srv/models`.
- **Инференс:** SGLang `latest`, `--enable-mtp`, `--tp 1`, `--mem-fraction-static 0.85`, `--context-length 32768`.
- **Супервайзер:** LangGraph 0.2.x, ModelRouter `rhaef_v2.core.model_router`, prompts из `roboqc_data.prompts`.
- **Модели в сравнении:**
  - `Qwen/Qwen3.6-35B-A3B-FP8` (MoE, 3B active)
  - `google/gemma-4-31b` (dense)
- **Vision (общий):** `Qwen/Qwen3-VL-8B-Instruct` на :30002 во всех прогонах.

## Методика
1. Фикстуры: `scripts/bench_roboqc/fixtures/manifest.jsonl` (20 кейсов, 6 классов дефектов + edge).
2. Прогон для Qwen: `python scripts/bench_roboqc.py --model qwen --n 20 --out results/qwen.jsonl`.
3. Переключение на Gemma (поднимаем profile `gemma`): `python scripts/bench_roboqc.py --model gemma --n 20 --out results/gemma.jsonl`.
4. Агрегация: `python scripts/bench_roboqc/report.py results/qwen.jsonl results/gemma.jsonl --out docs/benchmarks`.

## Метрики
- **End-to-end latency** (frame → action.command) — p50 и mean по всем кейсам.
- **VRAM** — peak в MiB после пайплайна (pynvml).
- **Defect precision/recall** — по предсказанному `DefectClass` vs ground truth.
- **Command match rate** — доля кейсов, где предсказанная `command` совпала с truth.
- **Cost** — для локальных моделей берётся плоский тариф из `scripts/bench_roboqc/pricing.yml`.

## Результаты

<!-- bench:start -->
| Метрика | qwen | gemma |
|---|---|---|
| N (cases) | TBD | TBD |
| Errors | TBD | TBD |
| E2E latency p50 (s) | TBD | TBD |
| E2E latency mean (s) | TBD | TBD |
| VRAM средний (MiB) | TBD | TBD |
| Defect precision | TBD | TBD |
| Defect recall | TBD | TBD |
| Command match rate | TBD | TBD |
| Cost / query (USD) | TBD | TBD |
| TP / FP / FN / TN | TBD | TBD |
<!-- bench:end -->

## Выводы

Обновите этот раздел вручную после первого прогона (по этим метрикам ждём
Qwen 3.6-35B-A3B лучший throughput из-за MoE-активации 3B параметров, Gemma 4 31B —
более стабильное reasoning на длинных цепочках). Рекомендация по RHAEF роутингу
фиксируется в ADR'е после прогона.
