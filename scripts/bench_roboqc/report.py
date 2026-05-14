#!/usr/bin/env python3
"""Агрегатор результатов бенчмарка.

Использование:
  python scripts/bench_roboqc/report.py results/qwen.jsonl results/gemma.jsonl \\
      --out docs/benchmarks
Собирает CSV и подставляет Markdown-таблицу в docs/benchmarks/qwen-vs-gemma.md.
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import re
from pathlib import Path
from statistics import mean, median
from typing import Any, Iterable

MARKER_START = "<!-- bench:start -->"
MARKER_END = "<!-- bench:end -->"


def _read(path: Path) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    with path.open() as fh:
        for line in fh:
            line = line.strip()
            if line:
                records.append(json.loads(line))
    return records


def _safe_mean(values: Iterable[float | None]) -> float | None:
    xs = [v for v in values if isinstance(v, (int, float)) and not math.isnan(v)]
    return round(mean(xs), 3) if xs else None


def _safe_median(values: Iterable[float | None]) -> float | None:
    xs = [v for v in values if isinstance(v, (int, float)) and not math.isnan(v)]
    return round(median(xs), 3) if xs else None


def _quality(records: list[dict[str, Any]]) -> tuple[int, int, int, int]:
    """TP, FP, FN, TN в привязке к defect_match в records."""
    tp = fp = fn = tn = 0
    for r in records:
        truth = r.get("defect_class_truth")
        pred = r.get("defect_class_pred")
        if truth and pred and r.get("defect_match"):
            tp += 1
        elif truth and not pred:
            fn += 1
        elif not truth and pred:
            fp += 1
        elif not truth and not pred:
            tn += 1
        elif truth and pred and not r.get("defect_match"):
            fp += 1  # предсказал не тот класс — считаем это false-positive по этому классу
            fn += 1
    return tp, fp, fn, tn


def _precision(tp: int, fp: int) -> float | None:
    return round(tp / (tp + fp), 3) if (tp + fp) > 0 else None


def _recall(tp: int, fn: int) -> float | None:
    return round(tp / (tp + fn), 3) if (tp + fn) > 0 else None


def _summarise(records: list[dict[str, Any]]) -> dict[str, Any]:
    tp, fp, fn, tn = _quality(records)
    return {
        "n": len(records),
        "errors": sum(1 for r in records if r.get("error")),
        "e2e_latency_p50": _safe_median(r.get("latency_seconds") for r in records),
        "e2e_latency_mean": _safe_mean(r.get("latency_seconds") for r in records),
        "vram_mib_mean": _safe_mean(r.get("vram_mib_after") for r in records),
        "defect_precision": _precision(tp, fp),
        "defect_recall": _recall(tp, fn),
        "command_match_rate": _safe_mean(
            1.0 if r.get("command_match") else 0.0 for r in records if r.get("command_truth")
        ),
        "avg_cost_usd": _safe_mean(r.get("cost_usd") for r in records),
        "tp": tp,
        "fp": fp,
        "fn": fn,
        "tn": tn,
    }


def _render_table(summaries: dict[str, dict[str, Any]]) -> str:
    columns = list(summaries.keys())
    rows = [
        ("N (cases)", "n"),
        ("Errors", "errors"),
        ("E2E latency p50 (s)", "e2e_latency_p50"),
        ("E2E latency mean (s)", "e2e_latency_mean"),
        ("VRAM средний (MiB)", "vram_mib_mean"),
        ("Defect precision", "defect_precision"),
        ("Defect recall", "defect_recall"),
        ("Command match rate", "command_match_rate"),
        ("Cost / query (USD)", "avg_cost_usd"),
        ("TP / FP / FN / TN", None),
    ]
    lines = ["| Метрика | " + " | ".join(columns) + " |"]
    lines.append("|---|" + "|".join(["---"] * len(columns)) + "|")
    for label, key in rows:
        if key is None:
            cells = [f"{summaries[c]['tp']} / {summaries[c]['fp']} / {summaries[c]['fn']} / {summaries[c]['tn']}" for c in columns]
        else:
            cells = [str(summaries[c].get(key)) for c in columns]
        lines.append(f"| {label} | " + " | ".join(cells) + " |")
    return "\n".join(lines)


def _update_markdown(md_path: Path, table: str) -> None:
    if not md_path.exists():
        md_path.parent.mkdir(parents=True, exist_ok=True)
        md_path.write_text(f"# Qwen 3.6-35B-A3B vs Gemma 4 31B\n\n{MARKER_START}\n{table}\n{MARKER_END}\n")
        return
    text = md_path.read_text()
    block = f"{MARKER_START}\n{table}\n{MARKER_END}"
    if MARKER_START in text and MARKER_END in text:
        text = re.sub(
            re.escape(MARKER_START) + r".*?" + re.escape(MARKER_END),
            block,
            text,
            count=1,
            flags=re.DOTALL,
        )
    else:
        text = text.rstrip() + "\n\n" + block + "\n"
    md_path.write_text(text)


def _write_csv(csv_path: Path, summaries: dict[str, dict[str, Any]]) -> None:
    csv_path.parent.mkdir(parents=True, exist_ok=True)
    fields = ["model", "n", "errors", "e2e_latency_p50", "e2e_latency_mean", "vram_mib_mean",
              "defect_precision", "defect_recall", "command_match_rate", "avg_cost_usd",
              "tp", "fp", "fn", "tn"]
    with csv_path.open("w", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=fields)
        writer.writeheader()
        for model, summary in summaries.items():
            row = {"model": model, **{k: summary.get(k) for k in fields if k != "model"}}
            writer.writerow(row)


def main(argv: list[str]) -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("inputs", nargs="+", type=Path, help="JSONL-вывод bench_roboqc.py")
    p.add_argument("--out", type=Path, default=Path("docs/benchmarks"))
    args = p.parse_args(argv)

    summaries: dict[str, dict[str, Any]] = {}
    for path in args.inputs:
        records = _read(path)
        if not records:
            continue
        model = records[0].get("model") or path.stem
        summaries[model] = _summarise(records)

    if not summaries:
        print("no records to aggregate")
        return 2

    table = _render_table(summaries)
    _update_markdown(args.out / "qwen-vs-gemma.md", table)
    _write_csv(args.out / "qwen-vs-gemma.csv", summaries)
    print(table)
    return 0


if __name__ == "__main__":
    import sys

    sys.exit(main(sys.argv[1:]))
