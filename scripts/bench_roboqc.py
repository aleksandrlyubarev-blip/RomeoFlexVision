#!/usr/bin/env python3
"""Бенчмарк-харнесс полигона RoboQC.

Гонит LangGraph pipeline ``rhaef_v2.agents.roboqc.run`` N раз на fixture-манифесте,
записывает JSONL с метриками:
  - end-to-end latency, per-node latency (s)
  - prompt + completion tokens, tokens/s
  - peak VRAM (через pynvml, если есть GPU)
  - совпадение выбранного DefectClass + команды с ground truth
  - cost (из ModelRouter.cost_tracker для cloud-fallback'а + flat-rate из pricing.yml для local)

Использование:
  python scripts/bench_roboqc.py --model qwen --n 20 --out results/qwen.jsonl
  python scripts/bench_roboqc.py --model gemma --n 20 --out results/gemma.jsonl
  python scripts/bench_roboqc/report.py results/qwen.jsonl results/gemma.jsonl \\
      --out docs/benchmarks
"""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
import os
import time
from pathlib import Path
from typing import Any

log = logging.getLogger("bench_roboqc")


def _read_manifest(path: Path) -> list[dict[str, Any]]:
    """Прочитать JSONL-манифест фикстур."""
    cases: list[dict[str, Any]] = []
    with path.open() as fh:
        for line in fh:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            cases.append(json.loads(line))
    return cases


def _gpu_peak_mib() -> float | None:
    try:
        import pynvml  # type: ignore
    except Exception:
        return None
    try:
        pynvml.nvmlInit()
        handle = pynvml.nvmlDeviceGetHandleByIndex(0)
        info = pynvml.nvmlDeviceGetMemoryInfo(handle)
        return float(info.used) / 1024 / 1024
    except Exception:
        return None
    finally:
        try:
            pynvml.nvmlShutdown()
        except Exception:
            pass


def _switch_model(model: str) -> None:
    """Переключаем локальный SGLang endpoint, подменяя $SGLANG_BASE_URL.

    Ожидается, что в .env / startup-скрипте уже выставлены SGLANG_BASE_URL и SGLANG_GEMMA_BASE_URL.
    Иначе ничего не делаем — режим cloud / sticky.
    """
    if model == "qwen":
        env_var = "SGLANG_BASE_URL"
    elif model == "gemma":
        env_var = "SGLANG_GEMMA_BASE_URL"
    else:
        return
    base = os.environ.get(env_var)
    if base:
        os.environ["SGLANG_BASE_URL"] = base
        log.info("SGLANG_BASE_URL -> %s (%s)", base, model)


async def _run_case(case: dict[str, Any], *, model: str, quick: bool) -> dict[str, Any]:
    from rhaef_v2.agents.roboqc.graph import run
    from rhaef_v2.agents.roboqc.state import RoboQCState
    from rhaef_v2.core.model_router import ModelRouter

    router = ModelRouter()
    state = RoboQCState(
        image_uri=case["image_uri"],
        subject=case.get("subject", "unknown"),
        workcell_id=case.get("workcell", "WC-00"),
        max_retries=0 if quick else 2,
    )
    vram_before = _gpu_peak_mib()
    t0 = time.perf_counter()
    try:
        final = await run(state, router=router)
        error = None
    except Exception as exc:  # пиплайн не должен ронять bench: фиксируем и идём дальше
        log.warning("case %s failed: %s", case["id"], exc)
        final, error = None, str(exc)
    elapsed = time.perf_counter() - t0
    vram_after = _gpu_peak_mib()

    pred_class = None
    pred_command = None
    if final and final.specialist and final.specialist.verdict != "ok":
        # выбери проранжированный класс из hypotheses, если specialist не вернул ok
        if final.hypotheses:
            pred_class = final.hypotheses[0].defect_class
        if final.action:
            pred_command = final.action.command
    elif final and final.action:
        pred_command = final.action.command

    record = {
        "case_id": case["id"],
        "defect_class_truth": case.get("defect_class"),
        "defect_class_pred": pred_class,
        "defect_match": pred_class == case.get("defect_class") if case.get("defect_class") else None,
        "command_truth": case.get("command"),
        "command_pred": pred_command,
        "command_match": pred_command == case.get("command") if case.get("command") else None,
        "latency_seconds": elapsed,
        "per_node_latency": {entry["node"]: entry.get("latency_seconds") for entry in (final.trace if final else [])},
        "retries": final.retries if final else None,
        "vram_mib_before": vram_before,
        "vram_mib_after": vram_after,
        "vram_mib_delta": (vram_after - vram_before) if (vram_before is not None and vram_after is not None) else None,
        "cost_usd": router.get_stats().get("total_cost_usd", 0.0),
        "model": model,
        "error": error,
    }
    return record


async def _main(argv: list[str]) -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--model", choices=["qwen", "gemma"], required=True)
    p.add_argument("--manifest", type=Path, default=Path(__file__).parent / "bench_roboqc" / "fixtures" / "manifest.jsonl")
    p.add_argument("--n", type=int, default=20, help="максимум фикстур")
    p.add_argument("--out", type=Path, required=True)
    p.add_argument("--quick", action="store_true", help="без retry-лупа, для CI")
    args = p.parse_args(argv)

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

    if not args.manifest.exists():
        log.error("manifest not found: %s", args.manifest)
        return 2

    _switch_model(args.model)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    cases = _read_manifest(args.manifest)[: args.n]
    log.info("running %d cases on %s, results -> %s", len(cases), args.model, args.out)

    with args.out.open("w") as fh:
        for case in cases:
            record = await _run_case(case, model=args.model, quick=args.quick)
            fh.write(json.dumps(record, ensure_ascii=False) + "\n")
            fh.flush()
            log.info("%s: %.2fs match=%s", record["case_id"], record["latency_seconds"], record["defect_match"])
    return 0


if __name__ == "__main__":
    import sys

    sys.exit(asyncio.run(_main(sys.argv[1:])))
