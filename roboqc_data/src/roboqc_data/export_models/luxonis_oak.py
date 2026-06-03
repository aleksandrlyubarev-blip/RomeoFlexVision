"""Luxonis OAK 4 export adapter.

Luxonis OAK 4 cameras run on Robotics Vision Core 4 silicon and ship
with 52 TOPs of on-camera inference, IP67, hardware-accelerated stereo
depth, and direct YOLO-family / YOLO-World support (NotebookLM review
refs [1–5, 15–18]).

The standard recipe is:

1. Train YOLO (or RT-DETR) via :class:`roboqc_data.train.YoloAdapter`.
2. Export the ``.pt`` to ONNX with our :class:`ONNXExportAdapter`.
3. Convert that ONNX into the on-camera archive format via
   ``luxonis/tools`` (`tools convert ...`). The archive bundles the
   blob + metadata that DepthAI's neural-network nodes load.

This adapter wraps step 3. It shells out to the ``tools`` CLI if it is
available on ``PATH``; otherwise it returns
``ExportArtifact(status="skipped")`` so dependents can introspect
without pulling the optional dep.
"""

from __future__ import annotations

import shutil
import subprocess
from pathlib import Path

from .base import ExportArtifact, ExportConfig, skipped_artifact


class LuxonisOakExportAdapter:
    name = "luxonis_oak"

    def export(self, model_uri: str, cfg: ExportConfig) -> ExportArtifact:
        if cfg.target != "luxonis_oak":
            return skipped_artifact(
                self.name,
                cfg.target,
                "wrong target for LuxonisOakExportAdapter",
            )
        scheme, _, path = model_uri.partition("://")
        if scheme != "onnx" or not path:
            return skipped_artifact(
                self.name,
                cfg.target,
                "Luxonis OAK export expects an onnx:// model_uri",
            )

        tools = shutil.which("tools")
        if tools is None:
            return skipped_artifact(
                self.name,
                cfg.target,
                "luxonis/tools CLI ('tools') not on PATH",
            )

        onnx_path = Path(path)
        out_dir = Path(str(cfg.extra.get("workdir", onnx_path.parent / "oak")))
        out_dir.mkdir(parents=True, exist_ok=True)
        archive_path = out_dir / f"{onnx_path.stem}.nnarchive"
        cmd = [
            tools,
            "convert",
            "onnx",
            str(onnx_path),
            "--output-dir",
            str(out_dir),
            "--imgsz",
            str(cfg.image_size),
        ]
        if cfg.fp16:
            cmd.append("--fp16")
        try:
            subprocess.run(cmd, check=True, capture_output=True)  # pragma: no cover
        except subprocess.CalledProcessError as exc:  # pragma: no cover
            return skipped_artifact(
                self.name,
                cfg.target,
                f"luxonis/tools failed: {exc.stderr.decode(errors='ignore')[-200:]}",
            )

        return ExportArtifact(  # pragma: no cover
            adapter=self.name,
            target="luxonis_oak",
            output_path=archive_path,
            status="ok",
        )
