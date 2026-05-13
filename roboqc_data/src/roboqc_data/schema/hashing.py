"""Content + manifest hashing helpers.

All hashes are SHA-256 hex digests. We hash file *contents* for image
records and the *sorted (record_id, content_sha256) pairs* for whole
manifests — this gives reproducible identity that survives reordering
during ingestion.
"""

from __future__ import annotations

import hashlib
from pathlib import Path
from typing import Iterable


def sha256_bytes(data: bytes) -> str:
    """SHA-256 hex digest of raw bytes."""
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: str | Path, chunk_size: int = 1 << 20) -> str:
    """SHA-256 hex digest of a file's contents, streamed in chunks."""
    digest = hashlib.sha256()
    with Path(path).open("rb") as fh:
        while True:
            chunk = fh.read(chunk_size)
            if not chunk:
                break
            digest.update(chunk)
    return digest.hexdigest()


def manifest_digest(records: Iterable[tuple[str, str]]) -> str:
    """Stable digest over manifest records.

    Args:
        records: iterable of ``(record_id, content_sha256)`` pairs.

    The pairs are sorted by ``record_id`` before hashing so two
    manifests with the same content but different ingest order produce
    the same digest. This is the reproducibility check called out in
    the plan's verification section.
    """
    h = hashlib.sha256()
    for record_id, content_sha in sorted(records, key=lambda r: r[0]):
        h.update(record_id.encode("utf-8"))
        h.update(b"\x00")
        h.update(content_sha.encode("utf-8"))
        h.update(b"\n")
    return h.hexdigest()
