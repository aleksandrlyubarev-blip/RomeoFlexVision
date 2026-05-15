"""Typer CLI for roboqc-data."""

from __future__ import annotations

import asyncio
import json
import random
from pathlib import Path

import numpy as np
import typer

from ..brigada.orchestrator import BrigadaSynthesizer, SynthRequest
from ..export.anomalib_folder import manifest_to_anomalib_folder
from ..export.coco import write_coco
from ..export.yolo_seg import manifest_to_yolo_seg
from ..ingest.base import write_manifest_jsonl
from ..ingest.isp_ad import ISPADAdapter
from ..ingest.mvtec_ad import MVTecADAdapter
from ..ingest.mvtec_ad_2 import MVTecAD2Adapter
from ..ingest.mvtec_loco import MVTecLOCOAdapter
from ..ingest.pku_pcb import PKUPCBAdapter
from ..ingest.real_iad_d3 import RealIADD3Adapter
from ..ingest.visa import VisAAdapter
from ..logic.logic_qa import HeuristicLogicQa
from ..logic.velm import VelmPipeline
from ..schema.records import Manifest
from ..schema.splits import SplitSpec
from ..schema.taxonomy import DefectClass

app = typer.Typer(no_args_is_help=True, help="RoboQC dataset tooling")

ADAPTERS = {
    "mvtec_ad": MVTecADAdapter,
    "mvtec_ad_2": MVTecAD2Adapter,
    "mvtec_loco": MVTecLOCOAdapter,
    "visa": VisAAdapter,
    "isp_ad": ISPADAdapter,
    "pku_pcb": PKUPCBAdapter,
    "real_iad_d3": RealIADD3Adapter,
}


def _seed_world(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)


@app.command()
def ingest(
    dataset: str = typer.Argument(..., help=f"One of: {sorted(ADAPTERS)}"),
    root: Path = typer.Option(..., exists=True, file_okay=False, help="Path to mounted dataset root"),
    out: Path = typer.Option(..., help="Output directory for manifest.json + records.jsonl"),
    seed: int = typer.Option(0),
) -> None:
    """Walk a public dataset and emit a canonical Manifest."""
    if dataset not in ADAPTERS:
        raise typer.BadParameter(f"unknown dataset: {dataset}")
    _seed_world(seed)
    adapter = ADAPTERS[dataset]()
    manifest = adapter.build_manifest(root, SplitSpec(seed=seed))
    manifest_path, records_path = write_manifest_jsonl(manifest, out)
    typer.echo(
        json.dumps(
            {
                "manifest": str(manifest_path),
                "records": str(records_path),
                "manifest_sha256": manifest.manifest_sha256,
                "count": len(manifest.records),
            }
        )
    )


@app.command()
def synth(
    target: str = typer.Option(..., help="DefectClass enum value, e.g. connector_damage"),
    clean: Path = typer.Option(..., exists=True, dir_okay=False),
    count: int = typer.Option(3, min=1, max=1000),
    seed: int = typer.Option(0),
    out: Path = typer.Option(..., help="Output directory for synth artifacts + manifest"),
) -> None:
    """Run the brigada synthesizer for a single defect class."""
    _seed_world(seed)
    defect = DefectClass(target)
    request = SynthRequest(
        clean_image_path=clean,
        target_class=defect,
        count=count,
        seed=seed,
        output_dir=out,
    )
    result = asyncio.run(BrigadaSynthesizer().generate(request))
    manifest_path, records_path = write_manifest_jsonl(result.manifest, out / "manifest")
    typer.echo(
        json.dumps(
            {
                "manifest": str(manifest_path),
                "records": str(records_path),
                "manifest_sha256": result.manifest.manifest_sha256,
                "artifacts": len(result.artifacts),
            }
        )
    )


@app.command()
def export(
    manifest: Path = typer.Option(..., exists=True, dir_okay=False, help="Path to manifest.json"),
    records: Path | None = typer.Option(None, help="Path to records.jsonl (defaults to sibling of manifest)"),
    format: str = typer.Option("coco", help="One of: coco, yolo_seg, anomalib"),
    out: Path = typer.Option(..., help="Output path (file for coco, dir for others)"),
) -> None:
    """Convert a canonical Manifest into a trainer-native layout."""
    header = json.loads(manifest.read_text())
    records_path = records or manifest.with_name("records.jsonl")
    lines = records_path.read_text().splitlines()
    payload = {**header, "records": [json.loads(line) for line in lines if line.strip()]}
    full = Manifest.model_validate_json(json.dumps(payload))

    if format == "coco":
        result_path = write_coco(full, out)
    elif format == "yolo_seg":
        result_path = manifest_to_yolo_seg(full, out)
    elif format == "anomalib":
        result_path = manifest_to_anomalib_folder(full, out)
    else:
        raise typer.BadParameter(f"unknown format: {format}")
    typer.echo(json.dumps({"output": str(result_path), "count": len(full.records)}))


@app.command()
def velm(
    image: str = typer.Option(..., help="Image URI (file://... or path)"),
    score_threshold: float = typer.Option(0.5, min=0.0, max=1.0),
) -> None:
    """Run the VELM pixel-expert + VLM-classifier pipeline against one image.

    Uses the deterministic stand-ins by default — production code wires
    a router-backed classifier via :func:`roboqc_data.inspection_client.build_velm_api_services`.
    """
    pipeline = VelmPipeline(score_threshold=score_threshold)
    result = asyncio.run(pipeline.run(image))
    typer.echo(
        json.dumps(
            {
                "image_uri": result.image_uri,
                "overall_pass": result.overall_pass,
                "verdicts": [
                    {
                        "defect_class": v.defect_class.value,
                        "severity": v.severity,
                        "rework": v.rework,
                        "score": v.candidate.score,
                    }
                    for v in result.verdicts
                ],
            }
        )
    )


@app.command(name="logic-qa")
def logic_qa(
    refs: list[str] = typer.Option(..., "--ref", help="Reference image URI (repeat for multiple)"),
    test: str = typer.Option(..., help="Test image URI"),
) -> None:
    """Run the heuristic LogicQA flow (synthesise checklist then inspect)."""
    qa = HeuristicLogicQa()
    checklist = asyncio.run(qa.synthesise(list(refs)))
    result = asyncio.run(qa.inspect(test, list(checklist)))
    typer.echo(
        json.dumps(
            {
                "test_image_uri": test,
                "overall_pass": result.overall_pass,
                "defect_class": result.defect_class.value,
                "checks": [c.question for c in checklist],
                "findings": [
                    {"question": f.question, "answer": f.answer, "explanation": f.explanation} for f in result.findings
                ],
            }
        )
    )


if __name__ == "__main__":  # pragma: no cover
    app()
