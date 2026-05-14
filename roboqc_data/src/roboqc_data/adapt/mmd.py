"""MMD-based unsupervised domain adaptation.

NotebookLM review [38, 40] highlighted Maximum Mean Discrepancy (MMD)
regularisation as a low-friction way to handle plant drift — varying
illumination, vibration-blurred frames, pollen / dust over the lens —
without rebuilding the detector. The published recipe is to inject an
MMD loss between source-domain and target-domain feature maps during
training; no architecture surgery, just an extra term.

This module exposes a small Protocol + computation primitive so a
future PR can wire it into the YOLO / RT-DETR training loops once we
have target-domain frames from a pilot. Heavy ML deps stay optional.
"""

from __future__ import annotations

from typing import Any, Protocol

from pydantic import BaseModel, ConfigDict, Field


class MMDConfig(BaseModel):
    """Configuration for MMD-regularised domain adaptation."""

    model_config = ConfigDict(strict=True)

    weight: float = Field(default=0.1, ge=0.0)
    kernel: str = "gaussian"
    sigmas: tuple[float, ...] = (1.0, 2.0, 4.0, 8.0, 16.0)


def gaussian_kernel_mmd(source: Any, target: Any, cfg: MMDConfig | None = None) -> Any:
    """Compute multi-bandwidth Gaussian MMD between two feature batches.

    Args:
        source: ``[N, D]`` tensor — feature batch from the source
            (training) domain.
        target: ``[M, D]`` tensor — feature batch from the target
            (production) domain.
        cfg: optional :class:`MMDConfig`. Default kernel is the
            multi-bandwidth Gaussian from the original Long et al.
            recipe.

    Returns:
        Scalar tensor with the MMD distance. Caller multiplies by
        ``cfg.weight`` and adds to the task loss.

    Raises:
        RuntimeError: if torch is not installed (heavy dep behind the
            ``[train]`` extra).
    """
    try:
        import torch  # type: ignore
    except Exception as exc:  # pragma: no cover - exercised without torch
        raise RuntimeError("torch is required for gaussian_kernel_mmd") from exc

    config = cfg or MMDConfig()
    src = source.flatten(1)
    tgt = target.flatten(1)
    n, m = src.size(0), tgt.size(0)
    xx = torch.cdist(src, src) ** 2
    yy = torch.cdist(tgt, tgt) ** 2
    xy = torch.cdist(src, tgt) ** 2
    loss = src.new_zeros(())
    for sigma in config.sigmas:
        denom = 2.0 * float(sigma) ** 2
        loss = loss + xx.div(denom).neg().exp().sum() / (n * n)
        loss = loss + yy.div(denom).neg().exp().sum() / (m * m)
        loss = loss - 2.0 * xy.div(denom).neg().exp().sum() / (n * m)
    return loss / float(len(config.sigmas))


class DomainAdapter(Protocol):
    """Adapter that mixes a task loss with a domain-discrepancy term."""

    name: str

    def loss(self, task_loss: Any, source_feats: Any, target_feats: Any) -> Any: ...


class MMDDomainAdapter:
    """Adds MMD regularisation to an arbitrary task loss."""

    name = "mmd"

    def __init__(self, cfg: MMDConfig | None = None) -> None:
        self.cfg = cfg or MMDConfig()

    def loss(self, task_loss: Any, source_feats: Any, target_feats: Any) -> Any:
        mmd = gaussian_kernel_mmd(source_feats, target_feats, self.cfg)
        return task_loss + self.cfg.weight * mmd
