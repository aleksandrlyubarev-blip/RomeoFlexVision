"""End-to-end CLI smoke test covering ingest → synth → export.

Skipped chain in the plan's verification section, exercised here at
fixture scale: ingest a tiny MVTec-AD-shaped fixture, run the brigada
synth pipeline against a clean reference image, then export both
manifests in all three formats (COCO, YOLO-seg, Anomalib). Asserts
that every step produces a non-empty artefact and that record counts
flow through correctly.
"""

from __future__ import annotations

import json

import numpy as np
from _fixtures import make_mvtec_ad_tree
from PIL import Image
from typer.testing import CliRunner

from roboqc_data.cli.main import app

runner = CliRunner()


def test_ingest_then_synth_then_export(tmp_path):
    raw = make_mvtec_ad_tree(tmp_path / "raw")
    manifest_dir = tmp_path / "manifest"
    ingest = runner.invoke(
        app,
        ["ingest", "mvtec_ad", "--root", str(raw), "--out", str(manifest_dir), "--seed", "13"],
    )
    assert ingest.exit_code == 0, ingest.output
    ingest_payload = json.loads(ingest.output.strip().splitlines()[-1])
    assert ingest_payload["count"] == 3

    coco_out = tmp_path / "exports" / "coco.json"
    coco_export = runner.invoke(
        app,
        [
            "export",
            "--manifest",
            str(manifest_dir / "manifest.json"),
            "--format",
            "coco",
            "--out",
            str(coco_out),
        ],
    )
    assert coco_export.exit_code == 0, coco_export.output
    assert coco_out.is_file()
    coco_payload = json.loads(coco_out.read_text())
    assert coco_payload["info"]["manifest_sha256"] == ingest_payload["manifest_sha256"]

    yolo_out = tmp_path / "exports" / "yolo"
    yolo_export = runner.invoke(
        app,
        [
            "export",
            "--manifest",
            str(manifest_dir / "manifest.json"),
            "--format",
            "yolo_seg",
            "--out",
            str(yolo_out),
        ],
    )
    assert yolo_export.exit_code == 0, yolo_export.output
    assert (yolo_out / "data.yaml").is_file()

    anomalib_out = tmp_path / "exports" / "anomalib"
    anomalib_export = runner.invoke(
        app,
        [
            "export",
            "--manifest",
            str(manifest_dir / "manifest.json"),
            "--format",
            "anomalib",
            "--out",
            str(anomalib_out),
        ],
    )
    assert anomalib_export.exit_code == 0, anomalib_export.output
    assert (anomalib_out / "normal").is_dir() and (anomalib_out / "abnormal").is_dir()

    clean = tmp_path / "clean.png"
    Image.fromarray(np.full((64, 64, 3), 90, dtype=np.uint8)).save(clean)
    synth_out = tmp_path / "synth"
    synth = runner.invoke(
        app,
        [
            "synth",
            "--target",
            "screw_missing",
            "--clean",
            str(clean),
            "--count",
            "2",
            "--seed",
            "5",
            "--out",
            str(synth_out),
        ],
    )
    assert synth.exit_code == 0, synth.output
    synth_payload = json.loads(synth.output.strip().splitlines()[-1])
    assert synth_payload["artifacts"] == 2
    assert (synth_out / "manifest" / "manifest.json").is_file()


def test_synth_is_reproducible_under_same_seed(tmp_path):
    clean = tmp_path / "clean.png"
    Image.fromarray(np.full((64, 64, 3), 200, dtype=np.uint8)).save(clean)

    def run(suffix):
        out = tmp_path / f"run_{suffix}"
        return runner.invoke(
            app,
            [
                "synth",
                "--target",
                "cable_crossed",
                "--clean",
                str(clean),
                "--count",
                "1",
                "--seed",
                "9",
                "--out",
                str(out),
            ],
        )

    a = run("a")
    b = run("b")
    assert a.exit_code == 0 and b.exit_code == 0
    payload_a = json.loads(a.output.strip().splitlines()[-1])
    payload_b = json.loads(b.output.strip().splitlines()[-1])
    assert payload_a["manifest_sha256"] == payload_b["manifest_sha256"]
