"""License registry for public datasets.

Every emitted ImageRecord carries ``source.license`` so downstream
consumers can filter redistributable / commercial-use subsets without
re-reading dataset docs.
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class LicenseInfo(BaseModel):
    model_config = ConfigDict(strict=True, frozen=True)

    name: str
    spdx: str | None
    url: str
    redistributable: bool
    commercial_use: bool


MVTEC_AD = LicenseInfo(
    name="MVTec AD",
    spdx=None,
    url="https://www.mvtec.com/company/research/datasets/mvtec-ad/license-mvtec-ad",
    redistributable=False,
    commercial_use=False,
)

# MVTec AD 2 (2026) — arXiv:2503.21622 / IJCV 2026.
# Same MVTec research-only license family as the original.
MVTEC_AD_2 = LicenseInfo(
    name="MVTec AD 2",
    spdx=None,
    url="https://www.mvtec.com/company/research/datasets/mvtec-ad-2",
    redistributable=False,
    commercial_use=False,
)

MVTEC_LOCO = LicenseInfo(
    name="MVTec LOCO",
    spdx=None,
    url="https://www.mvtec.com/company/research/datasets/mvtec-loco",
    redistributable=False,
    commercial_use=False,
)

VISA = LicenseInfo(
    name="VisA CC BY 4.0",
    spdx="CC-BY-4.0",
    url="https://github.com/amazon-science/spot-diff",
    redistributable=True,
    commercial_use=True,
)

ISP_AD = LicenseInfo(
    name="ISP-AD",
    spdx=None,
    url="https://arxiv.org/abs/2503.04997",
    redistributable=True,
    commercial_use=False,
)

PKU_PCB = LicenseInfo(
    name="PKU-Market-PCB",
    spdx=None,
    url="https://robotics.pkusz.edu.cn/resources/dataset/",
    redistributable=True,
    commercial_use=False,
)

DAGM_2007 = LicenseInfo(
    name="DAGM 2007",
    spdx=None,
    url="https://www.kaggle.com/datasets/mhskjelvareid/dagm-2007-competition-dataset-optical-inspection",
    redistributable=True,
    commercial_use=True,
)

# Real-IAD D3 (2025+) — multimodal industrial anomaly dataset with
# 2D RGB, micrometre 3D point clouds, and photometric-stereo pseudo-3D
# depth. Used in NotebookLM-reviewed paper [41] for topology-heavy
# defects (PCB solder bridges, micrometre dents, etc.).
REAL_IAD_D3 = LicenseInfo(
    name="Real-IAD D3",
    spdx=None,
    url="https://realiad4ad.github.io/",
    redistributable=True,
    commercial_use=False,
)

REGISTRY: dict[str, LicenseInfo] = {
    "mvtec_ad": MVTEC_AD,
    "mvtec_ad_2": MVTEC_AD_2,
    "mvtec_loco": MVTEC_LOCO,
    "visa": VISA,
    "isp_ad": ISP_AD,
    "pku_pcb": PKU_PCB,
    "dagm_2007": DAGM_2007,
    "real_iad_d3": REAL_IAD_D3,
}
