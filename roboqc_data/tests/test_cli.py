import json

from typer.testing import CliRunner

from roboqc_data.cli.main import app

from _fixtures import make_mvtec_ad_tree


runner = CliRunner()


def test_cli_ingest_to_coco_roundtrip(tmp_path):
    root = make_mvtec_ad_tree(tmp_path / "raw")
    manifest_dir = tmp_path / "manifest"

    ingest_result = runner.invoke(
        app,
        ["ingest", "mvtec_ad", "--root", str(root), "--out", str(manifest_dir), "--seed", "11"],
    )
    assert ingest_result.exit_code == 0, ingest_result.output
    payload = json.loads(ingest_result.output.strip().splitlines()[-1])
    assert payload["count"] == 3

    coco_path = tmp_path / "coco.json"
    export_result = runner.invoke(
        app,
        [
            "export",
            "--manifest", str(manifest_dir / "manifest.json"),
            "--format", "coco",
            "--out", str(coco_path),
        ],
    )
    assert export_result.exit_code == 0, export_result.output
    assert coco_path.is_file()


def test_cli_synth_creates_artifacts(tmp_path):
    import numpy as np
    from PIL import Image

    clean = tmp_path / "clean.png"
    Image.fromarray(np.full((48, 48, 3), 100, dtype=np.uint8)).save(clean)

    out_dir = tmp_path / "synth"
    result = runner.invoke(
        app,
        [
            "synth",
            "--target", "connector_damage",
            "--clean", str(clean),
            "--count", "2",
            "--seed", "3",
            "--out", str(out_dir),
        ],
    )
    assert result.exit_code == 0, result.output
    payload = json.loads(result.output.strip().splitlines()[-1])
    assert payload["artifacts"] == 2
    assert (out_dir / "manifest" / "manifest.json").is_file()
