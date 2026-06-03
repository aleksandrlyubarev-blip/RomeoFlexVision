"""Base classes for public-dataset ingest adapters.

Each adapter knows how to walk a pre-mounted dataset root and emit
:class:`roboqc_data.schema.records.ImageRecord` instances. Adapters
deliberately do *not* download data — that is left to the operator,
so licensing is an explicit choice.
"""

from __future__ import annotations

import abc
from collections.abc import Iterable
from datetime import UTC, datetime
from pathlib import Path
from typing import Protocol
from uuid import uuid4

from PIL import Image

from ..schema.hashing import manifest_digest, sha256_file
from ..schema.records import ImageRecord, Manifest
from ..schema.splits import SplitSpec
from ..schema.taxonomy import TAXONOMY_VERSION
from .licenses import LicenseInfo


class DatasetAdapter(Protocol):
    """Structural type every dataset adapter conforms to."""

    name: str
    license_info: LicenseInfo

    def discover(self, root: Path) -> Iterable[Path]: ...
    def to_record(self, raw: Path, root: Path, split_spec: SplitSpec) -> ImageRecord: ...
    def build_manifest(self, root: Path, split_spec: SplitSpec) -> Manifest: ...


class BaseAdapter(abc.ABC):
    """Shared scaffolding for adapters.

    Subclasses implement :meth:`discover` and :meth:`to_record`. The
    base class handles split assignment, manifest framing, and digest
    computation.
    """

    name: str
    license_info: LicenseInfo

    @abc.abstractmethod
    def discover(self, root: Path) -> Iterable[Path]:
        """Yield raw image paths under ``root``."""

    @abc.abstractmethod
    def to_record(self, raw: Path, root: Path, split_spec: SplitSpec) -> ImageRecord:
        """Convert a single raw path into a canonical ImageRecord."""

    def build_manifest(self, root: Path, split_spec: SplitSpec) -> Manifest:
        """Walk ``root`` and assemble a complete Manifest."""
        records: list[ImageRecord] = []
        for raw in self.discover(root):
            records.append(self.to_record(raw, root, split_spec))
        digest = manifest_digest((r.record_id, r.sha256) for r in records)
        return Manifest(
            manifest_id=f"{self.name}-{uuid4().hex[:8]}",
            created_at=datetime.now(tz=UTC),
            seed=split_spec.seed,
            taxonomy_version=TAXONOMY_VERSION,
            manifest_sha256=digest,
            records=tuple(records),
        )

    @staticmethod
    def _image_dims(path: Path) -> tuple[int, int]:
        with Image.open(path) as img:
            return img.width, img.height

    @staticmethod
    def _hash_file(path: Path) -> str:
        return sha256_file(path)


def write_manifest_jsonl(manifest: Manifest, out_dir: Path) -> tuple[Path, Path]:
    """Persist a Manifest to disk as ``manifest.json`` + ``records.jsonl``.

    Returns the (manifest_path, records_path) tuple.
    """
    out_dir.mkdir(parents=True, exist_ok=True)
    records_path = out_dir / "records.jsonl"
    with records_path.open("w", encoding="utf-8") as fh:
        for record in manifest.records:
            fh.write(record.model_dump_json())
            fh.write("\n")
    header = manifest.model_copy(update={"records": ()})
    manifest_path = out_dir / "manifest.json"
    manifest_path.write_text(header.model_dump_json(indent=2), encoding="utf-8")
    return manifest_path, records_path
