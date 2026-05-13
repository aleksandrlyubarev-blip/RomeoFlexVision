"""License registry for public datasets.

Every emitted ImageRecord carries ``source.license`` so downstream
consumers can filter redistributable / commercial-use subsets without
re-reading dataset docs.
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, ConfigDict


class LicenseInfo(BaseModel):
    model_config = ConfigDict(strict=True, frozen=True)

    name: str
    spdx: Optional[str]
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

REGISTRY: dict[str, LicenseInfo] = {
    "mvtec_ad": MVTEC_AD,
    "mvtec_loco": MVTEC_LOCO,
    "visa": VISA,
    "isp_ad": ISP_AD,
    "pku_pcb": PKU_PCB,
    "dagm_2007": DAGM_2007,
}
