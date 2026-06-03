"""TensorRT engine build from an ONNX file.

Wraps ``trtexec`` because the Python TensorRT API requires the right
GPU driver on the build host and is not pip-installable on every CI
runner. The adapter shells out to ``trtexec`` if it is available and
returns ``status="skipped"`` otherwise.
"""

from __future__ import annotations

import shutil
import subprocess
from pathlib import Path

from .base import ExportArtifact, ExportConfig, skipped_artifact


class TensorRTExportAdapter:
    name = "tensorrt"

    def export(self, model_uri: str, cfg: ExportConfig) -> ExportArtifact:
        if cfg.target != "tensorrt":
            return skipped_artifact(self.name, cfg.target, "wrong target for TensorRTExportAdapter")
        scheme, _, path = model_uri.partition("://")
        if scheme != "onnx" or not path:
            return skipped_artifact(self.name, cfg.target, "TensorRT export expects an onnx:// model_uri")

        trtexec = shutil.which("trtexec")
        if trtexec is None:
            return skipped_artifact(self.name, cfg.target, "trtexec not on PATH")

        onnx_path = Path(path)
        engine_path = onnx_path.with_suffix(".engine")
        cmd = [
            trtexec,
            f"--onnx={onnx_path}",
            f"--saveEngine={engine_path}",
            f"--workspace={cfg.workspace_mb}",
        ]
        if cfg.fp16:
            cmd.append("--fp16")
        try:
            subprocess.run(cmd, check=True, capture_output=True)  # pragma: no cover
        except subprocess.CalledProcessError as exc:  # pragma: no cover
            return skipped_artifact(
                self.name,
                cfg.target,
                f"trtexec failed: {exc.stderr.decode(errors='ignore')[-200:]}",
            )

        return ExportArtifact(  # pragma: no cover
            adapter=self.name,
            target="tensorrt",
            output_path=engine_path,
            status="ok",
        )
